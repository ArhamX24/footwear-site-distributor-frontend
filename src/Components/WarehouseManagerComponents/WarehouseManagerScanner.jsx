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
  const isMountedRef = useRef(true); // ✅ Track component mount status

  useEffect(() => {
    isMountedRef.current = true;
    fetchInventoryStats();
    getCameras();
    
    return () => {
      isMountedRef.current = false;
      forceCleanup();
    };
  }, []);

  // ✅ FIXED: Separate useEffect for scanning state
  useEffect(() => {
    if (isScanning) {
      startCameraScanning();
    } else {
      stopCameraScanning();
    }
    
    // Cleanup on unmount or when isScanning changes
    return () => {
      if (!isScanning && html5QrCodeRef.current) {
        stopCameraScanning();
      }
    };
  }, [isScanning]);

  const vibrate = (pattern = [100]) => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (error) {

    }
  };

  const forceCleanup = async () => {
    try {
      if (html5QrCodeRef.current) {
        const state = html5QrCodeRef.current.getState();

        
        if (state === 2) { // SCANNING state
          await html5QrCodeRef.current.stop();

        }
        await html5QrCodeRef.current.clear();

      }
    } catch (error) {

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

      setAvailableCameras(devices);
      if (devices && devices.length > 0) {
        setCameraPermission('available');
      }
    } catch (error) {

      setCameraPermission('denied');
    }
  };

  const getBackCamera = () => {
    if (availableCameras.length === 0) return null;
    
    // Try to find back camera
    let backCamera = availableCameras.find(camera => 
      camera.label && (
        camera.label.toLowerCase().includes('back') ||
        camera.label.toLowerCase().includes('rear') ||
        camera.label.toLowerCase().includes('environment')
      )
    );
    
    // Fallback: find non-front camera
    if (!backCamera && availableCameras.length > 1) {
      backCamera = availableCameras.find(camera => 
        camera.label && !(
          camera.label.toLowerCase().includes('front') ||
          camera.label.toLowerCase().includes('user') ||
          camera.label.toLowerCase().includes('selfie')
        )
      );
    }
    
    // Last resort: use first camera
    if (!backCamera) {
      backCamera = availableCameras[0];
    }

    return backCamera;
  };

  const startCameraScanning = async () => {
    try {

      
      // ✅ Force cleanup first
      await forceCleanup();
      
      // ✅ Wait longer for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ✅ Check if component is still mounted
      if (!isMountedRef.current) {

        return;
      }
      
      // ✅ Create new scanner instance
      const scanner = new Html5Qrcode("qr-scanner-container");
      html5QrCodeRef.current = scanner;
      
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

      await scanner.start(
        cameraId,
        config,
        (decodedText) => {

          if (!isProcessingRef.current) {
            isProcessingRef.current = true;
            vibrate([200, 100, 200]);
            handleScanSuccess(decodedText);
          } else {

          }
        },
        (error) => {
          // Suppress common errors
          if (!error.includes('NotFoundException') && 
              !error.includes('No QR code found') &&
              !error.includes('No MultiFormat Readers')) {

          }
        }
      );
      

      setCameraPermission('granted');
      
    } catch (error) {

      setCameraPermission('denied');
      setIsScanning(false);
      vibrate([500]);
      
      let errorMessage = 'Unable to start camera. Please grant camera permission and try again.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is busy. Please close other apps using the camera and try again.';
      } else if (error.message && error.message.includes('already in use')) {
        errorMessage = 'Camera is already in use. Please close other tabs or apps using the camera.';
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
        const state = html5QrCodeRef.current.getState();
 
        
        if (state === 2) { // SCANNING state
          await html5QrCodeRef.current.stop();

        }
        
        await html5QrCodeRef.current.clear();

        html5QrCodeRef.current = null;
      }
    } catch (error) {

    } finally {
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

    }
  };

  const handleScanSuccess = async (decodedText) => {

  
  try {
    let qrData;
    
    // Parse QR data
    try {
      if (typeof decodedText === 'string') {
        const trimmed = decodedText.trim();
        
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          qrData = JSON.parse(trimmed);

        } else {
          vibrate([300, 100, 300]);
          Swal.fire({
            title: 'Invalid QR Code',
            text: 'Please try scanning again. Make sure you are scanning a valid carton QR code.',
            icon: 'warning',
            confirmButtonText: 'OK'
          });
          isProcessingRef.current = false;
          return;
        }
      } else {
        qrData = decodedText;
      }
    } catch (jsonError) {
      vibrate([300, 100, 300]);
      Swal.fire('Invalid QR Code', 'Please try scanning again.', 'error');
      isProcessingRef.current = false;
      return;
    }

    if (!qrData || typeof qrData !== 'object') {
      vibrate([300, 100, 300]);
      Swal.fire('Invalid QR Code', 'Please try scanning again.', 'error');
      isProcessingRef.current = false;
      return;
    }

    const uniqueId = qrData.uniqueId || null;
    const articleId = qrData.contractorInput?.articleId || qrData.productReference?.articleId;
    const articleName = qrData.articleName 
      || qrData.contractorInput?.articleName 
      || qrData.productReference?.articleName 
      || null;


    // Check for duplicates in local scanned items
    const shouldProceed = await new Promise((resolve) => {
      setScannedItems((currentItems) => {
        const alreadyScanned = currentItems.find((item) => item.uniqueId === uniqueId);
        if (alreadyScanned) {
          vibrate([100, 50, 100, 50, 100]);
          Swal.fire({
            icon: 'warning',
            title: 'Already Scanned',
            text: 'This carton has already been received in this session!',
            confirmButtonText: 'OK',
            confirmButtonColor: '#f59e0b'
          });
          resolve(false);
          return currentItems;
        }
        resolve(true);
        return currentItems;
      });
    });

    if (!shouldProceed) {
      isProcessingRef.current = false;
      return;
    }

    if (!uniqueId || !articleName) {
      vibrate([300, 100, 300]);
      Swal.fire({
        title: 'Invalid QR Code',
        text: 'QR code is missing required information. Please try scanning again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      isProcessingRef.current = false;
      return;
    }
    
    // Stop scanner before showing quality check dialog
    if (isScanning) {

      setIsScanning(false);
      await stopCameraScanning();
    }
    
    // Show quality check dialog
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
        text: `${newItem.articleName}`,
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
    

    
    // ✅ IMPROVED: Extract and display user-friendly error messages
    const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
    

    
    // ✅ Handle specific error cases with user-friendly messages
    if (errorMsg.includes('Receipt cancelled') || errorMsg.includes('Quality check cancelled')) {
      Swal.fire({
        icon: 'info',
        title: 'Receipt Cancelled',
        text: 'You cancelled the carton receipt process.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#6b7280'
      });
    } 
    else if (errorMsg.toLowerCase().includes('already been shipped') || errorMsg.includes('has already been shipped')) {
      Swal.fire({
        icon: 'error',
        title: 'Already Shipped',
        html: `
          <div style="text-align: left;">
            <p style="margin-bottom: 10px;">This QR code has already been shipped to a distributor.</p>
            <div style="background: #fee; padding: 12px; border-radius: 6px; border-left: 4px solid #dc3545;">
              <strong>⚠️ Cannot receive this carton again</strong>
            </div>
          </div>
        `,
        confirmButtonText: 'Understood',
        confirmButtonColor: '#dc3545',
        width: '500px'
      });
    }
    else if (errorMsg.toLowerCase().includes('already been received') || errorMsg.includes('has already been received')) {
      Swal.fire({
        icon: 'warning',
        title: 'Already Received',
        html: `
          <div style="text-align: left;">
            <p style="margin-bottom: 10px;">This carton has already been received at the warehouse.</p>
            <div style="background: #fff3cd; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107;">
              <strong>⚠️ Duplicate scan detected</strong>
            </div>
          </div>
        `,
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b',
        width: '500px'
      });
    }
    else if (errorMsg.toLowerCase().includes('already been delivered') || errorMsg.includes('has been delivered')) {
      Swal.fire({
        icon: 'error',
        title: 'Already Delivered',
        html: `
          <div style="text-align: left;">
            <p style="margin-bottom: 10px;">This carton has already been delivered to the final destination.</p>
            <div style="background: #d1ecf1; padding: 12px; border-radius: 6px; border-left: 4px solid #0dcaf0;">
              <strong>ℹ️ This carton has completed its journey</strong>
            </div>
          </div>
        `,
        confirmButtonText: 'OK',
        confirmButtonColor: '#0dcaf0',
        width: '500px'
      });
    }
    else if (errorMsg.toLowerCase().includes('not found') || errorMsg.includes('QR code not found')) {
      Swal.fire({
        icon: 'error',
        title: 'QR Code Not Found',
        html: `
          <div style="text-align: left;">
            <p style="margin-bottom: 10px;">This QR code does not exist in our system.</p>
            <div style="background: #f8d7da; padding: 12px; border-radius: 6px; border-left: 4px solid #dc3545;">
              <strong>⚠️ Invalid or unregistered QR code</strong>
            </div>
          </div>
        `,
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#dc3545',
        width: '500px'
      });
    }
    else if (errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('connection')) {
      Swal.fire({
        icon: 'error',
        title: 'Connection Error',
        html: `
          <div style="text-align: left;">
            <p style="margin-bottom: 10px;">Unable to connect to the server.</p>
            <div style="background: #f8d7da; padding: 12px; border-radius: 6px; border-left: 4px solid #dc3545;">
              <strong>⚠️ Network issue detected</strong>
            </div>
          </div>
        `,
        confirmButtonText: 'Retry',
        confirmButtonColor: '#dc3545',
        width: '500px'
      });
    }
    else {
      // Generic error with the actual message
      Swal.fire({
        icon: 'error',
        title: 'Scan Failed',
        html: `
          <div style="text-align: left;">
            <p style="margin-bottom: 10px;">${errorMsg}</p>
            <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; border-left: 4px solid #6c757d;">
              <strong>If this issue persists, contact support</strong>
            </div>
          </div>
        `,
        confirmButtonText: 'OK',
        confirmButtonColor: '#6b7280',
        width: '500px'
      });
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
                  {availableCameras.length} camera(s) detected
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

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[300px] sm:min-h-[400px] flex items-center justify-center bg-black">
              {isScanning ? (
                <div id="qr-scanner-container" className="w-full h-full"></div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl sm:text-6xl mb-4">📦</div>
                  <p className="text-white">Scanner ready for carton receipt</p>
                  <p className="text-sm text-gray-300 mt-2">
                    Click "Start Camera Scanner" to begin
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    📱 Mobile • 🖥️ Desktop • 📳 Vibration feedback
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
