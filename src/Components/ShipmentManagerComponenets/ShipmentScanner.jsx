import React, { useState, useEffect, useRef } from 'react';
import QrScanner from 'qr-scanner';
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
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDistributors();
  }, []);

  // ✅ Fixed useEffect - prevents unnecessary reinitializations
  useEffect(() => {
    if (isScanning && scanMethod === 'camera' && !scannerInstance && videoRef.current) {
      initializeScanner();
    }
    
    return () => {
      if (scannerInstance && !isScanning) {
        scannerInstance.stop();
        scannerInstance.destroy();
        setScannerInstance(null);
      }
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

  const initializeScanner = async () => {
    try {
      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      const scanner = new QrScanner(
        videoRef.current,
        // ✅ Pass function reference directly
        handleScanSuccess,
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
          maxScansPerSecond: 5,
        }
      );

      await scanner.start();
      setScannerInstance(scanner);
      setCameraPermission('granted');
    } catch (error) {
      console.error('Scanner initialization error:', error);
      setIsScanning(false);
      setCameraPermission('denied');
      
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

  // ✅ Fixed handleScanSuccess - stable function reference
  const handleScanSuccess = async (decodedText) => {
    try {
      let qrData;
      try {
        qrData = JSON.parse(decodedText);
      } catch {
        Swal.fire('Error', 'Invalid QR code content (not JSON)', 'error');
        return;
      }

      // ✅ Use setState callback to check for duplicates
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

      if (!shouldProceed) return;

      // Validate QR code format
      if (!qrData.uniqueId || !(qrData.articleName || qrData.contractorInput?.articleName)) {
        Swal.fire('Error', 'Invalid QR code format', 'error');
        return;
      }

      // ✅ Get current distributor info when needed
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
        const newItem = {
          uniqueId: qrData.uniqueId,
          articleName: qrData.articleName || qrData.contractorInput?.articleName,
          colors: qrData.contractorInput?.colors || qrData.colors,
          sizes: qrData.contractorInput?.sizes || qrData.sizes,
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
          showConfirmButton: false
        });
      } else {
        throw new Error(response.data.message);
      }

    } catch (error) {
      let errorMessage = 'Failed to process scan';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Swal.fire('Error', errorMessage, 'error');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!selectedDistributor) {
      Swal.fire('Warning', 'Please select a distributor first', 'warning');
      event.target.value = '';
      return;
    }

    setUploadLoading(true);

    try {
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true,
      });
      await handleScanSuccess(result.data);
    } catch (error) {
      let errorMessage = 'Failed to scan QR code from image';
      if (error.message.includes('No QR code found')) {
        errorMessage = 'No QR code found in the uploaded image. Please try another image.';
      } else if (error.message.includes('Unable to decode')) {
        errorMessage = 'Unable to decode QR code. Please ensure the image is clear and contains a valid QR code.';
      }
      
      Swal.fire('Error', errorMessage, 'error');
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
    if (scannerInstance) {
      scannerInstance.stop();
      scannerInstance.destroy();
      setScannerInstance(null);
    }
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

      // Reset form
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">📦 Shipment Scanner</h1>
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
            <div className="text-right">
              <div className="text-sm text-gray-500">Scanned Items</div>
              <div className="text-2xl font-bold text-blue-600">{scannedItems.length}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Scanner */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">🎯 QR Scanner</h2>
            
            {/* Distributor Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Select Distributor <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDistributor}
                onChange={(e) => setSelectedDistributor(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

            {/* Scan Method Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Scan Method
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleScanMethodChange('camera')}
                  className={`flex-1 px-4 py-2 rounded-lg border transition duration-200 ${
                    scanMethod === 'camera' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  📱 Camera
                </button>
                <button
                  onClick={() => handleScanMethodChange('upload')}
                  className={`flex-1 px-4 py-2 rounded-lg border transition duration-200 ${
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
                    className={`w-full px-4 py-3 rounded-lg transition duration-200 font-medium ${
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
                    className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition duration-200 font-medium"
                  >
                    ⏹️ Stop Scanner
                  </button>
                )
              ) : (
                <button
                  onClick={triggerFileUpload}
                  disabled={uploadLoading}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition duration-200 font-medium disabled:bg-green-400"
                >
                  {uploadLoading ? '⏳ Processing...' : '📁 Upload QR Image'}
                </button>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Scanner Display */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
              {isScanning && scanMethod === 'camera' ? (
                <video
                  ref={videoRef}
                  className="w-full h-full max-w-sm max-h-80 object-cover rounded-lg"
                  style={{ transform: 'scaleX(-1)' }} // Mirror video for better UX
                />
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">
                    {scanMethod === 'camera' ? '📷' : '📁'}
                  </div>
                  <p className="text-gray-500">
                    {scanMethod === 'camera' 
                      ? 'Scanner will appear here when started'
                      : 'Click "Upload QR Image" to scan from file'
                    }
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    {scanMethod === 'camera' 
                      ? 'Select distributor first, then click "Start Camera Scanner" - camera permission will be requested'
                      : 'Supports JPG, PNG, and other image formats'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="text-sm text-blue-700">
                <strong>Instructions:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Select the destination distributor</li>
                  <li>Choose scan method: Camera or Upload</li>
                  <li>
                    {scanMethod === 'camera' 
                      ? 'Start scanner and point at QR codes - camera will open automatically'
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
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">📋 Scanned Items</h2>
              {scannedItems.length > 0 && (
                <button
                  onClick={createShipment}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 disabled:bg-green-400"
                >
                  {loading ? '⏳ Creating...' : '✅ Create Shipment'}
                </button>
              )}
            </div>

            {/* Scanned Items List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {scannedItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📦</div>
                  <p className="text-gray-500">No items scanned yet</p>
                  <p className="text-sm text-gray-400">Start scanning to add items here</p>
                </div>
              ) : (
                scannedItems.map((item, index) => (
                  <div key={item.uniqueId} className="bg-gray-50 border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">
                          {item.articleName}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><strong>Colors:</strong> {Array.isArray(item.colors) ? item.colors.join(', ') : item.colors}</div>
                          <div><strong>Sizes:</strong> {Array.isArray(item.sizes) ? item.sizes.join(', ') : item.sizes}</div>
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
                  <div className="text-sm">
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
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Shipment Created Successfully!</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="text-left space-y-2">
                  <div><strong>Shipment ID:</strong> {shipmentCreated.shipmentId}</div>
                  <div><strong>Distributor:</strong> {shipmentCreated.distributorName}</div>
                  <div><strong>Total Cartons:</strong> {shipmentCreated.totalCartons}</div>
                  <div><strong>Created:</strong> {new Date(shipmentCreated.shippedAt).toLocaleString()}</div>
                </div>
              </div>
              <button
                onClick={downloadShipmentReceipt}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200"
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
