import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import Swal from 'sweetalert2';
import { baseURL } from '../../Utils/URLS';

const ShipmentScanner = () => {
  const [scannedItems, setScannedItems] = useState([]);
  const [selectedDistributor, setSelectedDistributor] = useState('');
  const [distributors, setDistributors] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [shipmentCreated, setShipmentCreated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const html5QrCodeRef = useRef(null);
  const qrReaderRef = useRef(null);

  useEffect(() => {
    fetchDistributors();
    initializeCamera();
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isScanning) {
      startScanning();
    } else {
      stopScanning();
    }
  }, [isScanning]);

  const cleanup = async () => {
    try {
      if (qrReaderRef.current) {
        const state = qrReaderRef.current.getState();
        if (state === Html5Qrcode.SCANNING) {
          await qrReaderRef.current.stop();
        }
        qrReaderRef.current.clear();
        qrReaderRef.current = null;
      }
    } catch (error) {
      console.log('Cleanup error:', error);
    }
  };

  const vibrate = (pattern = [100]) => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      console.log('Vibration not supported:', error);
    }
  };

  const initializeCamera = async () => {
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
    
    // Strategy 1: Look for back/rear/environment keywords
    let backCamera = availableCameras.find(camera => 
      camera.label && (
        camera.label.toLowerCase().includes('back') ||
        camera.label.toLowerCase().includes('rear') ||
        camera.label.toLowerCase().includes('environment')
      )
    );
    
    // Strategy 2: If multiple cameras, avoid front-facing ones
    if (!backCamera && availableCameras.length > 1) {
      backCamera = availableCameras.find(camera => 
        camera.label && !(
          camera.label.toLowerCase().includes('front') ||
          camera.label.toLowerCase().includes('user') ||
          camera.label.toLowerCase().includes('selfie')
        )
      );
    }
    
    // Strategy 3: Use first camera as fallback (often back camera on mobile)
    if (!backCamera) {
      backCamera = availableCameras[0];
    }
    
    return backCamera;
  };

  const startScanning = async () => {
    try {
      await cleanup(); // Clean up any existing scanner
      
      const qrReader = new Html5Qrcode("qr-scanner-container");
      qrReaderRef.current = qrReader;
      
      // Get back camera
      const backCamera = getBackCamera();
      const cameraId = backCamera ? backCamera.id : { facingMode: "environment" };
      
      console.log('Starting scanner with camera:', backCamera || 'environment facingMode');
      
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

      await qrReader.start(
        cameraId,
        config,
        (decodedText) => {
          console.log('QR Code scanned:', decodedText);
          vibrate([200, 100, 200]);
          handleScanSuccess(decodedText);
        },
        (error) => {
          // Suppress common scanning errors
          if (!error.includes('NotFoundException') && 
              !error.includes('No QR code found')) {
            console.warn('Scan error:', error);
          }
        }
      );
      
      setCameraPermission('granted');
      console.log('Scanner started successfully');
      
    } catch (error) {
      console.error('Error starting scanner:', error);
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

  const stopScanning = async () => {
    try {
      if (qrReaderRef.current) {
        const state = qrReaderRef.current.getState();
        if (state === Html5Qrcode.SCANNING) {
          await qrReaderRef.current.stop();
        }
        qrReaderRef.current.clear();
        qrReaderRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
  };

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

  const handleScanSuccess = async (decodedText) => {
    console.log('=== SHIPMENT QR SCAN DEBUG ===');
    console.log('Raw decoded text:', decodedText);
    
    // Pause scanner after successful scan
    if (qrReaderRef.current) {
      try {
        await qrReaderRef.current.pause(true);
        console.log('Scanner paused after successful scan');
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
          } else {
            console.log('Non-JSON QR Content:', decodedText);
            vibrate([300, 100, 300]);
            
            Swal.fire({
              title: 'Invalid QR Code',
              html: `
                <p>This QR code doesn't contain the expected shipment data format.</p>
                <p><strong>Content found:</strong></p>
                <code style="background: #f5f5f5; padding: 8px; border-radius: 4px; display: block; margin: 8px 0; word-break: break-all;">${decodedText}</code>
                <p>Please scan a valid shipment QR code.</p>
              `,
              icon: 'warning',
              confirmButtonText: 'Scan Again'
            }).then(() => {
              if (qrReaderRef.current) {
                qrReaderRef.current.resume();
              }
            });
            return;
          }
        } else {
          qrData = decodedText;
        }
      } catch (jsonError) {
        console.log('JSON Parse Error:', jsonError);
        vibrate([300, 100, 300]);
        
        Swal.fire({
          title: 'Invalid QR Code Format',
          html: `
            <p>Unable to parse QR code data.</p>
            <p><strong>Content:</strong></p>
            <code style="background: #f5f5f5; padding: 8px; border-radius: 4px; display: block; margin: 8px 0; word-break: break-all;">${decodedText}</code>
            <p>Please ensure you're scanning a valid shipment QR code.</p>
          `,
          icon: 'error',
          confirmButtonText: 'Scan Again'
        }).then(() => {
          if (qrReaderRef.current) {
            qrReaderRef.current.resume();
          }
        });
        return;
      }

      const shouldProceed = await new Promise((resolve) => {
        setScannedItems((currentItems) => {
          const alreadyScanned = currentItems.find(item => item.uniqueId === qrData.uniqueId);
          if (alreadyScanned) {
            vibrate([100, 50, 100, 50, 100]);
            Swal.fire('Warning', 'This carton has already been scanned!', 'warning').then(() => {
              if (qrReaderRef.current) {
                qrReaderRef.current.resume();
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
        console.error('Missing required fields:', qrData);
        vibrate([300, 100, 300]);
        
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
          confirmButtonText: 'Scan Again'
        }).then(() => {
          if (qrReaderRef.current) {
            qrReaderRef.current.resume();
          }
        });
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

      console.log('Sending uniqueId to backend:', qrData.uniqueId);
      console.log('Making API call to:', `${baseURL}/api/v1/shipment/scan/${qrData.uniqueId}`);

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

      console.log('Backend response:', response.data);

      if (response.data.result) {
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

        console.log('Adding new item:', newItem);
        setScannedItems(prev => [...prev, newItem]);
        
        vibrate([100, 50, 100, 50, 200]);
        
        Swal.fire({
          icon: 'success',
          title: '✅ Carton Scanned!',
          text: `${newItem.articleName} - Carton ${newItem.cartonNumber}`,
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });

        setTimeout(() => {
          if (qrReaderRef.current) {
            qrReaderRef.current.resume();
          }
        }, 2000);
        
      } else {
        throw new Error(response.data.message || 'Server returned failure');
      }

    } catch (error) {
      console.error('=== QR SCAN ERROR ===');
      console.error('Error details:', error);
      console.error('Response data:', error.response?.data);
      console.error('Status:', error.response?.status);
      
      vibrate([500, 200, 500]);
      
      let errorMessage = 'Failed to process scan';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Swal.fire('Error', errorMessage, 'error').then(() => {
        if (qrReaderRef.current) {
          qrReaderRef.current.resume();
        }
      });
    }
  };

  const handleStartScanning = () => {
    if (!selectedDistributor) {
      Swal.fire('Warning', 'Please select a distributor first', 'warning');
      return;
    }
    console.log('Starting scan process...');
    vibrate([50]);
    setIsScanning(true);
  };

  const handleStopScanning = () => {
    console.log('Stopping scan process...');
    vibrate([100]);
    setIsScanning(false);
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
      vibrate([50, 50]);

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
      
      vibrate([100, 50, 100]);
      
      Swal.fire({
        icon: 'success',
        title: 'Shipment Created!',
        text: `Shipment ID: ${shipmentResult.shipmentId}`,
        confirmButtonText: 'OK'
      });

      setScannedItems([]);
      setSelectedDistributor('');
      handleStopScanning();

    } catch (error) {
      vibrate([300]);
      Swal.fire('Error', error.response?.data?.message || 'Failed to create shipment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const removeScannedItem = (uniqueId) => {
    vibrate([100]);
    setScannedItems(prev => prev.filter(item => item.uniqueId !== uniqueId));
  };

  const downloadShipmentReceipt = async () => {
    if (!shipmentCreated) return;

    try {
      setLoading(true);
      vibrate([50, 50]);

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

      vibrate([100, 50, 100]);

      Swal.fire({
        icon: 'success',
        title: 'Receipt Downloaded!',
        text: 'PDF receipt has been downloaded successfully',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error downloading receipt:', error);
      vibrate([300]);
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
        vibrate([100, 100, 100]);
        
        await cleanup();
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
      console.error('Logout error:', error);
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
                <div className="text-sm text-gray-500">Scanned Items</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{scannedItems.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Scanner */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-0">🎯 QR Scanner</h2>
              {availableCameras.length > 1 && !isScanning && (
                <div className="text-xs text-gray-500">
                  Back camera auto-selected
                </div>
              )}
            </div>
            
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

            {/* Scanner Controls */}
            <div className="mb-4">
              {!isScanning ? (
                <button
                  onClick={handleStartScanning}
                  disabled={!selectedDistributor}
                  className={`w-full px-4 py-3 rounded-lg transition duration-200 font-medium text-sm ${
                    !selectedDistributor
                      ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-700 text-white hover:bg-gray-800'
                  }`}
                >
                  {!selectedDistributor
                    ? '🔒 Select Distributor First'
                    : '📷 Start Camera Scanner'}
                </button>
              ) : (
                <button
                  onClick={handleStopScanning}
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
                  <div className="text-4xl sm:text-6xl mb-4">📷</div>
                  <p className="text-gray-500">Scanner ready for shipment QR codes</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Select distributor first, then click "Start Scanner"
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    📱 Mobile optimized • 🎯 Back camera auto-selected • 📳 Vibration feedback
                  </p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-blue-700">
                <strong>Instructions:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Select the destination distributor</li>
                  <li>Start scanner and point at QR codes</li>
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

            <div className="space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
              {scannedItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-2">📦</div>
                  <p className="text-gray-500">No items scanned yet</p>
                  <p className="text-sm text-gray-400">Start scanning to add items here</p>
                </div>
              ) : (
                scannedItems.map((item) => (
                  <div key={item.uniqueId} className="bg-gray-50 border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div className="flex-1 mb-3 sm:mb-0">
                        <div className="font-semibold text-gray-800 mb-2">{item.articleName}</div>
                        <div className="text-sm text-gray-600 space-y-1">
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

            {/* Summary */}
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

        {/* Shipment Success Modal */}
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