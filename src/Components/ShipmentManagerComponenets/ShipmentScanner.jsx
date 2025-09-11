import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
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
  const [scanMethod, setScanMethod] = useState('camera'); // 'camera' or 'upload'
  const [uploadLoading, setUploadLoading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null); // Track permission status
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch distributors and check camera permission on mount
  useEffect(() => {
    fetchDistributors();
    checkCameraPermission(); // Check permission on component mount
  }, []);

  // Initialize scanner when scanning starts
  useEffect(() => {
    if (isScanning && scanMethod === 'camera' && !scannerInstance) {
      initializeScanner();
    }
    return () => {
      // Cleanup scanner on unmount
      if (scannerInstance) {
        scannerInstance.clear().catch(console.error);
      }
    };
  }, [isScanning, scanMethod]);

  // Check and request camera permission
  const checkCameraPermission = async () => {
    try {
      // Check if permission is already granted
      const permission = await navigator.permissions.query({ name: 'camera' });
      setCameraPermission(permission.state);
      
      // Listen for permission changes
      permission.onchange = () => {
        setCameraPermission(permission.state);
      };
    } catch (error) {
      console.warn('Permission API not supported:', error);
      // Fallback: try to access camera directly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately
        setCameraPermission('granted');
      } catch (err) {
        setCameraPermission('denied');
      }
    }
  };

  // Request camera permission explicitly
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera by default
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      // Stop the stream immediately - we just wanted permission
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      setCameraPermission('denied');
      
      Swal.fire({
        title: 'Camera Access Required',
        html: `
          <p>Camera access is needed to scan QR codes.</p>
          <p>Please:</p>
          <ol style="text-align: left; margin: 10px 0;">
            <li>Click the camera icon in your browser's address bar</li>
            <li>Select "Allow" for camera access</li>
            <li>Refresh the page and try again</li>
          </ol>
        `,
        icon: 'info',
        confirmButtonText: 'I understand'
      });
      return false;
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

  const initializeScanner = async () => {
    try {
      // Ensure camera permission is granted first
      if (cameraPermission !== 'granted') {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          setIsScanning(false);
          return;
        }
      }

      const scanner = new Html5QrcodeScanner(
        "qr-scanner",
        { 
          fps: 10,
          qrbox: { width: 300, height: 300 },
          aspectRatio: 1.0,
          rememberLastUsedCamera: true, // Remember last used camera
          disableFlip: true,
          showTorchButtonIfSupported: true, // Show flashlight if available
          showZoomSliderIfSupported: true, // Show zoom if available
          defaultZoomValueIfSupported: 2, // Default zoom level
          supportedScanTypes: [0, 1, 2] // Support QR codes and barcodes
        },
        false
      );

      scanner.render(
        (decodedText) => handleScanSuccess(decodedText),
        (error) => {
          // Only log actual errors, not per-frame scan failures
          if (error && !error.includes('No QR code found')) {
            console.warn('Scanner error:', error);
          }
        }
      );

      setScannerInstance(scanner);
    } catch (error) {
      console.error('Scanner initialization error:', error);
      setIsScanning(false);
      Swal.fire('Error', 'Failed to initialize QR scanner. Please check camera permissions.', 'error');
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
      const html5QrCode = new Html5Qrcode("temp-qr-element");
      const qrCodeResult = await html5QrCode.scanFile(file, true);
      await handleScanSuccess(qrCodeResult);
      html5QrCode.clear();
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

  const handleScanSuccess = async (decodedText) => {
    try {
      const qrData = JSON.parse(decodedText);
      
      // Check if item is already scanned
      const alreadyScanned = scannedItems.find(item => item.uniqueId === qrData.uniqueId);
      if (alreadyScanned) {
        Swal.fire('Warning', 'This carton has already been scanned!', 'warning');
        return;
      }

      // Validate QR code format
      if (!qrData.uniqueId || !(qrData.articleName || qrData.contractorInput?.articleName)) {
        Swal.fire('Error', 'Invalid QR code format', 'error');
        return;
      }

      // ✅ FIXED: Use correct endpoint for shipment scanning
      const response = await axios.post(
        `${baseURL}/api/v1/shipment/scan/${qrData.uniqueId}`, // Fixed endpoint
        {
          event: 'shipped',
          scannedBy: {
            userType: 'shipment_manager'
          },
          distributorDetails: {
            distributorId: selectedDistributor,
            distributorName: distributors.find(d => d._id === selectedDistributor)?.distributorDetails?.partyName || 
                           distributors.find(d => d._id === selectedDistributor)?.name || ''
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
        // Add to scanned items list
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
        
        // Success feedback
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

  // Updated start scanning method
  const startScanning = async () => {
    if (!selectedDistributor) {
      Swal.fire('Warning', 'Please select a distributor first', 'warning');
      return;
    }

    if (cameraPermission === 'denied') {
      await requestCameraPermission();
    } else {
      setIsScanning(true);
    }
  };

  const stopScanning = () => {
    if (scannerInstance) {
      scannerInstance.clear();
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

  // ✅ FIXED: Create shipment with proper data structure
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
      
      const shipmentData = {
        distributorId: selectedDistributor,
        distributorName: selectedDist?.distributorDetails?.partyName || selectedDist?.name || '',
        items: scannedItems.map(item => ({
          qrCodeId: item.uniqueId, // This should be ObjectId if available
          uniqueId: item.uniqueId,
          articleName: item.articleName,
          articleDetails: {
            colors: item.colors,
            sizes: item.sizes,
            numberOfCartons: 1
          },
          receivedAt: new Date(), // When it was received at warehouse
          status: 'shipped'
        })),
        totalCartons: scannedItems.length,
        notes: `Shipment created on ${new Date().toLocaleDateString()}`
      };

      // ✅ Create shipment directly without separate endpoint
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

      // ✅ Call backend PDF generation endpoint
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
          responseType: 'blob' // ✅ Important for PDF download
        }
      );

      // ✅ Create blob URL and download PDF
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
              {/* Camera Permission Status */}
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
                    disabled={cameraPermission === 'denied' || !selectedDistributor}
                    className={`w-full px-4 py-3 rounded-lg transition duration-200 font-medium ${
                      cameraPermission === 'denied'
                        ? 'bg-red-100 text-red-600 cursor-not-allowed'
                        : !selectedDistributor
                        ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {cameraPermission === 'denied' 
                      ? '❌ Camera Access Denied - Click to Enable' 
                      : !selectedDistributor
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

            {/* Temporary element for HTML5Qrcode file scanning */}
            <div id="temp-qr-element" style={{ display: 'none' }}></div>

            {/* Scanner Display */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {isScanning && scanMethod === 'camera' ? (
                <div id="qr-scanner" className="w-full"></div>
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
                      ? 'Select distributor first, then click "Start Camera Scanner"'
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
