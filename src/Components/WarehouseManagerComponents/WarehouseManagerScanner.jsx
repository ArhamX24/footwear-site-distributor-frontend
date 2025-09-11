import React, { useState, useEffect, useRef } from 'react';
import QrScanner from 'qr-scanner';
import axios from 'axios';
import Swal from 'sweetalert2';
import { baseURL } from '../../Utils/URLS';

const WarehouseManagerScanner = () => {
  const [scannedItems, setScannedItems] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [inventoryStats, setInventoryStats] = useState({
    totalReceived: 0,
    todayReceived: 0,
    pendingItems: 0
  });
  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState('camera');
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchInventoryStats();
  }, []);

  useEffect(() => {
    if (isScanning && videoRef.current && !scannerRef.current && scanMode === 'camera') {
      initializeScanner();
    }
    
    return () => {
      if (scannerRef.current && !isScanning) {
        cleanupScanner();
      }
    };
  }, [isScanning, scanMode]);

  const initializeScanner = async () => {
    try {
      const scanner = new QrScanner(
        videoRef.current,
        handleScanSuccess,
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
          maxScansPerSecond: 1,
        }
      );

      await scanner.start();
      scannerRef.current = scanner;
      setCameraPermission('granted');
    } catch (error) {
      console.error('Scanner initialization error:', error);
      setCameraPermission('denied');
      setIsScanning(false);
      
      Swal.fire({
        title: 'Camera Access Required',
        text: 'Please allow camera access to scan QR codes.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const cleanupScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
  };

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

  // ✅ Enhanced handleScanSuccess with better QR parsing
  const handleScanSuccess = async (decodedText) => {
    try {
      let qrData;
      
      try {
        if (typeof decodedText === 'string') {
          const trimmed = decodedText.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            qrData = JSON.parse(trimmed);
          } else {
            console.log('QR Content:', decodedText);
            Swal.fire({
              title: 'Invalid QR Code',
              html: `
                <p>This QR code doesn't contain the expected warehouse data format.</p>
                <p><strong>Content found:</strong></p>
                <code style="background: #f5f5f5; padding: 8px; border-radius: 4px; display: block; margin: 8px 0; word-break: break-all;">${decodedText}</code>
                <p>Please scan a valid warehouse inventory QR code.</p>
              `,
              icon: 'warning',
              confirmButtonText: 'OK'
            });
            return;
          }
        } else {
          qrData = decodedText;
        }
      } catch (jsonError) {
        console.log('JSON Parse Error:', jsonError);
        console.log('QR Content:', decodedText);
        Swal.fire({
          title: 'Invalid QR Code Format',
          html: `
            <p>Unable to parse QR code data.</p>
            <p><strong>Content:</strong></p>
            <code style="background: #f5f5f5; padding: 8px; border-radius: 4px; display: block; margin: 8px 0; word-break: break-all;">${decodedText}</code>
            <p>Please ensure you're scanning a valid warehouse QR code.</p>
          `,
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }

      const shouldProceed = await new Promise((resolve) => {
        setScannedItems((currentItems) => {
          const alreadyScanned = currentItems.find((item) => item.uniqueId === qrData.uniqueId);
          if (alreadyScanned) {
            Swal.fire('Warning', 'This carton has already been received!', 'warning');
            resolve(false);
            return currentItems;
          }
          resolve(true);
          return currentItems;
        });
      });

      if (!shouldProceed) return;

      if (!qrData.uniqueId || !(qrData.articleName || qrData.contractorInput?.articleName)) {
        Swal.fire({
          title: 'Invalid QR Code Data',
          html: `
            <p>QR code is missing required information:</p>
            <ul style="text-align: left; margin: 10px 0;">
              <li>Unique ID: ${qrData.uniqueId ? '✅' : '❌ Missing'}</li>
              <li>Article Name: ${(qrData.articleName || qrData.contractorInput?.articleName) ? '✅' : '❌ Missing'}</li>
            </ul>
            <p>Please scan a complete warehouse QR code.</p>
          `,
          icon: 'error',
          confirmButtonText: 'OK'
        });
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
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
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
    if (scannerRef.current) {
      scannerRef.current.stop();
    }

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
      allowOutsideClick: false,
      preConfirm: () => {
        const qualityRadio = document.querySelector('input[name="quality"]:checked');
        const notes = document.getElementById('quality-notes').value;
        return { passed: qualityRadio?.value === 'good', condition: qualityRadio?.value || 'good', notes };
      }
    });

    if (scannerRef.current && isScanning) {
      await scannerRef.current.start();
    }

    if (result.isConfirmed) return result.value;
    throw new Error('Quality check cancelled');
  };

  const handleFileInputChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      Swal.fire('Error', 'No file selected', 'error');
      return;
    }

    try {
      setLoading(true);

      for (const file of files) {
        try {
          const result = await QrScanner.scanImage(file, {
            returnDetailedScanResult: true,
          });
          await handleScanSuccess(result.data);
        } catch (scanErr) {
          console.warn('Scan failed for file:', file.name, scanErr);
          Swal.fire('Warning', `Could not scan QR code from ${file.name}`, 'warning');
        }
      }
    } catch (err) {
      console.warn('Bulk file scan error:', err);
      Swal.fire('Error', 'Failed while scanning selected images', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setLoading(false);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
  };

  const stopScanning = () => {
    cleanupScanner();
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
      link.download = `Warehouse_Report_${new Date().toISOString().split('T')[0]}.txt`;
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

  // ✅ NEW: Logout function
  const handleLogout = async () => {
    try {
      const result = await Swal.fire({
        title: 'Confirm Logout',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Logout',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#d33',
      });

      if (result.isConfirmed) {
        await axios.post(`${baseURL}/api/v1/auth/logout`, {}, { withCredentials: true });
        Swal.fire({
          icon: 'success',
          title: 'Logged out successfully',
          timer: 1500,
          showConfirmButton: false
        });
        // Redirect to login page
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    } catch (error) {
      console.error('Logout error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Logout failed',
        text: 'Please try again'
      });
    }
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
              {cameraPermission && (
                <div className="flex items-center mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    cameraPermission === 'granted' 
                      ? 'bg-green-100 text-green-800' 
                      : cameraPermission === 'denied'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {cameraPermission === 'granted' ? '✅ Camera Ready' : 
                     cameraPermission === 'denied' ? '❌ Camera Blocked' : 
                     '⏳ Camera Pending'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              {/* ✅ NEW: Logout Button */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 font-medium flex items-center"
              >
                <span className="mr-2">🚪</span>
                Logout
              </button>
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
                    onChange={handleFileInputChange}
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
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[300px] sm:min-h-[350px] flex items-center justify-center">
              {scanMode === 'camera' && isScanning ? (
                <video
                  ref={videoRef}
                  className="w-full h-full max-w-sm max-h-80 object-cover rounded-lg"
                  style={{ transform: 'scaleX(-1)' }}
                />
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
                    {scanMode === 'camera' ? 'Click "Start Scanner" to begin - camera permission will be requested' : 'Switch to Camera mode to use live scanner'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Received Items */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-0">📋 Received Items</h2>
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-500">Today: {scannedItems.length} items</div>
                {scannedItems.length > 0 && (
                  <button
                    onClick={exportInventoryReport}
                    disabled={loading}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    📊 Export
                  </button>
                )}
              </div>
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
    </div>
  );
};

export default WarehouseManagerScanner;
