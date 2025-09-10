import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import Swal from 'sweetalert2';
import { baseURL } from '../../Utils/URLS';

const WarehouseManagerScanner = () => {
  const [scannedItems, setScannedItems] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerInstance, setScannerInstance] = useState(null);
  const [inventoryStats, setInventoryStats] = useState({
    totalReceived: 0,
    todayReceived: 0,
    pendingItems: 0
  });
  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState('camera');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchInventoryStats();
  }, []);

  useEffect(() => {
    if (isScanning && !scannerInstance && scanMode === 'camera') {
      initializeScanner();
    }
    return () => {
      if (scannerInstance) {
        Promise.resolve(scannerInstance.clear()).catch(() => {});
      }
    };
  }, [isScanning, scanMode]);

  const fetchInventoryStats = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/v1/warehouse/inventory`, { withCredentials: true });
      if (response.data.result) {
        setInventoryStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
    }
  };

  const initializeScanner = () => {
    try {
      const scanner = new Html5QrcodeScanner(
        'warehouse-qr-scanner',
        { fps: 10, qrbox: { width: 280, height: 280 }, rememberLastUsedCamera: true, disableFlip: true, aspectRatio: 1.0 },
        false
      );
      scanner.render(
        (decodedText) => handleScanSuccess(decodedText),
        () => {} // ignore expected per-frame failures
      );
      setScannerInstance(scanner);
    } catch (error) {
      console.error('Scanner initialization error:', error);
      Swal.fire('Error', 'Failed to initialize QR scanner', 'error');
    }
  };

  // Utility: robust file-like check (avoids cross-realm instanceof issues)
  const isFileLike = (f) =>
    !!f &&
    typeof f === 'object' &&
    typeof f.name === 'string' &&
    typeof f.type === 'string' &&
    typeof f.size === 'number' &&
    typeof f.arrayBuffer === 'function';

  // Change handler: iterate FileList with for...of and scan sequentially
  const handleFileInputChange = async (e) => {
    const input = e?.currentTarget || e?.target || null;
    const files = input?.files || fileInputRef.current?.files || null; // HTMLInputElement.files -> FileList
    if (!files || files.length === 0) {
      Swal.fire('Error', 'No file selected', 'error');
      return;
    }

    try {
      setLoading(true);

      // Stop live camera scanning before file scans
      if (scannerInstance) {
        await scannerInstance.clear();
        setScannerInstance(null);
      }

      const html5QrCode = new Html5Qrcode('qr-reader');

      // Process each file sequentially with for...of (clean with async/await)
      for (const file of files) { // FileList is iterable with for...of
        if (!isFileLike(file)) {
          console.warn('Skipped non-file entry in FileList:', file?.name || '(unknown)');
          continue;
        }

        try {
          const decodedText = await html5QrCode.scanFile(file, true); // must be a File
          await handleScanSuccess(decodedText);
        } catch (scanErr) {
          console.warn('Scan failed for file:', file.name, scanErr);
          // Keep going to next file
        }
      }

      await html5QrCode.clear();
    } catch (err) {
      console.warn('Bulk file scan error:', err);
      Swal.fire('Error', 'Failed while scanning selected images', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setLoading(false);
    }
  };

  const handleScanSuccess = async (decodedText) => {
    try {
      let qrData;
      try {
        qrData = JSON.parse(decodedText);
      } catch {
        Swal.fire('Error', 'Invalid QR code content (not JSON)', 'error');
        return;
      }

      const alreadyScanned = scannedItems.find((item) => item.uniqueId === qrData.uniqueId);
      if (alreadyScanned) {
        Swal.fire('Warning', 'This carton has already been received!', 'warning');
        return;
      }

      if (!qrData.uniqueId || !(qrData.articleName || qrData.contractorInput?.articleName)) {
        Swal.fire('Error', 'Invalid QR code format', 'error');
        return;
      }

      const qualityCheck = await checkItemQuality(qrData);

      const response = await axios.post(
        `${baseURL}/api/v1/warehouse/scan/${qrData.uniqueId}`,
        {
          event: 'received',
          scannedBy: { userType: 'warehouse_inspector' },
          location: 'Main Warehouse',
          qualityCheck,
          notes: `Received at warehouse on ${new Date().toLocaleString()}`
        },
        { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.result) {
        const newItem = {
          uniqueId: qrData.uniqueId,
          articleName: qrData.articleName || qrData.contractorInput?.articleName,
          colors: qrData.contractorInput?.colors || qrData.colors,
          sizes: qrData.contractorInput?.sizes || qrData.sizes,
          cartonNumber: qrData.contractorInput?.cartonNumber || qrData.cartonNumber,
          scannedAt: new Date().toLocaleTimeString(),
          status: 'received',
          qualityStatus: qualityCheck.passed ? 'good' : 'damaged',
          qualityNotes: qualityCheck.notes || ''
        };

        setScannedItems((prev) => [...prev, newItem]);
        setInventoryStats((prev) => ({
          ...prev,
          totalReceived: prev.totalReceived + 1,
          todayReceived: prev.todayReceived + 1
        }));

        const qualityEmoji = qualityCheck.passed ? '✅' : '⚠️';
        const qualityText = qualityCheck.passed ? 'Good Condition' : 'Quality Issue Noted';
        Swal.fire({
          icon: qualityCheck.passed ? 'success' : 'warning',
          title: `${qualityEmoji} Carton Received!`,
          text: `${newItem.articleName} - Carton ${newItem.cartonNumber} (${qualityText})`,
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to process scan';
      Swal.fire('Error', msg, 'error');
    }
  };

  const checkItemQuality = async (qrData) => {
    const result = await Swal.fire({
      title: 'Quality Check',
      html: `
        <div style="text-align: left;">
          <p><strong>Article:</strong> ${qrData.articleName || qrData.contractorInput?.articleName}</p>
          <p><strong>Carton:</strong> #${qrData.contractorInput?.cartonNumber || 'N/A'}</p>
          <hr>
          <p style="margin-bottom: 10px;"><strong>Condition Assessment:</strong></p>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">
              <input type="radio" name="quality" value="good" checked> 
              ✅ Good Condition
            </label>
            <label style="display: block;">
              <input type="radio" name="quality" value="damaged"> 
              ⚠️ Damaged/Issues Found
            </label>
          </div>
          <textarea id="quality-notes" placeholder="Additional notes (optional)..." 
            style="width: 100%; height: 60px; margin-top: 10px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirm Receipt',
      cancelButtonText: 'Cancel Scan',
      preConfirm: () => {
        const qualityRadio = document.querySelector('input[name="quality"]:checked');
        const notes = document.getElementById('quality-notes').value;
        return { passed: qualityRadio?.value === 'good', condition: qualityRadio?.value || 'good', notes };
      }
    });
    if (result.isConfirmed) return result.value;
    throw new Error('Quality check cancelled');
  };

  const startScanning = () => setIsScanning(true);

  const stopScanning = () => {
    if (scannerInstance) {
      Promise.resolve(scannerInstance.clear()).catch(() => {});
      setScannerInstance(null);
    }
    setIsScanning(false);
  };

  const exportInventoryReport = async () => {
    try {
      setLoading(true);
      const reportContent = `
WAREHOUSE INVENTORY RECEIPT REPORT
==================================

Generated: ${new Date().toLocaleString()}
Total Items Processed Today: ${scannedItems.length}

RECEIVED ITEMS:
${scannedItems
  .map(
    (item, index) => `
${index + 1}. ${item.articleName}
   - Carton: #${item.cartonNumber}
   - Colors: ${Array.isArray(item.colors) ? item.colors.join(', ') : item.colors || 'N/A'}
   - Sizes: ${Array.isArray(item.sizes) ? item.sizes.join(', ') : item.sizes || 'N/A'}
   - Received: ${item.scannedAt}
   - Quality: ${item.qualityStatus}
   ${item.qualityNotes ? `   - Notes: ${item.qualityNotes}` : ''}`
  )
  .join('')}

SUMMARY:
- Good Condition: ${scannedItems.filter((item) => item.qualityStatus === 'good').length}
- Quality Issues: ${scannedItems.filter((item) => item.qualityStatus === 'damaged').length}
- Total Processed: ${scannedItems.length}

Report generated by Warehouse Management System
      `;
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Warehouse_Report_${new Date().toISOString().split('T')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      Swal.fire('Success', 'Report downloaded successfully!', 'success');
    } catch (error) {
      Swal.fire('Error', 'Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const removeScannedItem = (uniqueId) => {
    setScannedItems((prev) => prev.filter((item) => item.uniqueId !== uniqueId));
    setInventoryStats((prev) => ({
      ...prev,
      totalReceived: Math.max(0, prev.totalReceived - 1),
      todayReceived: Math.max(0, prev.todayReceived - 1)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">🏭 Warehouse Scanner</h1>
              <p className="text-gray-600 mt-2">Receive and inspect incoming cartons</p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="text-center bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Today Received</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-600">{inventoryStats.todayReceived}</div>
              </div>
              <div className="text-center bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Total Items</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-600">{scannedItems.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Scanner */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-0">📱 QR Scanner</h2>

              {/* Scan Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setScanMode('camera');
                    if (isScanning) stopScanning();
                  }}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    scanMode === 'camera' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📷 Camera
                </button>
                <button
                  onClick={() => {
                    setScanMode('upload');
                    if (isScanning) stopScanning();
                  }}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    scanMode === 'upload' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📁 Upload
                </button>
              </div>
            </div>

            {/* Scanner Controls */}
            <div className="mb-4">
              {scanMode === 'camera' ? (
                !isScanning ? (
                  <button
                    onClick={startScanning}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition duration-200 font-medium"
                  >
                    📷 Start Camera Scanner
                  </button>
                ) : (
                  <button
                    onClick={stopScanning}
                    className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition duration-200 font-medium"
                  >
                    ⏹️ Stop Scanner
                  </button>
                )
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileInputChange} // iterate FileList and scan each file
                    className="hidden"
                    id="qr-upload"
                  />
                  <label
                    htmlFor="qr-upload"
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-lg transition duration-200 font-medium cursor-pointer ${
                      loading ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gray-700 text-white hover:bg-gray-800'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing QR Image(s)...
                      </>
                    ) : (
                      <>📁 Upload QR Code Image(s)</>
                    )}
                  </label>
                  <div className="text-xs text-gray-500 mt-2 text-center">Supports JPG, PNG, WEBP; you can select multiple images</div>
                </div>
              )}
            </div>

            {/* Scanner Display */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[300px] sm:min-h-[350px]">
              {scanMode === 'camera' && isScanning ? (
                <div id="warehouse-qr-scanner" className="w-full"></div>
              ) : scanMode === 'upload' ? (
                <div className="text-center py-12">
                  <div className="text-4xl sm:text-6xl mb-4">📁</div>
                  <p className="text-gray-500">Upload QR Code Image(s)</p>
                  <p className="text-sm text-gray-400 mt-2">Click the button above to select files</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl sm:text-6xl mb-4">📦</div>
                  <p className="text-gray-500">Scanner ready for carton receipt</p>
                  <p className="text-sm text-gray-400">
                    {scanMode === 'camera' ? 'Click "Start Scanner" to begin' : 'Switch to Camera mode to use live scanner'}
                  </p>
                </div>
              )}
            </div>

            {/* Hidden div for QR file processing */}
            <div id="qr-reader" style={{ display: 'none' }}></div>
          </div>

          {/* Right Panel - Received Items */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-0">📋 Received Items</h2>
              <div className="text-sm text-gray-500">Today: {scannedItems.length} items</div>
            </div>

            <div className="space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
              {scannedItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-2">📥</div>
                  <p className="text-gray-500">No items received yet</p>
                  <p className="text-sm text-gray-400">
                    {scanMode === 'camera' ? 'Scan QR codes to add items here' : 'Upload QR images to add items here'}
                  </p>
                </div>
              ) : (
                scannedItems.map((item) => (
                  <div key={item.uniqueId} className="bg-gray-50 border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div className="flex-1 mb-3 sm:mb-0">
                        <div className="font-semibold text-gray-800 mb-2">{item.articleName}</div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><strong>Colors:</strong> {Array.isArray(item.colors) ? item.colors.join(', ') : item.colors}</div>
                          <div><strong>Sizes:</strong> {Array.isArray(item.sizes) ? item.sizes.join(', ') : item.sizes}</div>
                          <div><strong>Carton:</strong> #{item.cartonNumber}</div>
                          <div><strong>Received:</strong> {item.scannedAt}</div>
                          {item.qualityNotes && <div><strong>Notes:</strong> {item.qualityNotes}</div>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${item.qualityStatus === 'good' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {item.qualityStatus === 'good' ? '✅ Good' : '⚠️ Issues'}
                        </span>
                        <button onClick={() => removeScannedItem(item.uniqueId)} className="text-red-500 hover:text-red-700 p-1" title="Remove item">🗑️</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden container for file-based scanner */}
      <div id="qr-reader" style={{ display: 'none' }}></div>
    </div>
  );
};

export default WarehouseManagerScanner;
