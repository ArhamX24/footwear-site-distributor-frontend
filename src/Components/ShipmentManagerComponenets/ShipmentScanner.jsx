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
  const qrReaderRef = useRef(null);
  const isProcessingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    fetchDistributors();
    initializeCamera();
    
    return () => {
      isMountedRef.current = false;
      forceCleanup();
    };
  }, []);

  useEffect(() => {
    if (isScanning) {
      startScanning();
    } else {
      stopScanning();
    }
    
    return () => {
      if (!isScanning && qrReaderRef.current) {
        stopScanning();
      }
    };
  }, [isScanning]);

  const forceCleanup = async () => {
    try {
      if (qrReaderRef.current) {
        const state = qrReaderRef.current.getState();
        console.log('🧹 Cleanup - Scanner state:', state);
        
        if (state === 2) {
          await qrReaderRef.current.stop();
          console.log('✅ Scanner stopped');
        }
        await qrReaderRef.current.clear();
        console.log('✅ Scanner cleared');
      }
    } catch (error) {
      console.log('⚠️ Cleanup error (safe to ignore):', error.message);
    } finally {
      qrReaderRef.current = null;
      const container = document.getElementById("qr-scanner-container");
      if (container) {
        container.innerHTML = '';
        container.removeAttribute('style');
      }
      isProcessingRef.current = false;
      console.log('✅ Cleanup complete');
    }
  };

  const vibrate = (pattern = [100]) => {
    try {
      if ('vibrate' in navigator && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      console.log('Vibration not supported');
    }
  };

  const initializeCamera = async () => {
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

  const fetchDistributors = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/v1/admin/distributor/get`, {
        withCredentials: true
      });
      
      if (response.data.result) {
        setDistributors(response.data.data || []);
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to load distributors. Please refresh the page.', 'error');
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
    
    console.log('🎯 Selected camera:', backCamera?.label || 'Default');
    return backCamera;
  };

  const startScanning = async () => {
    try {
      console.log('🎬 Starting camera scanner...');
      
      await forceCleanup();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!isMountedRef.current) {
        console.log('⚠️ Component unmounted, aborting camera start');
        return;
      }
      
      const scanner = new Html5Qrcode("qr-scanner-container");
      qrReaderRef.current = scanner;
      
      const backCamera = getBackCamera();
      const cameraId = backCamera ? backCamera.id : { facingMode: "environment" };
      
      console.log('📷 Using camera ID:', cameraId);
      
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
          console.log('🔍 QR detected:', decodedText?.substring(0, 50));
          if (!isProcessingRef.current) {
            isProcessingRef.current = true;
            vibrate([200, 100, 200]);
            handleScanSuccess(decodedText);
          } else {
            console.log('⏭️ Already processing, skipping...');
          }
        },
        (error) => {
          // Suppress common scanning errors
        }
      );
      
      console.log('✅ Camera started successfully');
      setCameraPermission('granted');
      
    } catch (error) {
      console.error('❌ Camera start error:', error);
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
      console.log('🛑 Stopping camera scanner...');
      
      if (qrReaderRef.current) {
        const state = qrReaderRef.current.getState();
        console.log('📊 Current state:', state);
        
        if (state === 2) {
          await qrReaderRef.current.stop();
          console.log('✅ Scanner stopped');
        }
        
        await qrReaderRef.current.clear();
        console.log('✅ Scanner cleared');
        qrReaderRef.current = null;
      }
    } catch (error) {
      console.error('❌ Stop camera error:', error);
    } finally {
      const container = document.getElementById("qr-scanner-container");
      if (container) {
        container.innerHTML = '';
        container.removeAttribute('style');
      }
      isProcessingRef.current = false;
      setCameraPermission('available');
      console.log('✅ Stop complete');
    }
  };

  const handleScanSuccess = async (decodedText) => {
    console.log('✅ [SCAN] Processing scan...');
    
    try {
      let qrData;
      
      try {
        if (typeof decodedText === 'string') {
          const trimmed = decodedText.trim();
          
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            qrData = JSON.parse(trimmed);
            console.log('✅ Parsed JSON:', qrData);
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
      const articleName = qrData.articleName 
        || qrData.contractorInput?.articleName 
        || qrData.productReference?.articleName 
        || null;

      console.log('📦 [SCAN] Extracted:', { uniqueId, articleName });

      const shouldProceed = await new Promise((resolve) => {
        setScannedItems((currentItems) => {
          const alreadyScanned = currentItems.find(item => item.uniqueId === uniqueId);
          if (alreadyScanned) {
            vibrate([100, 50, 100, 50, 100]);
            Swal.fire('Already Scanned', 'This carton has already been scanned!', 'warning');
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

      if (!currentDistributor) {
        vibrate([300, 100, 300]);
        Swal.fire('Warning', 'Please select a distributor first', 'warning');
        isProcessingRef.current = false;
        return;
      }

      if (isScanning) {
        console.log('🛑 Stopping scanner after successful scan...');
        setIsScanning(false);
        await stopScanning();
      }

      console.log('📡 [SCAN] Sending to backend...');
      const response = await axios.post(
        `${baseURL}/api/v1/shipment/scan/${uniqueId}`,
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
        const formatSizeRange = (sizes) => {
          if (!sizes) return 'N/A';
          if (!Array.isArray(sizes)) return sizes.toString();
          if (sizes.length === 0) return 'N/A';
          if (sizes.length === 1) return sizes[0].toString();
          
          const sorted = [...sizes].sort((a, b) => a - b);
          return `${sorted[0]}X${sorted[sorted.length - 1]}`;
        };

        const colors = qrData.contractorInput?.colors || qrData.colors || ['Not specified'];
        const sizes = qrData.contractorInput?.sizes || qrData.sizes || [];
        const cartonNumber = qrData.contractorInput?.cartonNumber || qrData.cartonNumber || 'N/A';

        const newItem = {
          uniqueId: uniqueId,
          articleName: articleName,
          colors: colors,
          sizes: sizes,
          sizesFormatted: formatSizeRange(sizes),
          cartonNumber: cartonNumber,
          scannedAt: new Date().toLocaleTimeString(),
          status: 'shipped'
        };

        setScannedItems(prev => [...prev, newItem]);
        
        vibrate([100, 50, 100, 50, 200]);
        
        Swal.fire({
          icon: 'success',
          title: '✅ Carton Scanned!',
          text: `${newItem.articleName} - Carton ${newItem.cartonNumber}`,
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
        
      } else {
        throw new Error(response.data.message || 'Server returned failure');
      }

    } catch (error) {      
      vibrate([500, 200, 500]);
      
      console.error('❌ Scan error:', error);
      
      Swal.fire({
        title: 'Scan Failed',
        text: 'Unable to process the scan. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1000);
    }
  };

  const handleStartScanning = () => {
    if (!selectedDistributor) {
      Swal.fire('Warning', 'Please select a distributor first', 'warning');
      return;
    }
    vibrate([50]);
    setIsScanning(true);
  };

  const handleStopScanning = async () => {
    vibrate([100]);
    await forceCleanup();
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
        distributorName: selectedDist?.distributorDetails?.partyName || selectedDist?.name,
        distributorPhoneNo: selectedDist?.phoneNo,
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
      Swal.fire('Error', 'Failed to create shipment. Please try again.', 'error');
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
          distributorPhoneNo: shipmentCreated.distributorPhoneNo,
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
      vibrate([300]);
      console.error('PDF Download Error:', error);
      Swal.fire('Error', 'Failed to download receipt. Please try again.', 'error');
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

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[300px] sm:min-h-[400px] flex items-center justify-center bg-black">
              {isScanning ? (
                <div id="qr-scanner-container" className="w-full h-full"></div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl sm:text-6xl mb-4">📷</div>
                  <p className="text-white">Scanner ready for shipment QR codes</p>
                  <p className="text-sm text-gray-300 mt-2">
                    Select distributor first, then click "Start Scanner"
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    📱 Auto-stops after scan • 🎯 Back camera • 📳 Vibration feedback
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
                  <li>Scanner auto-stops after successful scan</li>
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
              <p className="text-gray-600 mb-4">Your shipment has been created and is ready for delivery</p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div><strong>Shipment ID:</strong> {shipmentCreated.shipmentId}</div>
                  <div><strong>Distributor:</strong> {shipmentCreated.distributorName}</div>
                  <div><strong>Total Cartons:</strong> {shipmentCreated.totalCartons}</div>
                  <div><strong>Created:</strong> {new Date(shipmentCreated.shippedAt).toLocaleString()}</div>
                </div>
              </div>

              <button
                onClick={downloadShipmentReceipt}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-blue-400 font-medium"
              >
                {loading ? '⏳ Generating PDF...' : '📥 Download Receipt'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipmentScanner;