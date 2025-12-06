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
    
    // Clean up any existing scanner
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (error) {
        console.log('Error stopping previous scanner:', error);
      }
    }

    // Create new scanner instance
    html5QrCodeRef.current = new Html5Qrcode("qr-scanner-container");
    
    // Enhanced back camera detection
    let cameraId;
    if (availableCameras.length > 0) {
      
      // Multiple strategies to find back camera
      let backCamera = null;
      
      // Strategy 1: Look for back/rear/environment keywords
      backCamera = availableCameras.find(camera => 
        camera.label && (
          camera.label.toLowerCase().includes('back') ||
          camera.label.toLowerCase().includes('rear') ||
          camera.label.toLowerCase().includes('environment') ||
          camera.label.toLowerCase().includes('facing back') ||
          camera.label.toLowerCase().includes('world facing')
        )
      );
      
      // Strategy 2: If no back camera found by label, try to find one that's not front-facing
      if (!backCamera) {
        backCamera = availableCameras.find(camera => 
          camera.label && !(
            camera.label.toLowerCase().includes('front') ||
            camera.label.toLowerCase().includes('user') ||
            camera.label.toLowerCase().includes('facing user') ||
            camera.label.toLowerCase().includes('selfie')
          )
        );
      }
      
      // Strategy 3: On mobile devices, often the first camera is back camera
      if (!backCamera && availableCameras.length > 1) {
        // If we have multiple cameras and couldn't identify back camera,
        // try the first one (often back camera on mobile)
        backCamera = availableCameras[0];
      }
      
      // Strategy 4: Fallback to last camera if still no back camera found
      if (!backCamera) {
        backCamera = availableCameras[availableCameras.length - 1];
      }
      
      cameraId = backCamera.id;
    } else {
      // Fallback: Use facingMode constraint for back camera
      cameraId = { facingMode: { exact: "environment" } };
    }

    // Enhanced camera configuration for back camera preference
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
        facingMode: "environment", // Prefer back camera
        advanced: [
          { facingMode: { exact: "environment" } }, // Try to force back camera
          { focusMode: "continuous" },
          { exposureMode: "continuous" },
          { whiteBalanceMode: "continuous" }
        ]
      }
    };

    try {
      // First attempt: Try with selected camera ID
      await html5QrCodeRef.current.start(
        cameraId,
        config,
        (decodedText, decodedResult) => {
          vibrate([200, 100, 200]);
          handleScanSuccess(decodedText);
        },
        (error) => {
          // Suppress common "no QR found" errors
          if (error.includes('No QR code found') || 
              error.includes('NotFoundException') ||
              error.includes('No MultiFormat Readers')) {
            return;
          }
        }
      );
      
      
    } catch (firstAttemptError) {
      
      // Fallback attempt: Use environment facing mode
      try {
        await html5QrCodeRef.current.start(
          { facingMode: "environment" },
          config,
          (decodedText, decodedResult) => {
            vibrate([200, 100, 200]);
            handleScanSuccess(decodedText);
          },
          (error) => {
            if (error.includes('No QR code found') || 
                error.includes('NotFoundException') ||
                error.includes('No MultiFormat Readers')) {
              return;
            }
          }
        );
        
        
      } catch (secondAttemptError) {
        
        // Final fallback: Try any available camera
        const fallbackCameraId = availableCameras.length > 0 ? availableCameras[0].id : undefined;
        
        await html5QrCodeRef.current.start(
          fallbackCameraId,
          {
            ...config,
            videoConstraints: {
              advanced: [
                { focusMode: "continuous" },
                { exposureMode: "continuous" },
                { whiteBalanceMode: "continuous" }
              ]
            }
          },
          (decodedText, decodedResult) => {
            vibrate([200, 100, 200]);
            handleScanSuccess(decodedText);
          },
          (error) => {
            if (error.includes('No QR code found') || 
                error.includes('NotFoundException') ||
                error.includes('No MultiFormat Readers')) {
              return;
            }
            console.warn('QR scan error:', error);
          }
        );
        
      }
    }

    setCameraPermission('granted');

  } catch (error) {
    setCameraPermission('denied');
    setIsScanning(false);
    
    vibrate([500]);
    
    // Show detailed error message
    let errorMessage = 'Failed to start camera scanner';
    
    if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
      errorMessage = 'Camera permission denied. Please allow camera access and try again.';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No camera found on this device.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Camera is already in use by another application.';
    } else if (error.name === 'OverconstrainedError') {
      errorMessage = 'Back camera not available. Will try front camera if needed.';
    } else if (error.name === 'NotSupportedError') {
      errorMessage = 'Camera not supported on this browser.';
    }

    Swal.fire({
      title: 'Camera Error',
      html: `
        <p>${errorMessage}</p>
        <br>
        <p><strong>Troubleshooting:</strong></p>
        <ul style="text-align: left; margin: 10px 0;">
          <li>Make sure you're using HTTPS or localhost</li>
          <li>Grant camera permissions when prompted</li>
          <li>Close other apps using the camera</li>
          <li>Try refreshing the page</li>
          <li>On iOS: Check Safari settings for camera access</li>
          <li>Try rotating your device if back camera doesn't work</li>
        </ul>
      `,
      icon: 'error',
      confirmButtonText: 'OK'
    });
  }
};

// Replace the startCameraScanning function with this enhanced version

  // Stop camera scanning
  const stopCameraScanning = async () => {
  try {
    if (html5QrCodeRef.current) {
      await html5QrCodeRef.current.stop();
      await html5QrCodeRef.current.clear();
      html5QrCodeRef.current = null;
    }
    
    // Clear scanner container
    const scannerContainer = document.getElementById("qr-scanner-container");
    if (scannerContainer) {
      scannerContainer.innerHTML = '';
    }
    
  } catch (error) {
    console.error('Error stopping camera scanner:', error);
    
    // Force clear even on error
    const scannerContainer = document.getElementById("qr-scanner-container");
    if (scannerContainer) {
      scannerContainer.innerHTML = '';
    }
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
  // IMMEDIATELY STOP scanner after successful scan
  if (html5QrCodeRef.current) {
    try {
      await html5QrCodeRef.current.stop();
      await html5QrCodeRef.current.clear();
      html5QrCodeRef.current = null;
      
      // Clear scanner container
      const scannerContainer = document.getElementById("qr-scanner-container");
      if (scannerContainer) {
        scannerContainer.innerHTML = '';
      }
      
      // Update scanning state
      setIsScanning(false);
      
    } catch (error) {
      console.warn('Could not stop scanner:', error);
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
              de style="background: #f5f5f5; padding: 8px; border-radius: 4px; display: block; margin: 8px 0; word-break: break-all;">${decodedText}</code>
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
      vibrate([300, 100, 300]); // Error vibration
      
      Swal.fire('Error', `Invalid QR format: ${jsonError.message}`, 'error');
      return;
    }

    const shouldProceed = await new Promise((resolve) => {
      setScannedItems((currentItems) => {
        const alreadyScanned = currentItems.find((item) => item.uniqueId === qrData.uniqueId);
        if (alreadyScanned) {
          vibrate([100, 50, 100, 50, 100]); // Warning vibration pattern
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

      // Success vibration pattern
      vibrate([100, 50, 100, 50, 200]);

      const qualityEmoji = qualityCheck.passed ? '✅' : '⚠️';
      const qualityText = qualityCheck.passed ? 'Good Condition' : 'Quality Issue Noted';
      
      Swal.fire({
        icon: qualityCheck.passed ? 'success' : 'warning',
        title: `${qualityEmoji} Carton Received Successfully!`,
        html: `
          <div style="text-align: left; background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <p><strong>Article:</strong> ${newItem.articleName}</p>
            <p><strong>Carton:</strong> #${newItem.cartonNumber}</p>
            <p><strong>Colors:</strong> ${Array.isArray(newItem.colors) ? newItem.colors.join(', ') : newItem.colors}</p>
            <p><strong>Sizes:</strong> ${Array.isArray(newItem.sizes) ? newItem.sizes.join(', ') : newItem.sizes}</p>
            <p><strong>Quality:</strong> ${qualityText}</p>
          </div>
          <p style="margin-top: 10px; color: #666; font-size: 14px;">Scanner closed. Click "Start Scanner" to receive another carton.</p>
        `,
        confirmButtonText: 'OK',
        timer: 4000,
        timerProgressBar: true
      });
      
    } else {
      throw new Error(response.data.message || 'Server returned failure');
    }
    
  } catch (error) {
    // Error vibration
    vibrate([500, 200, 500]);
    
    const msg = error.response?.data?.message || error.message || 'Failed to process scan';
    
    // Don't show error for user-cancelled quality check
    if (msg.includes('Receipt cancelled') || msg.includes('Quality check cancelled')) {
      Swal.fire({
        icon: 'info',
        title: 'Receipt Cancelled',
        text: 'Carton receipt was cancelled. Scanner closed.',
        confirmButtonText: 'OK'
      });
    } else {
      Swal.fire('Error', `Scan failed: ${msg}`, 'error');
    }
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

  const stopScanning = async () => {
  vibrate([100]); // Stop feedback vibration
  
  try {
    if (html5QrCodeRef.current) {
      await html5QrCodeRef.current.stop();
      await html5QrCodeRef.current.clear();
      html5QrCodeRef.current = null;
    }
    
    // Clear scanner container
    const scannerContainer = document.getElementById("qr-scanner-container");
    if (scannerContainer) {
      scannerContainer.innerHTML = '';
      scannerContainer.style.display = '';
    }
    
  } catch (error) {
    console.error('Error stopping camera scanner:', error);
    
    // Even if error, clear the container
    const scannerContainer = document.getElementById("qr-scanner-container");
    if (scannerContainer) {
      scannerContainer.innerHTML = '';
    }
  } finally {
    setIsScanning(false);
  }
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
                    📱 Mobile optimized • 🎯 Back camera • 📳 Vibration feedback
                  </p>
                </div>
              )}
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