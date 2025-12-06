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
  const html5QrCodeRef = useRef(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    fetchInventoryStats();
    getCameras();
    
    return () => {
      forceCleanup();
    };
  }, []);

  useEffect(() => {
    if (isScanning) {
      startCameraScanning();
    } else {
      stopCameraScanning();
    }
  }, [isScanning]);

  const vibrate = (pattern = [100]) => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      console.log('Vibration not supported:', error);
    }
  };

  const forceCleanup = async () => {
    try {
      if (html5QrCodeRef.current) {
        const state = await html5QrCodeRef.current.getState();
        if (state === 2) { // 2 = SCANNING
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      }
    } catch (error) {
      console.log('Force cleanup error:', error);
    } finally {
      html5QrCodeRef.current = null;
      const container = document.getElementById("qr-scanner-container");
      if (container) {
        container.innerHTML = '';
        container.removeAttribute('style');
      }
      isProcessingRef.current = false;
    }
  };

  const getCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      console.log('Available cameras:', devices);
      setAvailableCameras(devices);
      if (devices && devices.length > 0) {
        setCameraPermission('available');
      }
    } catch (error) {
      console.error('Error getting cameras:', error);
      setCameraPermission('denied');
    }
  };

  const getBackCamera = () => {
    if (availableCameras.length === 0) return null;
    
    let backCamera = availableCameras.find(camera => 
      camera.label && (
        camera.label.toLowerCase().includes('back') ||
        camera.label.toLowerCase().includes('rear') ||
        camera.label.toLowerCase().includes('environment')
      )
    );
    
    if (!backCamera && availableCameras.length > 1) {
      backCamera = availableCameras.find(camera => 
        camera.label && !(
          camera.label.toLowerCase().includes('front') ||
          camera.label.toLowerCase().includes('user') ||
          camera.label.toLowerCase().includes('selfie')
        )
      );
    }
    
    if (!backCamera) {
      backCamera = availableCameras[0];
    }
    
    return backCamera;
  };

  const startCameraScanning = async () => {
    try {
      // Clean up any existing scanner first
      await forceCleanup();
      
      // Small delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Create new scanner instance
      html5QrCodeRef.current = new Html5Qrcode("qr-scanner-container");
      
      const backCamera = getBackCamera();
      const cameraId = backCamera ? backCamera.id : { facingMode: "environment" };
      
      const config = {
        fps: 10,
        qrbox: function(viewfinderWidth, viewfinderHeight) {
          const minEdgePercentage = 0.7;
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
          return {
            width: qrboxSize,
            height: qrboxSize,
          };
        },
        aspectRatio: 1.0,
        disableFlip: false,
        videoConstraints: {
          facingMode: "environment",
          advanced: [
            { focusMode: "continuous" },
            { exposureMode: "continuous" },
            { whiteBalanceMode: "continuous" }
          ]
        }
      };

      await html5QrCodeRef.current.start(
        cameraId,
        config,
        (decodedText) => {
          if (!isProcessingRef.current) {
            isProcessingRef.current = true;
            vibrate([200, 100, 200]);
            handleScanSuccess(decodedText);
          }
        },
        (error) => {
          if (!error.includes('NotFoundException') && 
              !error.includes('No QR code found') &&
              !error.includes('No MultiFormat Readers')) {
            console.warn('Scan error:', error);
          }
        }
      );
      
      setCameraPermission('granted');
      
    } catch (error) {
      console.error('Camera start error:', error);
      setCameraPermission('denied');
      setIsScanning(false);
      vibrate([500]);
      
      let errorMessage = 'Failed to start camera scanner';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      }

      Swal.fire({
        title: 'Camera Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const stopCameraScanning = async () => {
    try {
      if (html5QrCodeRef.current) {
        const state = await html5QrCodeRef.current.getState();
        if (state === 2) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
    } catch (error) {
      console.error('Stop camera error:', error);
    } finally {
      // CRITICAL FIX: Always clear the container completely
      const container = document.getElementById("qr-scanner-container");
      if (container) {
        container.innerHTML = '';
        container.removeAttribute('style');
      }
      isProcessingRef.current = false;
      setCameraPermission('available');
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
    // Stop scanner immediately
    setIsScanning(false);
    
    try {
      let qrData;
      
      try {
        if (typeof decodedText === 'string') {
          const trimmed = decodedText.trim();
          
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            qrData = JSON.parse(trimmed);
          } else {
            vibrate([300, 100, 300]);
            
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
        }
      } catch (jsonError) {
        vibrate([300, 100, 300]);
        Swal.fire('Error', `Invalid QR format: ${jsonError.message}`, 'error');
        return;
      }

      if (!qrData || typeof qrData !== 'object') {
        vibrate([300, 100, 300]);
        Swal.fire('Invalid QR Data', 'QR code does not contain valid data', 'error');
        return;
      }

      const uniqueId = qrData.uniqueId || null;
      const articleName = qrData.articleName 
        || qrData.contractorInput?.articleName 
        || qrData.productReference?.articleName 
        || null;

      const shouldProceed = await new Promise((resolve) => {
        setScannedItems((currentItems) => {
          const alreadyScanned = currentItems.find((item) => item.uniqueId === uniqueId);
          if (alreadyScanned) {
            vibrate([100, 50, 100, 50, 100]);
            Swal.fire('Warning', 'This carton has already been received!', 'warning');
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

      if (!uniqueId || !articleName) {
        vibrate([300, 100, 300]);
        
        Swal.fire({
          title: 'Invalid QR Code Data',
          html: `
            <p>QR code is missing required information:</p>
            <ul style="text-align: left; margin: 10px 0;">
              <li>Unique ID: ${uniqueId ? '✅' : '❌ Missing'}</li>
              <li>Article Name: ${articleName ? '✅' : '❌ Missing'}</li>
            </ul>
          `,
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }
      
      const qualityCheck = await checkItemQuality(qrData);

      const response = await axios.post(
        `${baseURL}/api/v1/warehouse/scan/${uniqueId}`,
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
        const colors = qrData.contractorInput?.colors || qrData.colors || ['Not specified'];
        const sizes = qrData.contractorInput?.sizes || qrData.sizes || [];
        const cartonNumber = qrData.contractorInput?.cartonNumber || qrData.cartonNumber || 'N/A';

        const newItem = {
          uniqueId: uniqueId,
          articleName: articleName,
          colors: colors,
          sizes: sizes,
          cartonNumber: cartonNumber,
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

        vibrate([100, 50, 100, 50, 200]);

        const qualityEmoji = qualityCheck.passed ? '✅' : '⚠️';
        
        Swal.fire({
          icon: qualityCheck.passed ? 'success' : 'warning',
          title: `${qualityEmoji} Carton Received!`,
          text: `${newItem.articleName} - Carton ${newItem.cartonNumber}`,
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        throw new Error(response.data.message || 'Server returned failure');
      }
      
    } catch (error) {
      vibrate([500, 200, 500]);
      
      const msg = error.response?.data?.message || error.message || 'Failed to process scan';
      
      if (msg.includes('Receipt cancelled') || msg.includes('Quality check cancelled')) {
        Swal.fire({
          icon: 'info',
          title: 'Receipt Cancelled',
          text: 'Carton receipt was cancelled.',
          confirmButtonText: 'OK'
        });
      } else {
        Swal.fire('Error', `Scan failed: ${msg}`, 'error');
      }
    } finally {
      isProcessingRef.current = false;
    }
  };

  const formatSizeRange = (sizes) => {
    if (!sizes || sizes.length === 0) return 'N/A';
    if (!Array.isArray(sizes)) return sizes.toString();
    if (sizes.length === 1) return sizes[0].toString();
    
    const sortedSizes = [...sizes].sort((a, b) => a - b);
    return `${sortedSizes[0]}X${sortedSizes[sortedSizes.length - 1]}`;
  };

  const checkItemQuality = async (qrData) => {
    const articleName = qrData.articleName || qrData.contractorInput?.articleName || 'Unknown Article';
    const colors = qrData.contractorInput?.colors || qrData.colors || [];
    const sizes = qrData.contractorInput?.sizes || qrData.sizes || [];
    const cartonNumber = qrData.contractorInput?.cartonNumber || qrData.cartonNumber || 'N/A';

    const colorsDisplay = Array.isArray(colors) && colors.length > 0 
      ? colors.join(', ') 
      : (typeof colors === 'string' ? colors : 'N/A');

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
      `,
      showCancelButton: true,
      confirmButtonText: '✅ Confirm Receipt',
      cancelButtonText: '❌ Cancel',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#dc3545',
      allowOutsideClick: false
    });

    if (result.isConfirmed) {
      return { 
        passed: true, 
        condition: 'good', 
        notes: `Carton #${cartonNumber} received and confirmed` 
      };
    }
    throw new Error('Receipt cancelled');
  };

  const startScanning = () => {
    vibrate([50]);
    setIsScanning(true);
  };

  const stopScanning = async () => {
    vibrate([100]);
    setIsScanning(false);
  };

  const exportInventoryReport = async () => {
    try {
      setLoading(true);
      vibrate([50, 50]);
      
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
      
      vibrate([100, 50, 100]);
      Swal.fire('Success', 'Report downloaded successfully!', 'success');
    } catch (error) {
      vibrate([300]);
      Swal.fire('Error', 'Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const removeScannedItem = (uniqueId) => {
    vibrate([100]);
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
        vibrate([100, 100, 100]);
        
        await forceCleanup();
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
      vibrate([300]);
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
                     '⏳ Camera Available'}
                  </span>
                </div>
              )}
              {availableCameras.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {availableCameras.length} camera(s) available - Back camera preferred
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
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{inventoryStats.todayReceived}</div>
              </div>
              <div className="text-center bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Total Items</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{scannedItems.length}</div>
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
                  Back camera auto-selected
                </div>
              )}
            </div>

            <div className="mb-4">
              {!isScanning ? (
                <button
                  onClick={startScanning}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition duration-200 font-medium text-sm"
                >
                  📷 Start Camera Scanner
                </button>
              ) : (
                <button
                  onClick={stopScanning}
                  className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition duration-200 font-medium text-sm"
                >
                  ⏹️ Stop Scanner
                </button>
              )}
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[300px] sm:min-h-[400px] flex items-center justify-center">
              {isScanning ? (
                <div id="qr-scanner-container" className="w-full h-full"></div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl sm:text-6xl mb-4">📦</div>
                  <p className="text-gray-500">Scanner ready for carton receipt</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Click "Start Scanner" to begin scanning QR codes
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    📱 Auto-closes after scan • 🎯 Back camera • 📳 Vibration feedback
                  </p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-blue-700">
                <strong>Instructions:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Click "Start Scanner" to activate camera</li>
                  <li>Point camera at QR code on carton</li>
                  <li>Scanner automatically closes after successful scan</li>
                  <li>Review and confirm carton details</li>
                </ul>
              </div>
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

            {/* Summary */}
            {scannedItems.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs sm:text-sm">
                    <div><strong>Good Condition:</strong> {scannedItems.filter(item => item.qualityStatus === 'good').length} items</div>
                    <div><strong>With Issues:</strong> {scannedItems.filter(item => item.qualityStatus === 'damaged').length} items</div>
                    <div><strong>Total Processed:</strong> {scannedItems.length} cartons</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseManagerScanner;