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

  // ✅ Enhanced useEffect with better debugging
  useEffect(() => {
    console.log('useEffect triggered:', { isScanning, scanMode, videoElement: !!videoRef.current, scannerExists: !!scannerRef.current });
    
    if (isScanning && videoRef.current && !scannerRef.current && scanMode === 'camera') {
      initializeScanner();
    }
    
    return () => {
      if (scannerRef.current && !isScanning) {
        cleanupScanner();
      }
    };
  }, [isScanning, scanMode]);

  // ✅ Enhanced scanner initialization with better error handling and debugging
  const initializeScanner = async () => {
    try {
      console.log('Initializing scanner...');
      
      if (!videoRef.current) {
        throw new Error('Video element not available');
      }

      // Check if QrScanner has camera support
      const hasCamera = await QrScanner.hasCamera();
      console.log('Camera available:', hasCamera);
      
      if (!hasCamera) {
        throw new Error('No camera found on this device');
      }

      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('Raw scan result:', result);
          // Handle both string and object results
          const data = result.data || result;
          handleScanSuccess(data);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
          maxScansPerSecond: 1,
          returnDetailedScanResult: true,
        }
      );

      console.log('Starting scanner...');
      await scanner.start();
      scannerRef.current = scanner;
      setCameraPermission('granted');
      console.log('Scanner started successfully');
    } catch (error) {
      console.error('Scanner initialization detailed error:', error);
      setCameraPermission('denied');
      setIsScanning(false);
      
      Swal.fire({
        title: 'Scanner Error',
        html: `
          <p>Failed to initialize camera scanner:</p>
          <p><strong>Error:</strong> ${error.message}</p>
          <p>Please check:</p>
          <ul style="text-align: left; margin: 10px 0;">
            <li>Camera permissions are granted</li>
            <li>You're using HTTPS or localhost</li>
            <li>No other app is using the camera</li>
            <li>Your browser supports camera access</li>
            <li>Try refreshing the page</li>
          </ul>
        `,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const cleanupScanner = () => {
    console.log('Cleaning up scanner...');
    if (scannerRef.current) {
      try {
        scannerRef.current.stop();
        scannerRef.current.destroy();
      } catch (error) {
        console.error('Error during scanner cleanup:', error);
      }
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

  // ✅ Enhanced handleScanSuccess with comprehensive debugging and error handling
 const handleScanSuccess = async (decodedText) => {
  console.log('=== QR SCAN DEBUG ===');
  console.log('Raw decoded text:', decodedText);
  console.log('Type:', typeof decodedText);
  
  try {
    let qrData;
    
    if (typeof decodedText === 'object' && decodedText.data) {
      decodedText = decodedText.data;
    }
    
    try {
      if (typeof decodedText === 'string') {
        const trimmed = decodedText.trim();
        console.log('Trimmed content:', trimmed);
        
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          qrData = JSON.parse(trimmed);
          console.log('Parsed QR data:', qrData);
          console.log('UniqueId from QR:', qrData.uniqueId);
        } else {
          console.log('Non-JSON QR Content:', decodedText);
          Swal.fire({
            title: 'Invalid QR Code',
            html: `
              <p>This QR code doesn't contain JSON data.</p>
              <p><strong>Content found:</strong></p>
              <code style="background: #f5f5f5; padding: 8px; border-radius: 4px; display: block; margin: 8px 0; word-break: break-all;">${decodedText}</code>
            `,
            icon: 'warning',
            confirmButtonText: 'OK'
          });
          return;
        }
      } else {
        qrData = decodedText;
        console.log('Object QR data:', qrData);
      }
    } catch (jsonError) {
      console.error('JSON Parse Error:', jsonError);
      Swal.fire('Error', `Invalid QR format: ${jsonError.message}`, 'error');
      return;
    }

    // ✅ CRITICAL: Log the uniqueId being sent to backend
    console.log('Sending uniqueId to backend:', qrData.uniqueId);
    
    // Check for duplicates
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
      console.error('Missing required fields:', qrData);
      Swal.fire({
        title: 'Invalid QR Code Data',
        html: `
          <p>QR code is missing required information:</p>
          <ul style="text-align: left; margin: 10px 0;">
            <li>Unique ID: ${qrData.uniqueId ? '✅' : '❌ Missing'}</li>
            <li>Article Name: ${(qrData.articleName || qrData.contractorInput?.articleName) ? '✅' : '❌ Missing'}</li>
          </ul>
        `,
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    const qualityCheck = await checkItemQuality(qrData);

    console.log('Making API call to:', `${baseURL}/api/v1/warehouse/scan/${qrData.uniqueId}`);
    
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

    console.log('Backend response:', response.data);
    
    // Rest of your existing code...
    
  } catch (error) {
    console.error('=== QR SCAN ERROR ===');
    console.error('Error details:', error);
    console.error('Response data:', error.response?.data);
    console.error('Status:', error.response?.status);
    
    const msg = error.response?.data?.message || error.message || 'Failed to process scan';
    Swal.fire('Error', `Scan failed: ${msg}`, 'error');
  }
};


  const checkItemQuality = async (qrData) => {
    console.log('Starting quality check dialog...');
    
    // Pause scanner during quality check
    if (scannerRef.current) {
      try {
        scannerRef.current.stop();
        console.log('Scanner paused for quality check');
      } catch (error) {
        console.error('Error pausing scanner:', error);
      }
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

    // Resume scanner after quality check
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.start();
        console.log('Scanner resumed after quality check');
      } catch (error) {
        console.error('Error resuming scanner:', error);
      }
    }

    if (result.isConfirmed) {
      console.log('Quality check result:', result.value);
      return result.value;
    }
    throw new Error('Quality check cancelled');
  };

  // ✅ Enhanced file upload handler with better debugging
  const handleFileInputChange = async (e) => {
    const files = e.target.files;
    console.log('File input changed, files:', files?.length || 0);
    
    if (!files || files.length === 0) {
      Swal.fire('Error', 'No file selected', 'error');
      return;
    }

    try {
      setLoading(true);
      console.log('Processing files:', files.length);

      for (const file of files) {
        try {
          console.log('Scanning file:', file.name, file.type, file.size);
          
          // Enhanced file scanning with better options
          const result = await QrScanner.scanImage(file, {
            returnDetailedScanResult: true,
            scanRegion: null // Scan entire image
          });
          
          console.log('File scan result:', result);
          // Handle both data property and direct result
          const data = result.data || result;
          await handleScanSuccess(data);
        } catch (scanErr) {
          console.error('Scan failed for file:', file.name, scanErr);
          let errorMessage = `Could not scan QR code from ${file.name}`;
          Swal.fire('Warning', errorMessage, 'warning');
        }
      }
    } catch (err) {
      console.error('Bulk file scan error:', err);
      Swal.fire('Error', `Failed while scanning images: ${err.message}`, 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setLoading(false);
    }
  };

  const startScanning = () => {
    console.log('Starting scan process...');
    setIsScanning(true);
  };

  const stopScanning = () => {
    console.log('Stopping scan process...');
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
      console.error('Report export error:', error);
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

  // ✅ Logout function
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
        // Clean up scanner before logout
        if (scannerRef.current) {
          cleanupScanner();
          setIsScanning(false);
        }
        
        await axios.post(`${baseURL}/api/v1/auth/logout`, {}, { withCredentials: true });
        Swal.fire({
          icon: 'success',
          title: 'Logged out successfully',
          timer: 1500,
          showConfirmButton: false
        });
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
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 font-medium flex items-center justify-center"
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
                  playsInline
                  muted
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

            {/* Debug Panel (remove in production) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <strong>Debug Info:</strong>
                <div>Scanner: {scannerRef.current ? '✅ Active' : '❌ Not Active'}</div>
                <div>Camera: {cameraPermission || 'Unknown'}</div>
                <div>Scanning: {isScanning ? 'Yes' : 'No'}</div>
                <div>Mode: {scanMode}</div>
              </div>
            )}
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
