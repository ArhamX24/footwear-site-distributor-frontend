import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import Swal from 'sweetalert2';
import { baseURL } from '../../Utils/URLS';

const ShipmentScanner = () => {
  const [scannedItems, setScannedItems] = useState([]);
  const [selectedDistributor, setSelectedDistributor] = useState('');
  const [distributors, setDistributors] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerInstance, setScannerInstance] = useState(null);
  const [shipmentCreated, setShipmentCreated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanMethod, setScanMethod] = useState('camera');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDistributors();
  }, []);

  useEffect(() => {
    if (isScanning && scanMethod === 'camera') {
      initializeScanner();
    }
    
    return () => {
      cleanupScanner();
    };
  }, [isScanning, scanMethod]);

  const fetchDistributors = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/v1/admin/distributor/get`, {
        withCredentials: true
      });
      
      if (response.data.result) {
        setDistributors(response.data.data || []);
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to fetch distributors', 'error');
    }
  };

  // ✅ Initialize camera scanner using html5-qrcode
  const initializeScanner = async () => {
    try {
      console.log('Initializing Html5QrcodeScanner...');
      
      if (scannerInstance) {
        cleanupScanner();
      }

      const config = {
        fps: 10,
        qrbox: { width: 200, height: 200 },
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
        (decodedText) => {
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

      setScannerInstance(scanner);
      setCameraPermission('granted');
      console.log('Html5QrcodeScanner initialized successfully');

    } catch (error) {
      console.error('Scanner initialization error:', error);
      setCameraPermission('denied');
      setIsScanning(false);
      
      Swal.fire({
        title: 'Camera Access Required',
        html: `
          <p>Camera access is needed to scan QR codes.</p>
          <p>Please:</p>
          <ol style="text-align: left; margin: 10px 0;">
            <li>Click "Allow" when your browser asks for camera permission</li>
            <li>If you clicked "Block", click the camera icon in your browser's address bar</li>
            <li>Select "Allow" for camera access</li>
            <li>Refresh the page and try again</li>
          </ol>
        `,
        icon: 'info',
        confirmButtonText: 'I understand'
      });
    }
  };

  const cleanupScanner = () => {
    console.log('Cleaning up scanner...');
    if (scannerInstance) {
      try {
        scannerInstance.clear();
        setScannerInstance(null);
        
        const container = document.getElementById('qr-scanner-container');
        if (container) {
          container.innerHTML = '';
        }
      } catch (error) {
        console.error('Error during scanner cleanup:', error);
      }
    }
  };

  // ✅ Helper function to process image and extract QR data using jsQR
  const processImageForQR = async (file) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        try {
          // Try jsQR with different settings
          let result = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          
          if (result) {
            console.log('✅ jsQR successfully decoded:', result.data);
            resolve(result.data);
            return;
          }
          
          // Try with inversion
          result = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });
          
          if (result) {
            console.log('✅ jsQR with inversion decoded:', result.data);
            resolve(result.data);
            return;
          }
          
          // Try with enhanced contrast
          const enhancedImageData = enhanceImageContrast(imageData);
          result = jsQR(enhancedImageData.data, enhancedImageData.width, enhancedImageData.height, {
            inversionAttempts: "attemptBoth",
          });
          
          if (result) {
            console.log('✅ jsQR with enhanced contrast decoded:', result.data);
            resolve(result.data);
            return;
          }
          
          reject(new Error('No QR code found in image'));
          
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      
      const reader = new FileReader();
      reader.onload = (e) => img.src = e.target.result;
      reader.readAsDataURL(file);
    });
  };

  // ✅ Helper function to enhance image contrast
  const enhanceImageContrast = (imageData) => {
    const data = new Uint8ClampedArray(imageData.data);
    const factor = 1.5;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128));
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128));
    }
    
    return new ImageData(data, imageData.width, imageData.height);
  };

  // ✅ Enhanced handleScanSuccess with better QR parsing
  const handleScanSuccess = async (decodedText) => {
    console.log('=== SHIPMENT QR SCAN DEBUG ===');
    console.log('Raw decoded text:', decodedText);
    
    // Pause scanning during processing
    if (scannerInstance && scanMethod === 'camera') {
      try {
        await scannerInstance.pause();
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
            console.log('QR Content:', decodedText);
            Swal.fire({
              title: 'Invalid QR Code',
              html: `
                <p>This QR code doesn't contain the expected shipment data format.</p>
                <p><strong>Content found:</strong></p>
                <code style="background: #f5f5f5; padding: 8px; border-radius: 4px; display: block; margin: 8px 0; word-break: break-all;">${decodedText}</code>
                <p>Please scan a valid shipment QR code.</p>
              `,
              icon: 'warning',
              confirmButtonText: 'OK'
            });
            
            if (scannerInstance && scanMethod === 'camera') {
              await scannerInstance.resume();
            }
            return;
          }
        } else {
          qrData = decodedText;
        }
      } catch (jsonError) {
        console.log('JSON Parse Error:', jsonError);
        Swal.fire({
          title: 'Invalid QR Code Format',
          html: `
            <p>Unable to parse QR code data.</p>
            <p><strong>Content:</strong></p>
            <code style="background: #f5f5f5; padding: 8px; border-radius: 4px; display: block; margin: 8px 0; word-break: break-all;">${decodedText}</code>
            <p>Please ensure you're scanning a valid shipment QR code.</p>
          `,
          icon: 'error',
          confirmButtonText: 'OK'
        });
        
        if (scannerInstance && scanMethod === 'camera') {
          await scannerInstance.resume();
        }
        return;
      }

      const shouldProceed = await new Promise((resolve) => {
        setScannedItems((currentItems) => {
          const alreadyScanned = currentItems.find(item => item.uniqueId === qrData.uniqueId);
          if (alreadyScanned) {
            Swal.fire('Warning', 'This carton has already been scanned!', 'warning');
            resolve(false);
            return currentItems;
          }
          resolve(true);
          return currentItems;
        });
      });

      if (!shouldProceed) {
        if (scannerInstance && scanMethod === 'camera') {
          await scannerInstance.resume();
        }
        return;
      }

      if (!qrData.uniqueId || !(qrData.articleName || qrData.contractorInput?.articleName)) {
        Swal.fire({
          title: 'Invalid QR Code Data',
          html: `
            <p>QR code is missing required information:</p>
            <ul style="text-align: left; margin: 10px 0;">
              <li>Unique ID: ${qrData.uniqueId ? '✅' : '❌ Missing'}</li>
              <li>Article Name: ${(qrData.articleName || qrData.contractorInput?.articleName) ? '✅' : '❌ Missing'}</li>
            </ul>
            <p>Please scan a complete shipment QR code.</p>
          `,
          icon: 'error',
          confirmButtonText: 'OK'
        });
        
        if (scannerInstance && scanMethod === 'camera') {
          await scannerInstance.resume();
        }
        return;
      }

      let currentDistributor;
      setSelectedDistributor((current) => {
        currentDistributor = current;
        return current;
      });

      let currentDistributors;
      setDistributors((current) => {
        currentDistributors = current;
        return current;
      });

      const response = await axios.post(
        `${baseURL}/api/v1/shipment/scan/${qrData.uniqueId}`,
        {
          event: 'shipped',
          scannedBy: {
            userType: 'shipment_manager'
          },
          distributorDetails: {
            distributorId: currentDistributor,
            distributorName: currentDistributors.find(d => d._id === currentDistributor)?.distributorDetails?.partyName || 
                           currentDistributors.find(d => d._id === currentDistributor)?.name || ''
          },
          trackingNumber: `TRACK_${Date.now()}`,
          notes: 'Scanned for shipment to distributor'
        },
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data.result) {
        // ✅ Format sizes properly
        const formatSizeRange = (sizes) => {
          if (!sizes) return 'N/A';
          if (Array.isArray(sizes)) {
            if (sizes.length === 1) return sizes[0].toString();
            if (sizes.length > 1) {
              const sorted = [...sizes].sort((a, b) => a - b);
              return `${sorted[0]}X${sorted[sorted.length - 1]}`;
            }
          }
          return sizes.toString();
        };

        const newItem = {
          uniqueId: qrData.uniqueId,
          articleName: qrData.articleName || qrData.contractorInput?.articleName,
          colors: qrData.contractorInput?.colors || qrData.colors,
          sizes: qrData.contractorInput?.sizes || qrData.sizes,
          sizesFormatted: formatSizeRange(qrData.contractorInput?.sizes || qrData.sizes),
          cartonNumber: qrData.contractorInput?.cartonNumber || qrData.cartonNumber,
          scannedAt: new Date().toLocaleTimeString(),
          status: 'shipped'
        };

        setScannedItems(prev => [...prev, newItem]);
        
        Swal.fire({
          icon: 'success',
          title: 'Carton Scanned!',
          text: `${newItem.articleName} - Carton ${newItem.cartonNumber}`,
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } else {
        throw new Error(response.data.message);
      }

      // Resume scanning after successful scan
      if (scannerInstance && scanMethod === 'camera') {
        await scannerInstance.resume();
      }

    } catch (error) {
      let errorMessage = 'Failed to process scan';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Swal.fire('Error', errorMessage, 'error');
      
      if (scannerInstance && scanMethod === 'camera') {
        await scannerInstance.resume();
      }
    }
  };

  // ✅ Enhanced file upload handler using jsQR
  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!selectedDistributor) {
      Swal.fire('Warning', 'Please select a distributor first', 'warning');
      event.target.value = '';
      return;
    }

    setUploadLoading(true);

    try {
      for (const file of files) {
        try {
          console.log('Scanning file:', file.name);
          
          let scanResult = null;
          
          // Try jsQR method first
          try {
            scanResult = await processImageForQR(file);
            console.log('✅ jsQR method successful');
          } catch (jsQrError) {
            console.log('jsQR method failed:', jsQrError.message);
            throw new Error(`No QR code found in ${file.name}`);
          }

          if (scanResult) {
            await handleScanSuccess(scanResult);
          }

        } catch (scanErr) {
          console.error('Scan failed for file:', file.name, scanErr);
          
          let errorMessage = `Could not scan QR code from ${file.name}`;
          if (scanErr.message.includes('No QR code found')) {
            errorMessage += '\n\n• No QR code detected in the image';
            errorMessage += '\n• Make sure the image is clear and well-lit';
            errorMessage += '\n• Try taking a new photo with better focus';
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
      setUploadLoading(false);
      event.target.value = '';
    }
  };

  const startScanning = () => {
    if (!selectedDistributor) {
      Swal.fire('Warning', 'Please select a distributor first', 'warning');
      return;
    }
    setIsScanning(true);
  };

  const stopScanning = () => {
    cleanupScanner();
    setIsScanning(false);
  };

  const handleScanMethodChange = (method) => {
    setScanMethod(method);
    if (isScanning && method === 'upload') {
      stopScanning();
    }
  };

  const triggerFileUpload = () => {
    if (!selectedDistributor) {
      Swal.fire('Warning', 'Please select a distributor first', 'warning');
      return;
    }
    fileInputRef.current?.click();
  };

  const createShipment = async () => {
    if (scannedItems.length === 0) {
      Swal.fire('Warning', 'Please scan at least one carton', 'warning');
      return;
    }

    if (!selectedDistributor) {
      Swal.fire('Warning', 'Please select a distributor', 'warning');
      return;
    }

    try {
      setLoading(true);

      const selectedDist = distributors.find(d => d._id === selectedDistributor);
      const shipmentId = `SHIP_${Date.now()}_${selectedDistributor.slice(-6)}`;
      
      const shipmentResult = {
        shipmentId: shipmentId,
        distributorName: selectedDist?.distributorDetails?.partyName || selectedDist?.name || '',
        totalCartons: scannedItems.length,
        shippedAt: new Date(),
        items: scannedItems
      };
      
      setShipmentCreated(shipmentResult);
      
      Swal.fire({
        icon: 'success',
        title: 'Shipment Created!',
        text: `Shipment ID: ${shipmentResult.shipmentId}`,
        confirmButtonText: 'OK'
      });

      setScannedItems([]);
      setSelectedDistributor('');
      stopScanning();

    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to create shipment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const removeScannedItem = (uniqueId) => {
    setScannedItems(prev => prev.filter(item => item.uniqueId !== uniqueId));
  };

  const downloadShipmentReceipt = async () => {
    if (!shipmentCreated) return;

    try {
      setLoading(true);

      const response = await axios.post(
        `${baseURL}/api/v1/shipment/receipt/generate`,
        {
          shipmentId: shipmentCreated.shipmentId,
          distributorName: shipmentCreated.distributorName,
          totalCartons: shipmentCreated.totalCartons,
          shippedAt: shipmentCreated.shippedAt,
          items: shipmentCreated.items
        },
        {
          withCredentials: true,
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Shipment_${shipmentCreated.shipmentId}_Receipt.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'Receipt Downloaded!',
        text: 'PDF receipt has been downloaded successfully',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error downloading receipt:', error);
      Swal.fire('Error', 'Failed to download receipt', 'error');
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* ✅ Responsive Header */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">📦 Shipment Scanner</h1>
              <p className="text-gray-600 mt-2">Scan cartons for distributor shipment</p>
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
                <div className="text-sm text-gray-500">Scanned Items</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{scannedItems.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Scanner */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">🎯 QR Scanner</h2>
            
            {/* Distributor Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Select Distributor <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDistributor}
                onChange={(e) => setSelectedDistributor(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                disabled={isScanning}
              >
                <option value="">Choose distributor...</option>
                {distributors.map(distributor => (
                  <option key={distributor._id} value={distributor._id}>
                    {distributor.distributorDetails?.partyName || distributor.name} - {distributor.phoneNo}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ Responsive Scan Method Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Scan Method
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => handleScanMethodChange('camera')}
                  className={`flex-1 px-4 py-2 rounded-lg border transition duration-200 text-sm ${
                    scanMethod === 'camera' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  📱 Camera
                </button>
                <button
                  onClick={() => handleScanMethodChange('upload')}
                  className={`flex-1 px-4 py-2 rounded-lg border transition duration-200 text-sm ${
                    scanMethod === 'upload' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  📁 Upload
                </button>
              </div>
            </div>

            {/* Scanner Controls */}
            <div className="mb-4">
              {scanMethod === 'camera' ? (
                !isScanning ? (
                  <button
                    onClick={startScanning}
                    disabled={!selectedDistributor}
                    className={`w-full px-4 py-3 rounded-lg transition duration-200 font-medium text-sm ${
                      !selectedDistributor
                        ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {!selectedDistributor
                      ? '🔒 Select Distributor First'
                      : '📱 Start Camera Scanner'}
                  </button>
                ) : (
                  <button
                    onClick={stopScanning}
                    className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition duration-200 font-medium text-sm"
                  >
                    ⏹️ Stop Scanner
                  </button>
                )
              ) : (
                <button
                  onClick={triggerFileUpload}
                  disabled={uploadLoading}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition duration-200 font-medium disabled:bg-green-400 text-sm"
                >
                  {uploadLoading ? '⏳ Processing...' : '📁 Upload QR Image(s)'}
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* ✅ Responsive Scanner Display */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[250px] sm:min-h-[300px] flex items-center justify-center">
              {isScanning && scanMethod === 'camera' ? (
                <div id="qr-scanner-container" className="w-full h-full"></div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className="text-4xl sm:text-6xl mb-4">
                    {scanMethod === 'camera' ? '📷' : '📁'}
                  </div>
                  <p className="text-gray-500 text-sm sm:text-base">
                    {scanMethod === 'camera' 
                      ? 'Scanner will appear here when started'
                      : 'Click "Upload QR Image(s)" to scan from file'
                    }
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-2">
                    {scanMethod === 'camera' 
                      ? 'Select distributor first, then click "Start Camera Scanner"'
                      : 'Supports JPG, PNG, and other image formats • Multiple images supported'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* ✅ Responsive Instructions */}
            <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-blue-700">
                <strong>Instructions:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Select the destination distributor</li>
                  <li>Choose scan method: Camera or Upload</li>
                  <li>
                    {scanMethod === 'camera' 
                      ? 'Start scanner and point at QR codes'
                      : 'Upload images containing QR codes'
                    }
                  </li>
                  <li>Each carton will be added to the shipment list</li>
                  <li>Create shipment when all items are scanned</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Panel - Scanned Items */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-0">📋 Scanned Items</h2>
              {scannedItems.length > 0 && (
                <button
                  onClick={createShipment}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 disabled:bg-green-400 text-sm"
                >
                  {loading ? '⏳ Creating...' : '✅ Create Shipment'}
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[400px] sm:max-h-96 overflow-y-auto">
              {scannedItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl sm:text-4xl mb-2">📦</div>
                  <p className="text-gray-500 text-sm sm:text-base">No items scanned yet</p>
                  <p className="text-xs sm:text-sm text-gray-400">Start scanning to add items here</p>
                </div>
              ) : (
                scannedItems.map((item) => (
                  <div key={item.uniqueId} className="bg-gray-50 border rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div className="flex-1 mb-3 sm:mb-0">
                        <div className="font-semibold text-gray-800 text-sm sm:text-base">
                          {item.articleName}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                          <div><strong>Colors:</strong> {Array.isArray(item.colors) ? item.colors.join(', ') : item.colors}</div>
                          <div><strong>Sizes:</strong> {item.sizesFormatted || (Array.isArray(item.sizes) ? item.sizes.join(', ') : item.sizes)}</div>
                          <div><strong>Carton:</strong> #{item.cartonNumber}</div>
                          <div><strong>Scanned:</strong> {item.scannedAt}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          ✅ {item.status}
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

            {/* ✅ Responsive Summary */}
            {scannedItems.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs sm:text-sm">
                    <div><strong>Total Items:</strong> {scannedItems.length} cartons</div>
                    <div><strong>Distributor:</strong> {distributors.find(d => d._id === selectedDistributor)?.distributorDetails?.partyName || distributors.find(d => d._id === selectedDistributor)?.name || 'Not selected'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ✅ Responsive Shipment Success Modal */}
        {shipmentCreated && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="text-center">
              <div className="text-4xl sm:text-6xl mb-4">🎉</div>
              <h2 className="text-xl sm:text-2xl font-bold text-green-600 mb-2">Shipment Created Successfully!</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="text-left space-y-2 text-sm sm:text-base">
                  <div><strong>Shipment ID:</strong> {shipmentCreated.shipmentId}</div>
                  <div><strong>Distributor:</strong> {shipmentCreated.distributorName}</div>
                  <div><strong>Total Cartons:</strong> {shipmentCreated.totalCartons}</div>
                  <div><strong>Created:</strong> {new Date(shipmentCreated.shippedAt).toLocaleString()}</div>
                </div>
              </div>
              <button
                onClick={downloadShipmentReceipt}
                className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition duration-200 text-sm sm:text-base"
              >
                📄 Download Receipt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipmentScanner;
