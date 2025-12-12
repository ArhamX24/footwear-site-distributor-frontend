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
  const [manualId, setManualId] = useState(''); // ✅ Manual ID input
  const qrReaderRef = useRef(null);
  const isProcessingRef = useRef(false);


  useEffect(() => {
    fetchDistributors();
    initializeCamera();
    
    return () => {
      forceCleanup();
    };
  }, []);


  useEffect(() => {
    if (isScanning) {
      startScanning();
    } else {
      stopScanning();
    }
  }, [isScanning]);


  // ✅ FIXED: Force cleanup
  const forceCleanup = async () => {
    try {
      if (qrReaderRef.current) {
        const state = qrReaderRef.current.getState();
        if (state === 2) { // Html5QrcodeScannerState.SCANNING
          await qrReaderRef.current.stop();
        }
        await qrReaderRef.current.clear();
      }
    } catch (error) {
      console.log('Cleanup error:', error);
    } finally {
      qrReaderRef.current = null;
      const container = document.getElementById("qr-scanner-container");
      if (container) {
        container.innerHTML = '';
        container.removeAttribute('style');
      }
      isProcessingRef.current = false;
    }
  };


  // ✅ FIXED: Vibrate function with better support detection
  const vibrate = (pattern = [100]) => {
    try {
      if ('vibrate' in navigator && navigator.vibrate) {
        navigator.vibrate(pattern);
        console.log('✅ Vibration triggered:', pattern);
      } else {
        console.log('⚠️ Vibration API not supported');
      }
    } catch (error) {
      console.log('❌ Vibration error:', error);
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


  const startScanning = async () => {
    try {
      await forceCleanup();
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const qrReader = new Html5Qrcode("qr-scanner-container");
      qrReaderRef.current = qrReader;
      
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


      await qrReader.start(
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
          // Suppress common errors
        }
      );
      
      setCameraPermission('granted');
      
    } catch (error) {
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


  // ✅ FIXED: Stop scanner properly [web:109][web:110][web:116]
  const stopScanning = async () => {
    try {
      if (qrReaderRef.current) {
        const state = qrReaderRef.current.getState();
        if (state === 2) { // SCANNING state
          await qrReaderRef.current.stop();
          console.log('✅ Scanner stopped');
        }
        await qrReaderRef.current.clear();
        console.log('✅ Scanner cleared');
        qrReaderRef.current = null;
      }
    } catch (error) {
      console.error('❌ Stop error:', error);
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
    console.log('🔍 Scan detected:', decodedText);
    
    try {
      let qrData;
      
      // Parse JSON
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
                <p>This QR code doesn't contain the expected shipment data format.</p>
                <p><strong>Content found:</strong></p>
                <code style="background: #f5f5f5; padding: 8px; border-radius: 4px; display: block; margin: 8px 0; word-break: break-all;">${decodedText}</code>
              `,
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
        Swal.fire('Error', `Invalid QR format: ${jsonError.message}`, 'error');
        isProcessingRef.current = false;
        return;
      }


      // Validate structure
      if (!qrData || typeof qrData !== 'object') {
        vibrate([300, 100, 300]);
        Swal.fire({
          title: 'Invalid QR Data',
          html: `
            <p>QR code does not contain valid data structure.</p>
            <details style="text-align: left; margin-top: 10px;">
              <summary style="cursor: pointer;">Show raw data</summary>
              <pre style="background: #f5f5f5; padding: 8px; margin-top: 8px; border-radius: 4px; overflow: auto; max-height: 200px;">${JSON.stringify(qrData, null, 2)}</pre>
            </details>
          `,
          icon: 'error',
          confirmButtonText: 'OK'
        });
        isProcessingRef.current = false;
        return;
      }


      // Extract fields
      const uniqueId = qrData.uniqueId || null;
      const articleName = qrData.articleName 
        || qrData.contractorInput?.articleName 
        || qrData.productReference?.articleName 
        || null;


      // Check duplicates
      const shouldProceed = await new Promise((resolve) => {
        setScannedItems((currentItems) => {
          const alreadyScanned = currentItems.find(item => item.uniqueId === uniqueId);
          if (alreadyScanned) {
            vibrate([100, 50, 100, 50, 100]);
            Swal.fire('Warning', 'This carton has already been scanned!', 'warning');
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


      // Validate required fields
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
            <details style="text-align: left; margin-top: 10px;">
              <summary style="cursor: pointer;">Show QR data structure</summary>
              <pre style="background: #f5f5f5; padding: 8px; margin-top: 8px; border-radius: 4px; overflow: auto; max-height: 200px; font-size: 11px;">${JSON.stringify(qrData, null, 2)}</pre>
            </details>
          `,
          icon: 'error',
          confirmButtonText: 'OK'
        });
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
        Swal.fire('Warning', 'Please select a distributor first', 'warning');
        isProcessingRef.current = false;
        return;
      }


      // Send to backend
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
        
        // ✅ FIXED: Auto-close scanner after successful scan [web:109][web:110]
        console.log('🎯 Stopping scanner after successful scan...');
        setTimeout(async () => {
          await stopScanning();
          setIsScanning(false);
          console.log('✅ Scanner stopped automatically');
        }, 1500);
        
      } else {
        throw new Error(response.data.message || 'Server returned failure');
      }


    } catch (error) {      
      vibrate([500, 200, 500]);
      
      let errorMessage = 'Failed to process scan';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('❌ Scan error:', error);
      
      Swal.fire({
        title: 'Scan Error',
        html: `
          <p>${errorMessage}</p>
          <details style="text-align: left; margin-top: 10px; font-size: 12px;">
            <summary style="cursor: pointer; color: #666;">Show technical details</summary>
            <pre style="background: #f5f5f5; padding: 8px; margin-top: 8px; border-radius: 4px; overflow: auto; max-height: 150px;">${error.stack || error.message}</pre>
          </details>
        `,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      // Reset processing flag
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1000);
    }
  };


// ✅ FIXED: Manual ID upload that actually scans/uploads to backend
const handleManualUpload = async () => {
  if (!manualId.trim()) {
    Swal.fire('Warning', 'Please enter a unique ID or QR data', 'warning');
    return;
  }

  if (!selectedDistributor) {
    Swal.fire('Warning', 'Please select a distributor first', 'warning');
    return;
  }

  try {
    vibrate([100, 50, 100]);
    setLoading(true);

    const trimmedId = manualId.trim();
    let uniqueIdToUpload;
    let articleNameToDisplay = 'Manual Upload';

    // ✅ Parse the input
    try {
      if (trimmedId.startsWith('{') || trimmedId.startsWith('[')) {
        // It's JSON - parse it
        const parsedData = JSON.parse(trimmedId);
        uniqueIdToUpload = parsedData.uniqueId || parsedData.contractorInput?.uniqueId || trimmedId;
        articleNameToDisplay = parsedData.articleName || 
                               parsedData.contractorInput?.articleName || 
                               'Manual Upload';
        console.log('📋 Parsed JSON - UniqueID:', uniqueIdToUpload);
      } else {
        // Plain unique ID
        uniqueIdToUpload = trimmedId;
        console.log('🔑 Plain UniqueID:', uniqueIdToUpload);
      }
    } catch (parseError) {
      // If parsing fails, use as plain unique ID
      uniqueIdToUpload = trimmedId;
      console.log('⚠️ Parse failed, using as plain ID:', uniqueIdToUpload);
    }

    // ✅ Check for duplicates
    const isDuplicate = scannedItems.find(item => item.uniqueId === uniqueIdToUpload);
    if (isDuplicate) {
      vibrate([100, 50, 100, 50, 100]);
      Swal.fire('Warning', 'This carton has already been scanned!', 'warning');
      setLoading(false);
      return;
    }

    // ✅ Get current distributor details
    const selectedDist = distributors.find(d => d._id === selectedDistributor);

    // ✅ Send to backend - SAME AS QR SCAN
    console.log('🚀 Uploading to backend:', uniqueIdToUpload);
    
    const response = await axios.post(
      `${baseURL}/api/v1/shipment/scan/${uniqueIdToUpload}`,
      {
        event: 'shipped',
        scannedBy: {
          userType: 'shipment_manager'
        },
        distributorDetails: {
          distributorId: selectedDistributor,
          distributorName: selectedDist?.distributorDetails?.partyName || 
                         selectedDist?.name || ''
        },
        trackingNumber: `TRACK_${Date.now()}`,
        notes: 'Manual upload for debugging/testing'
      },
      {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (response.data.result) {
      console.log('✅ Backend response:', response.data);

      // ✅ Parse the original input again to get all details
      let qrData;
      try {
        if (trimmedId.startsWith('{') || trimmedId.startsWith('[')) {
          qrData = JSON.parse(trimmedId);
        } else {
          qrData = {
            uniqueId: uniqueIdToUpload,
            articleName: 'Manual Upload',
            contractorInput: {
              colors: ['Unknown'],
              sizes: [],
              cartonNumber: 'Manual'
            }
          };
        }
      } catch {
        qrData = {
          uniqueId: uniqueIdToUpload,
          articleName: 'Manual Upload',
          contractorInput: {
            colors: ['Unknown'],
            sizes: [],
            cartonNumber: 'Manual'
          }
        };
      }

      // ✅ Format size range helper
      const formatSizeRange = (sizes) => {
        if (!sizes) return 'N/A';
        if (!Array.isArray(sizes)) return sizes.toString();
        if (sizes.length === 0) return 'N/A';
        if (sizes.length === 1) return sizes[0].toString();
        
        const sorted = [...sizes].sort((a, b) => a - b);
        return `${sorted[0]}X${sorted[sorted.length - 1]}`;
      };

      const colors = qrData.contractorInput?.colors || qrData.colors || ['Unknown'];
      const sizes = qrData.contractorInput?.sizes || qrData.sizes || [];
      const cartonNumber = qrData.contractorInput?.cartonNumber || qrData.cartonNumber || 'Manual';

      // ✅ Add to scanned items
      const newItem = {
        uniqueId: uniqueIdToUpload,
        articleName: qrData.articleName || qrData.contractorInput?.articleName || 'Manual Upload',
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
        title: '✅ Manual Upload Success!',
        text: `${newItem.articleName} - Carton ${newItem.cartonNumber}`,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });

      // Clear input
      setManualId('');

    } else {
      throw new Error(response.data.message || 'Backend returned failure');
    }

  } catch (error) {
    vibrate([500, 200, 500]);
    console.error('❌ Manual upload error:', error);

    let errorMessage = 'Failed to upload to backend';
    
    if (error.response?.status === 404) {
      errorMessage = `Carton with ID "${manualId.trim()}" not found in database. Make sure this ID exists.`;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    Swal.fire({
      title: 'Upload Error',
      html: `
        <p>${errorMessage}</p>
        <p class="text-sm text-gray-600 mt-2">Unique ID: <code class="bg-gray-100 px-2 py-1 rounded">${manualId.trim()}</code></p>
        <details style="text-align: left; margin-top: 10px; font-size: 12px;">
          <summary style="cursor: pointer; color: #666;">Show technical details</summary>
          <pre style="background: #f5f5f5; padding: 8px; margin-top: 8px; border-radius: 4px; overflow: auto; max-height: 150px;">${JSON.stringify({
            error: error.message,
            response: error.response?.data,
            status: error.response?.status
          }, null, 2)}</pre>
        </details>
      `,
      icon: 'error',
      confirmButtonText: 'OK'
    });
  } finally {
    setLoading(false);
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

    console.log('📄 Sending items to PDF:', shipmentCreated.items);

    const response = await axios.post(
      `${baseURL}/api/v1/shipment/receipt/generate`,
      {
        shipmentId: shipmentCreated.shipmentId,
        distributorName: shipmentCreated.distributorName,
        distributorPhoneNo: shipmentCreated.distributorPhoneNo,
        totalCartons: shipmentCreated.totalCartons,
        shippedAt: shipmentCreated.shippedAt,
        items: shipmentCreated.items  // ✅ This contains colors, sizes, cartonNumber
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


{/* ✅ UPDATED: Manual ID Upload for Testing */}
<div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-4">
  <div className="flex items-center mb-2">
    <label className="block text-sm font-bold text-purple-900">
      🧪 Manual Upload (Backend Testing)
    </label>
    <span className="ml-2 bg-purple-200 text-purple-800 text-xs px-2 py-0.5 rounded-full">
      Debug Mode
    </span>
  </div>
  
  <div className="flex gap-2">
    <textarea
      value={manualId}
      onChange={(e) => setManualId(e.target.value)}
      placeholder="Enter Unique ID or paste full QR JSON data here..."
      className="flex-1 border-2 border-purple-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm font-mono resize-y min-h-[70px] bg-white"
      disabled={isScanning || loading}
      rows="3"
    />
    <button
      onClick={handleManualUpload}
      disabled={!selectedDistributor || isScanning || loading || !manualId.trim()}
      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-sm font-bold whitespace-nowrap self-start shadow-md"
    >
      {loading ? (
        <span>⏳ Uploading...</span>
      ) : (
        <span>🚀 Upload to Backend</span>
      )}
    </button>
  </div>
  
  <div className="mt-3 space-y-2 bg-white bg-opacity-50 rounded p-2">
    <div className="flex items-start gap-2">
      <span className="text-green-600 font-bold">✅</span>
      <p className="text-xs text-gray-700">
        <strong>Plain ID:</strong> Just paste unique ID (e.g., <code className="bg-purple-100 px-1 rounded">CARTON_12345</code>)
      </p>
    </div>
    <div className="flex items-start gap-2">
      <span className="text-green-600 font-bold">✅</span>
      <p className="text-xs text-gray-700">
        <strong>Full JSON:</strong> Paste complete QR data with all details
      </p>
    </div>
    <div className="flex items-start gap-2">
      <span className="text-blue-600 font-bold">📡</span>
      <p className="text-xs text-blue-700 font-medium">
        Sends actual POST request to backend API (same as QR scan)
      </p>
    </div>
    
    <details className="text-xs text-purple-800 mt-2">
      <summary className="cursor-pointer font-bold hover:text-purple-600">
        📘 Click for JSON Example
      </summary>
      <pre className="bg-white border border-purple-200 p-2 rounded mt-1 overflow-x-auto text-[10px] leading-relaxed">{`{
  "uniqueId": "CARTON_ABC123",
  "articleName": "Nike Air Max Pro",
  "contractorInput": {
    "articleName": "Nike Air Max Pro",
    "colors": ["Black", "White", "Red"],
    "sizes": [7, 8, 9, 10, 11],
    "cartonNumber": "001"
  }
}`}</pre>
      <p className="text-xs text-gray-600 mt-1 italic">
        💡 Copy this example, modify the uniqueId, and paste above
      </p>
    </details>
  </div>
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
                  <li>Use manual ID upload for debugging</li>
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
