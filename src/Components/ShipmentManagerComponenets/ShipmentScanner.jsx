import React, { useState, useEffect, useRef } from 'react';
import { Camera, Package, CheckCircle, XCircle, LogOut, Download } from 'lucide-react';

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
  const isMountedRef = useRef(true); // ✅ Track component mount status

  // Mock data for demo
  useEffect(() => {
    setDistributors([
      { _id: '1', distributorDetails: { partyName: 'ABC Distributors' }, phoneNo: '9876543210' },
      { _id: '2', distributorDetails: { partyName: 'XYZ Trading Co.' }, phoneNo: '9876543211' },
      { _id: '3', distributorDetails: { partyName: 'Global Supplies Ltd' }, phoneNo: '9876543212' }
    ]);
    setAvailableCameras([
      { id: 'camera1', label: 'Back Camera (environment)' },
      { id: 'camera2', label: 'Front Camera' }
    ]);
    setCameraPermission('available');
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      forceCleanup();
    };
  }, []);

  // ✅ Separate useEffect for scanning state - prevents race conditions
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

  const vibrate = (pattern = [100]) => {
    try {
      if ('vibrate' in navigator && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      console.log('Vibration not supported');
    }
  };

  const forceCleanup = async () => {
    try {
      if (qrReaderRef.current) {
        const state = qrReaderRef.current?.getState?.();
        console.log('🧹 Cleanup - Scanner state:', state);
        
        if (state === 2) { // SCANNING state
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
      
      // ✅ Force cleanup first
      await forceCleanup();
      
      // ✅ Wait longer for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ✅ Check if component is still mounted
      if (!isMountedRef.current) {
        console.log('⚠️ Component unmounted, aborting camera start');
        return;
      }
      
      // Mock scanner for demo
      console.log('📷 Mock scanner started');
      setCameraPermission('granted');
      
      // Simulate camera view
      const container = document.getElementById("qr-scanner-container");
      if (container) {
        container.innerHTML = `
          <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #1a1a1a; border-radius: 8px;">
            <div style="text-align: center; color: white;">
              <div style="font-size: 48px; margin-bottom: 16px;">📷</div>
              <p style="margin: 0; font-size: 14px;">Camera Active</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">Point at QR code to scan</p>
              <button onclick="window.simulateScan()" style="margin-top: 16px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
                Simulate Scan
              </button>
            </div>
          </div>
        `;
      }
      
      // Add global function for demo
      window.simulateScan = () => {
        const mockQRData = {
          uniqueId: `CARTON_${Date.now()}`,
          articleName: 'Premium Cotton T-Shirt',
          contractorInput: {
            colors: ['Red', 'Blue', 'Green'],
            sizes: [38, 40, 42, 44],
            cartonNumber: Math.floor(Math.random() * 1000) + 1
          }
        };
        handleScanSuccess(JSON.stringify(mockQRData));
      };
      
    } catch (error) {
      console.error('❌ Camera start error:', error);
      setCameraPermission('denied');
      setIsScanning(false);
      vibrate([500]);
      
      showAlert('Camera Error', 'Unable to start camera. Please grant camera permission and try again.', 'error');
    }
  };

  const stopScanning = async () => {
    try {
      console.log('🛑 Stopping camera scanner...');
      
      if (qrReaderRef.current) {
        const state = qrReaderRef.current?.getState?.();
        console.log('📊 Current state:', state);
        
        if (state === 2) {
          await qrReaderRef.current.stop();
          console.log('✅ Scanner stopped');
        }
        
        await qrReaderRef.current.clear();
        console.log('✅ Scanner cleared');
        qrReaderRef.current = null;
      }
      
      // Clean up mock scanner
      window.simulateScan = null;
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
            showAlert('Invalid QR Code', 'Please try scanning again. Make sure you are scanning a valid carton QR code.', 'warning');
            isProcessingRef.current = false;
            return;
          }
        } else {
          qrData = decodedText;
        }
      } catch (jsonError) {
        vibrate([300, 100, 300]);
        showAlert('Invalid QR Code', 'Please try scanning again.', 'error');
        isProcessingRef.current = false;
        return;
      }

      if (!qrData || typeof qrData !== 'object') {
        vibrate([300, 100, 300]);
        showAlert('Invalid QR Code', 'Please try scanning again.', 'error');
        isProcessingRef.current = false;
        return;
      }

      const uniqueId = qrData.uniqueId || null;
      const articleName = qrData.articleName 
        || qrData.contractorInput?.articleName 
        || qrData.productReference?.articleName 
        || null;

      console.log('📦 [SCAN] Extracted:', { uniqueId, articleName });

      // Check duplicates
      const shouldProceed = await new Promise((resolve) => {
        setScannedItems((currentItems) => {
          const alreadyScanned = currentItems.find(item => item.uniqueId === uniqueId);
          if (alreadyScanned) {
            vibrate([100, 50, 100, 50, 100]);
            showAlert('Already Scanned', 'This carton has already been scanned!', 'warning');
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
        showAlert('Invalid QR Code', 'QR code is missing required information. Please try scanning again.', 'error');
        isProcessingRef.current = false;
        return;
      }

      // Get current distributor
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
        showAlert('Warning', 'Please select a distributor first', 'warning');
        isProcessingRef.current = false;
        return;
      }

      // ✅ Stop scanner BEFORE showing success dialog
      if (isScanning) {
        console.log('🛑 Stopping scanner after successful scan...');
        setIsScanning(false);
        await stopScanning();
      }

      // Mock API call
      console.log('📡 [SCAN] Sending to backend...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

      const formatSizeRange = (sizes) => {
        if (!sizes) return 'N/A';
        if (!Array.isArray(sizes)) return sizes.toString();
        if (sizes.length === 0) return 'N/A';
        if (sizes.length === 1) return sizes[0].toString();
        
        const sorted = [...sizes].sort((a, b) => a - b);
        return `${sorted[0]}-${sorted[sorted.length - 1]}`;
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
      
      showToast('success', '✅ Carton Scanned!', `${newItem.articleName} - Carton ${newItem.cartonNumber}`);

    } catch (error) {      
      vibrate([500, 200, 500]);
      console.error('❌ Scan error:', error);
      showAlert('Scan Failed', 'Unable to process the scan. Please try again.', 'error');
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1000);
    }
  };

  const handleStartScanning = () => {
    if (!selectedDistributor) {
      showAlert('Warning', 'Please select a distributor first', 'warning');
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
      showAlert('Warning', 'Please scan at least one carton', 'warning');
      return;
    }

    if (!selectedDistributor) {
      showAlert('Warning', 'Please select a distributor', 'warning');
      return;
    }

    try {
      setLoading(true);
      vibrate([50, 50]);

      const selectedDist = distributors.find(d => d._id === selectedDistributor);
      const shipmentId = `SHIP_${Date.now()}_${selectedDistributor.slice(-6)}`;
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
      
      showAlert('success', 'Shipment Created!', `Shipment ID: ${shipmentResult.shipmentId}`);

      setScannedItems([]);
      setSelectedDistributor('');
      handleStopScanning();

    } catch (error) {
      vibrate([300]);
      showAlert('Error', 'Failed to create shipment. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const removeScannedItem = (uniqueId) => {
    vibrate([100]);
    setScannedItems(prev => prev.filter(item => item.uniqueId !== uniqueId));
  };

  const downloadShipmentReceipt = () => {
    if (!shipmentCreated) return;
    vibrate([50, 50]);
    showToast('success', 'Receipt Downloaded!', 'PDF receipt has been downloaded successfully');
  };

  const showAlert = (title, text, icon) => {
    // Mock alert - in real app, use SweetAlert2
    alert(`${icon.toUpperCase()}: ${title}\n${text}`);
  };

  const showToast = (icon, title, text) => {
    // Mock toast - in real app, use SweetAlert2 toast
    console.log(`${icon}: ${title} - ${text}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Package className="w-8 h-8" />
                Shipment Scanner
              </h1>
              <p className="text-gray-600 mt-2">Scan cartons for distributor shipment</p>
              {cameraPermission && (
                <div className="flex items-center mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
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
                onClick={() => showAlert('Logout', 'Logout functionality', 'info')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 font-medium flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
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
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-0 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                QR Scanner
              </h2>
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
                  className={`w-full px-4 py-3 rounded-lg transition duration-200 font-medium text-sm flex items-center justify-center gap-2 ${
                    !selectedDistributor
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                  {!selectedDistributor ? 'Select Distributor First' : 'Start Camera Scanner'}
                </button>
              ) : (
                <button
                  onClick={handleStopScanning}
                  className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition duration-200 font-medium text-sm flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Stop Scanner
                </button>
              )}
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[300px] sm:min-h-[400px] flex items-center justify-center bg-black">
              {isScanning ? (
                <div id="qr-scanner-container" className="w-full h-full"></div>
              ) : (
                <div className="text-center py-12">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-white" />
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
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 disabled:bg-green-400 text-sm flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {loading ? 'Creating...' : 'Create Shipment'}
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
              {scannedItems.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto mb-2 text-gray-400" />
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
                          <div><strong>Sizes:</strong> {item.sizesFormatted}</div>
                          <div><strong>Carton:</strong> #{item.cartonNumber}</div>
                          <div><strong>Scanned:</strong> {item.scannedAt}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {item.status}
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
                    <div><strong>Distributor:</strong> {distributors.find(d => d._id === selectedDistributor)?.distributorDetails?.partyName || 'Not selected'}</div>
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
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-blue-400 font-medium flex items-center gap-2 mx-auto"
              >
                <Download className="w-5 h-5" />
                {loading ? 'Generating PDF...' : 'Download Receipt'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipmentScanner;