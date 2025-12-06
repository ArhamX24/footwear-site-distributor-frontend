import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
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
  const [availableCameras, setAvailableCameras] = useState([]);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    fetchInventoryStats();
    getCameras();
  }, []);

  useEffect(() => {
    if (isScanning) {
      startCameraScanning();
    } else {
      stopCameraScanning();
    }
    
    return () => {
      stopCameraScanning();
    };
  }, [isScanning]);

  // Add vibration helper function
  const vibrate = (pattern = [100]) => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      console.log('Vibration not supported:', error);
    }
  };

  // Get available cameras
  // Enhanced getCameras function to better identify back cameras
const getCameras = async () => {
  try {
    const devices = await Html5Qrcode.getCameras();
    devices.forEach((camera, index) => {
      console.log(`Camera ${index}:`, {
        id: camera.id,
        label: camera.label,
        isLikelyBackCamera: camera.label && (
          camera.label.toLowerCase().includes('back') ||
          camera.label.toLowerCase().includes('rear') ||
          camera.label.toLowerCase().includes('environment') ||
          camera.label.toLowerCase().includes('facing back') ||
          camera.label.toLowerCase().includes('world facing')
        ),
        isLikelyFrontCamera: camera.label && (
          camera.label.toLowerCase().includes('front') ||
          camera.label.toLowerCase().includes('user') ||
          camera.label.toLowerCase().includes('facing user') ||
          camera.label.toLowerCase().includes('selfie')
        )
      });
    });
    setAvailableCameras(devices);
  } catch (error) {
    console.error('Error getting cameras:', error);
  }
};

// Enhanced startCameraScanning function with back camera priority
const startCameraScanning = async () => {
  try {
    // 1. CLEANUP FIRST: strict mode safety
    if (html5QrCodeRef.current) {
      if (html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }
      html5QrCodeRef.current.clear();
    }

    // 2. Wait a tick to ensure DOM is ready (React safety)
    await new Promise(r => setTimeout(r, 100));

    // 3. Initialize
    const html5QrCode = new Html5Qrcode("qr-scanner-container");
    html5QrCodeRef.current = html5QrCode;

    // 4. Camera Selection (Your logic simplified)
    let cameraId;
    if (availableCameras.length > 0) {
      // Try to find environment/back camera
      const backCamera = availableCameras.find(cam => 
        cam.label.toLowerCase().includes('back') || 
        cam.label.toLowerCase().includes('environment') ||
        cam.label.toLowerCase().includes('rear')
      );
      // Use back camera if found, otherwise last camera (often back on Android), otherwise first
      cameraId = backCamera ? backCamera.id : availableCameras[availableCameras.length - 1].id;
    }

    // 5. Config - REMOVED aspectRatio to fix white screen
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 }, // Fixed pixel size is often more stable than function
      videoConstraints: {
        facingMode: { ideal: "environment" }, // 'ideal' is safer than 'exact'
        focusMode: "continuous"
      }
    };

    // 6. Start
    await html5QrCode.start(
      cameraId || { facingMode: "environment" },
      config,
      (decodedText) => {
        handleScanSuccess(decodedText);
      },
      (errorMessage) => {
        // ignore errors
      }
    );

    setCameraPermission('granted');

  } catch (error) {
    console.error("Scanner error:", error);
    setCameraPermission('denied');
    setIsScanning(false);
    Swal.fire('Camera Error', 'Could not access camera. Please check permissions.', 'error');
  }
};

