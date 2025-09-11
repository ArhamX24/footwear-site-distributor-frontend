import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import jsQR from 'jsqr';
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
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchInventoryStats();
  }, []);

  useEffect(() => {
    console.log('useEffect triggered:', { isScanning, scanMode });
    
    if (isScanning && scanMode === 'camera') {
      initializeScanner();
    }
    
    return () => {
      cleanupScanner();
    };
  }, [isScanning, scanMode]);

  // ✅ Helper function to process image and extract QR data using canvas
  const processImageForQR = async (file) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Set canvas size to image size
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        try {
          // Try jsQR first
          const result = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          
          if (result) {
            console.log('✅ jsQR successfully decoded:', result.data);
            resolve(result.data);
            return;
          }
          
          // If jsQR fails, try with inversion
          const resultInverted = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });
          
          if (resultInverted) {
            console.log('✅ jsQR with inversion successfully decoded:', resultInverted.data);
            resolve(resultInverted.data);
            return;
          }
          
          // If still no result, try with enhanced contrast
          const enhancedImageData = enhanceImageContrast(imageData);
          const resultEnhanced = jsQR(enhancedImageData.data, enhancedImageData.width, enhancedImageData.height, {
            inversionAttempts: "attemptBoth",
          });
          
          if (resultEnhanced) {
            console.log('✅ jsQR with enhanced contrast decoded:', resultEnhanced.data);
            resolve(resultEnhanced.data);
            return;
          }
          
          reject(new Error('No QR code found in image'));
          
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      // Load the image
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // ✅ Helper function to enhance image contrast
  const enhanceImageContrast = (imageData) => {
    const data = new Uint8ClampedArray(imageData.data);
    const factor = 1.5; // Contrast enhancement factor
    
    for (let i = 0; i < data.length; i += 4) {
      // Apply contrast enhancement to RGB channels
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));     // Red
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128)); // Green  
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128)); // Blue
      // Alpha channel remains unchanged
    }
    
    return new ImageData(data, imageData.width, imageData.height);
  };

  // ✅ Initialize camera scanner (keep existing html5-qrcode for camera)
  const initializeScanner = async () => {
    try {
      console.log('Initializing Html5QrcodeScanner...');
      
      if (scannerRef.current) {
        cleanupScanner();
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
        videoConstraints: {
          facingMode: "environment"
        }
      };

      const scanner = new Html5QrcodeScanner(
        "qr-scanner-container",
        config,
        false
      );

      scanner.render(
        (decodedText, decodedResult) => {
          console.log('✅ Camera QR Code scanned:', decodedText);
          handleScanSuccess(decodedText);
        },
        (error) => {
          if (error.includes('No QR code found')) {
            return;
          }
          console.warn('QR scan error:', error);
        }
      );

      scannerRef.current = scanner;
      setCameraPermission('granted');
      console.log('Html5QrcodeScanner initialized successfully');

    } catch (error) {
      console.error('Scanner initialization error:', error);
      setCameraPermission('denied');
      setIsScanning(false);
      
      Swal.fire({
        title: 'Camera Scanner Error',
        html: `
          <p>Failed to initialize camera scanner:</p>
          <p><strong>Error:</strong> ${error.message}</p>
          <p>Please check:</p>
          <ul style="text-align: left; margin: 10px 0;">
            <li>Camera permissions are granted</li>
            <li>You're using HTTPS or localhost</li>
            <li>No other app is using the camera</li>
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
        scannerRef.current.clear();
        scannerRef.current = null;
        
        const container = document.getElementById('qr-scanner-container');
        if (container) {
          container.innerHTML = '';
        }
      } catch (error) {
        console.error('Error during scanner cleanup:', error);
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
    console.log('=== QR SCAN DEBUG ===');
    console.log('Raw decoded text:', decodedText);
    console.log('Type:', typeof decodedText);
    
    if (scannerRef.current && scanMode === 'camera') {
      try {
        await scannerRef.current.pause();
      } catch (error) {
        console.warn('Could not pause scanner:', error);
      }
    }
    
    try {
      let qrData;
      
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
            
            if (scannerRef.current && scanMode === 'camera') {
              await scannerRef.current.resume();
            }
            return;
          }
        } else {
          qrData = decodedText;
          console.log('Object QR data:', qrData);
        }
      } catch (jsonError) {
        console.error('JSON Parse Error:', jsonError);
        Swal.fire('Error', `Invalid QR format: ${jsonError.message}`, 'error');
        
        if (scannerRef.current && scanMode === 'camera') {
          await scannerRef.current.resume();
        }
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

      if (!shouldProceed) {
        if (scannerRef.current && scanMode === 'camera') {
          await scannerRef.current.resume();
        }
        return;
      }

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
        
        if (scannerRef.current && scanMode === 'camera') {
          await scannerRef.current.resume();
        }
        return;
      }

      console.log('Sending uniqueId to backend:', qrData.uniqueId);
      
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

        console.log('Adding new item:', newItem);
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
        throw new Error(response.data.message || 'Server returned failure');
      }

      if (scannerRef.current && scanMode === 'camera') {
        await scannerRef.current.resume();
      }
      
    } catch (error) {
      console.error('=== QR SCAN ERROR ===');
      console.error('Error details:', error);
      console.error('Response data:', error.response?.data);
      console.error('Status:', error.response?.status);
      
      const msg = error.response?.data?.message || error.message || 'Failed to process scan';
      Swal.fire('Error', `Scan failed: ${msg}`, 'error');
      
      if (scannerRef.current && scanMode === 'camera') {
        await scannerRef.current.resume();
      }
    }
  };

  const checkItemQuality = async (qrData) => {
    console.log('Starting quality check dialog...');

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

    if (result.isConfirmed) {
      console.log('Quality check result:', result.value);
      return result.value;
    }
    throw new Error('Quality check cancelled');
  };

  // ✅ Enhanced file upload handler with multiple fallback methods
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
          
          let scanResult = null;
          let scanMethod = '';

          // ✅ Method 1: Try jsQR with canvas processing first (most reliable)
          try {
            console.log('Trying jsQR method...');
            scanResult = await processImageForQR(file);
            scanMethod = 'jsQR';
            console.log('✅ jsQR method successful');
          } catch (jsQrError) {
            console.log('jsQR method failed:', jsQrError.message);
            
            // ✅ Method 2: Try html5-qrcode as fallback
            try {
              console.log('Trying html5-qrcode fallback...');
              const html5QrCode = new Html5Qrcode("temp-scanner");
              
              try {
                const result = await html5QrCode.scanFile(file, true);
                scanResult = result;
                scanMethod = 'html5-qrcode';
                console.log('✅ html5-qrcode fallback successful');
              } finally {
                try {
                  await html5QrCode.clear();
                } catch (clearError) {
                  console.warn('Error clearing temp scanner:', clearError);
                }
              }
            } catch (html5Error) {
              console.log('html5-qrcode fallback also failed:', html5Error.message);
              throw new Error(`All scan methods failed. jsQR: ${jsQrError.message}, html5-qrcode: ${html5Error.message}`);
            }
          }

          if (scanResult) {
            console.log(`✅ QR scan successful using ${scanMethod}:`, scanResult);
            await handleScanSuccess(scanResult);
          } else {
            throw new Error('No QR code could be decoded from the image');
          }
          
        } catch (scanErr) {
          console.error('Scan failed for file:', file.name, scanErr);
          
          let errorMessage = `Could not scan QR code from ${file.name}`;
          if (scanErr.message.includes('No QR code found')) {
            errorMessage += '\n\n• No QR code detected in the image';
            errorMessage += '\n• Make sure the image is clear and well-lit';
            errorMessage += '\n• Try taking a new photo with better focus';
          } else if (scanErr.message.includes('All scan methods failed')) {
            errorMessage += '\n\n• Multiple scan methods attempted';
            errorMessage += '\n• The QR code might be damaged or corrupted';
            errorMessage += '\n• Try generating a new QR code';
          }
          
          Swal.fire({
            title: 'QR Scan Failed',
            html: `<p>${errorMessage.replace(/\n/g, '<br>')}</p>`,
            icon: 'warning',
            confirmButtonText: 'OK'
          });
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
        {/* Header - same as before */}
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
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    Supports JPG, PNG, WEBP • Multiple fallback scanners for better accuracy
                  </div>
                </div>
              )}
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[300px] sm:min-h-[350px] flex items-center justify-center">
              {scanMode === 'camera' && isScanning ? (
                <div id="qr-scanner-container" className="w-full h-full"></div>
              ) : scanMode === 'upload' ? (
                <div className="text-center py-12">
                  <div className="text-4xl sm:text-6xl mb-4">📁</div>
                  <p className="text-gray-500">Upload QR Code Image(s)</p>
                  <p className="text-sm text-gray-400 mt-2">Advanced multi-scanner processing for better results</p>
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

            <div id="temp-scanner" style={{ display: 'none' }}></div>

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

          {/* Right Panel - Received Items (same as before) */}
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