// Replace the startCameraScanning function with this enhanced version

  // Stop camera scanning
  const stopCameraScanning = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping camera scanner:', error);
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

  const handleScanSuccess = async (decodedText) => {    
    // Immediately pause scanner after successful scan
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.pause();
      } catch (error) {
        console.warn('Could not pause scanner:', error);
      }
    }
    
    try {
      let qrData;
      
      try {
        if (typeof decodedText === 'string') {
          const trimmed = decodedText.trim();
          
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            qrData = JSON.parse(trimmed);

          } else {
            vibrate([300, 100, 300]); // Error vibration pattern
            
            Swal.fire({
              title: 'Invalid QR Code',
              html: `
                <p>This QR code doesn't contain JSON data.</p>
                <p><strong>Content found:</strong></p>
                <code style="background: #f5f5f5; padding: 8px; border-radius: 4px; display: block; margin: 8px 0; word-break: break-all;">${decodedText}</code>
              `,
              icon: 'warning',
              confirmButtonText: 'Scan Again'
            }).then(() => {
              // Resume scanner for another attempt
              if (html5QrCodeRef.current) {
                html5QrCodeRef.current.resume();
              }
            });
            return;
          }
        } else {
          qrData = decodedText;
        }
      } catch (jsonError) {
        vibrate([300, 100, 300]); // Error vibration
        
        Swal.fire('Error', `Invalid QR format: ${jsonError.message}`, 'error').then(() => {
          // Resume scanner after error
          if (html5QrCodeRef.current) {
            html5QrCodeRef.current.resume();
          }
        });
        return;
      }

      const shouldProceed = await new Promise((resolve) => {
        setScannedItems((currentItems) => {
          const alreadyScanned = currentItems.find((item) => item.uniqueId === qrData.uniqueId);
          if (alreadyScanned) {
            vibrate([100, 50, 100, 50, 100]); // Warning vibration pattern
            Swal.fire('Warning', 'This carton has already been received!', 'warning').then(() => {
              // Resume scanner after duplicate warning
              if (html5QrCodeRef.current) {
                html5QrCodeRef.current.resume();
              }
            });
            resolve(false);
            return currentItems;
          }
          resolve(true);
          return currentItems;
        });
      });

      if (!shouldProceed) {
        return;
      }

      if (!qrData.uniqueId || !(qrData.articleName || qrData.contractorInput?.articleName)) {
        vibrate([300, 100, 300]); // Error vibration
        
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
          confirmButtonText: 'Scan Again'
        }).then(() => {
          // Resume scanner after error
          if (html5QrCodeRef.current) {
            html5QrCodeRef.current.resume();
          }
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

        // Success vibration pattern
        vibrate([100, 50, 100, 50, 200]);

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

        // Automatically stop scanner after successful scan and processing
        setTimeout(() => {
          stopScanning();
        }, 2500); // Give time for toast to show
        
      } else {
        throw new Error(response.data.message || 'Server returned failure');
      }
      
    } catch (error) {
      // Error vibration
      vibrate([500, 200, 500]);
      
      const msg = error.response?.data?.message || error.message || 'Failed to process scan';
      Swal.fire('Error', `Scan failed: ${msg}`, 'error').then(() => {
        // Resume scanner after error (unless it was a critical error)
        if (html5QrCodeRef.current && !error.message.includes('Quality check cancelled')) {
          html5QrCodeRef.current.resume();
        } else if (error.message.includes('Quality check cancelled')) {
          // If quality check was cancelled, stop the scanner
          stopScanning();
        }
      });
    }
  };

 // Helper function to format size range
  const formatSizeRange = (sizes) => {
    if (!sizes || sizes.length === 0) return 'N/A';
    if (!Array.isArray(sizes)) return sizes.toString();
    if (sizes.length === 1) return sizes[0].toString();
    
    const sortedSizes = [...sizes].sort((a, b) => a - b);
    return `${sortedSizes[0]}X${sortedSizes[sortedSizes.length - 1]}`;
  };

  const checkItemQuality = async (qrData) => {

    // Extract article details
    const articleName = qrData.articleName || qrData.contractorInput?.articleName || 'Unknown Article';
    const colors = qrData.contractorInput?.colors || qrData.colors || [];
    const sizes = qrData.contractorInput?.sizes || qrData.sizes || [];
    const cartonNumber = qrData.contractorInput?.cartonNumber || qrData.cartonNumber || 'N/A';

    // Format colors display
    const colorsDisplay = Array.isArray(colors) && colors.length > 0 
      ? colors.join(', ') 
      : (typeof colors === 'string' ? colors : 'N/A');

    // Format sizes display
    const sizesDisplay = formatSizeRange(sizes);

    const result = await Swal.fire({
      title: 'Confirm Receipt',
      html: `
        <div style="text-align: left; background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 10px 0;">
          <div style="margin-bottom: 15px;">
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">📦 ${articleName}</h4>
          </div>
          
          <div style="display: grid; gap: 12px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef;">
              <span style="font-weight: 600; color: #495057;">🎨 Colors:</span>
              <span style="color: #6c757d;">${colorsDisplay}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef;">
              <span style="font-weight: 600; color: #495057;">📏 Sizes:</span>
              <span style="color: #6c757d;">${sizesDisplay}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
              <span style="font-weight: 600; color: #495057;">📦 Carton:</span>
              <span style="color: #6c757d;">#${cartonNumber}</span>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #6c757d; font-size: 14px;">Confirm receipt of this carton?</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '✅ Confirm Receipt',
      cancelButtonText: '❌ Cancel',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#dc3545',
      allowOutsideClick: false,
      customClass: {
        popup: 'swal2-popup-custom',
        confirmButton: 'swal2-confirm-custom',
        cancelButton: 'swal2-cancel-custom'
      }
    });

    if (result.isConfirmed) {
      // Return default good quality since we're not asking for quality assessment
      return { 
        passed: true, 
        condition: 'good', 
        notes: `Carton #${cartonNumber} received and confirmed` 
      };
    }
    throw new Error('Receipt cancelled');
  };

  const startScanning = () => {
    vibrate([50]); // Quick feedback vibration
    setIsScanning(true);
  };

  const stopScanning = () => {
    vibrate([100]); // Stop feedback vibration
    setIsScanning(false);
  };

  const exportInventoryReport = async () => {
    try {
      setLoading(true);
      vibrate([50, 50]); // Export action feedback
      
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
      
      vibrate([100, 50, 100]); // Success vibration
      Swal.fire('Success', 'Report downloaded successfully!', 'success');
    } catch (error) {
      vibrate([300]); // Error vibration
      Swal.fire('Error', 'Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const removeScannedItem = (uniqueId) => {
    vibrate([100]); // Remove action feedback
    setScannedItems((prev) => prev.filter((item) => item.uniqueId !== uniqueId));
    setInventoryStats((prev) => ({
      ...prev,
      totalReceived: Math.max(0, prev.totalReceived - 1),
      todayReceived: Math.max(0, prev.todayReceived - 1)
    }));
  };

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
        vibrate([100, 100, 100]); // Logout confirmation vibration
        
        // Stop scanner before logout
        await stopCameraScanning();
        setIsScanning(false);
        
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
      vibrate([300]); // Error vibration
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
              {availableCameras.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {availableCameras.length} camera(s) available
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
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
              {availableCameras.length > 1 && !isScanning && (
                <div className="text-xs text-gray-500">
                  Back camera preferred
                </div>
              )}
            </div>

            <div className="mb-4">
              {!isScanning ? (
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
              )}
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[300px] sm:min-h-[400px] flex items-center justify-center">
              {/* Replace this entire block in your return statement */}
<div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[300px] sm:min-h-[400px] flex items-center justify-center relative overflow-hidden bg-black">
  
  {/* 1. Placeholder when NOT scanning */}
              {!isScanning && (
                <div className="text-center py-12 absolute z-10 bg-white w-full h-full flex flex-col items-center justify-center">
                  <div className="text-4xl sm:text-6xl mb-4">📦</div>
                  <p className="text-gray-500">Scanner ready for carton receipt</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Click "Start Scanner" to begin
                  </p>
                </div>
              )}

              {/* 2. The Scanner Container - ALWAYS RENDERED, just hidden via z-index or visibility if needed */}
              <div 
                id="qr-scanner-container" 
                className={`w-full h-full ${!isScanning ? 'invisible' : 'visible'}`}
              ></div>

            </div>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <strong>Debug Info:</strong>
                <div>Scanner: {html5QrCodeRef.current ? '✅ Active' : '❌ Not Active'}</div>
                <div>Camera: {cameraPermission || 'Unknown'}</div>
                <div>Scanning: {isScanning ? 'Yes' : 'No'}</div>
                <div>Cameras: {availableCameras.length}</div>
                <div>Vibration: {('vibrate' in navigator) ? '✅ Supported' : '❌ Not Supported'}</div>
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
                    Start scanning QR codes to add items here
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
                        <button 
                          onClick={() => removeScannedItem(item.uniqueId)} 
                          className="text-red-500 hover:text-red-700 p-1" 
                          title="Remove item"
                        >
                          🗑️
                        </button>
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