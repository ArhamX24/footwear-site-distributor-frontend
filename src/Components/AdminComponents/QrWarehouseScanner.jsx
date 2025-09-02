import { useState, useRef, useEffect, useMemo } from 'react';
import QrScanner from 'qr-scanner';
import Swal from 'sweetalert2';
import axios from 'axios';
import { baseURL } from '../../Utils/URLS';

const QrWarehouseScanner = ({ onScanSuccess, currentUser = null }) => {
  const [scanResult, setScanResult] = useState('');
  const [operationMode, setOperationMode] = useState('manufactured');
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [scannedQRInfo, setScannedQRInfo] = useState(null);
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  // Available operation modes
  const operationModes = [
    { 
      value: 'manufactured', 
      label: 'Manufacturing', 
      color: 'bg-blue-600', 
      description: 'Mark products as manufactured',
      event: 'manufactured'
    },
    { 
      value: 'received', 
      label: 'Received At Warehouse', 
      color: 'bg-green-600', 
      description: 'Receive products at warehouse',
      event: 'received'
    },
    { 
      value: 'shipped', 
      label: 'Distributor Shipment', 
      color: 'bg-purple-600', 
      description: 'Ship to distributor',
      event: 'shipped'
    }
  ];

  const currentMode = operationModes.find(mode => mode.value === operationMode);

  const parsedResult = useMemo(() => {
    try {
      const parsed = JSON.parse(scanResult);
      setScannedQRInfo(parsed);
      return parsed;
    } catch {
      setScannedQRInfo(null);
      return null;
    }
  }, [scanResult]);

  // Enhanced vibration function with multiple patterns
  const triggerVibration = (pattern = [200]) => {
    if ('vibrate' in navigator) {
      // Stop any existing vibrations first
      navigator.vibrate(0);
      // Start new vibration pattern
      setTimeout(() => {
        navigator.vibrate(pattern);
      }, 50);
    }
  };

  const vibrationPatterns = {
    success: [200, 100, 200, 100, 300], // Long success pattern
    error: [100, 50, 100, 50, 100, 50, 100], // Short error bursts
    scan: [150] // Single vibration when QR is detected
  };

  const startScanner = async () => {
    try {
      setIsInitializing(true);
      if (videoRef.current && !qrScannerRef.current) {
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            triggerVibration(vibrationPatterns.scan);
            setScanResult(result.data);
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 10,
          }
        );
        
        await qrScannerRef.current.start();
        setCameraActive(true);
        setError('');
      }
    } catch (err) {
      setError('Camera access denied or not available');
      console.error(err);
    } finally {
      setIsInitializing(false);
    }
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, []);

  const getEventMessages = (mode) => {
    const messages = {
      manufactured: {
        success: "Manufacturing Complete!",
        detail: "Product marked as manufactured and ready for warehouse.",
        icon: "success"
      },
      received: {
        success: "Received at Warehouse!",
        detail: "Product successfully added to warehouse inventory.",
        icon: "success"
      },
      shipped: {
        success: "Shipped to Distributor!",
        detail: "Product marked as shipped and removed from warehouse inventory.",
        icon: "success"
      }
    };
    return messages[mode] || { success: "Success!", detail: "Operation completed.", icon: "success" };
  };

  const getUserTypeFromMode = (mode) => {
    const modeToUserType = {
      manufactured: 'manufacturing',
      received: 'warehouse',
      shipped: 'warehouse'
    };
    return modeToUserType[mode] || 'admin';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!scanResult) return;

    setLoading(true);
    try {
      const uniqueId = parsedResult ? parsedResult.uniqueId : scanResult.trim();
      const userType = getUserTypeFromMode(operationMode);
      
      console.log('Submitting QR scan:', { uniqueId, operationMode, userType }); // Debug log
      
      const requestData = {
        scannedBy: {
          userId: currentUser?.id || 'admin',
          userType: userType,
          name: currentUser?.name || `Admin (${currentMode?.label})`
        },
        location: {
          address: `${currentMode?.label} Facility`,
          coordinates: {
            latitude: null,
            longitude: null
          }
        },
        event: currentMode?.event || operationMode,
        userAgent: navigator.userAgent,
        ipAddress: null,
        notes: `Scanned via ${currentMode?.label} mode`,
        qualityCheck: operationMode === 'manufactured' ? { 
          passed: true, 
          checkedBy: currentUser?.name || 'Admin',
          notes: 'Standard quality check passed' 
        } : undefined,
        distributorDetails: operationMode === 'shipped' ? {
          distributorId: null,
          distributorName: 'Default Distributor'
        } : undefined,
        trackingNumber: operationMode === 'shipped' ? `TRK-${Date.now()}` : undefined
      };

      console.log('Request data:', requestData); // Debug log

      const response = await axios.post(
        `${baseURL}/api/v1/admin/qr/scan/${uniqueId}`,
        requestData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const json = response.data;
      console.log('Response:', json); // Debug log
      
      if (json.result) {
        // Strong success vibration
        triggerVibration(vibrationPatterns.success);
        
        // Stop scanner immediately on success
        stopScanner();
        
        const eventMessage = getEventMessages(operationMode);
        await Swal.fire({
          title: eventMessage.success,
          text: eventMessage.detail,
          icon: eventMessage.icon,
          timer: 3000,
          showConfirmButton: true,
          confirmButtonColor: '#10B981'
        });

        setError('');
        
        if (onScanSuccess) {
          onScanSuccess({
            qrData: parsedResult,
            event: operationMode,
            result: json
          });
        }
        
        // Clear scan result and reset
        setScanResult('');
        setScannedQRInfo(null);
        
      } else {
        triggerVibration(vibrationPatterns.error);
        console.error('Scan failed:', json.message);
        await Swal.fire({
          title: "Scan Failed",
          text: json.message || "Unknown error occurred.",
          icon: "error",
          confirmButtonColor: '#EF4444'
        });
        setError(json.message || 'Unknown error.');
      }
    } catch (err) {
      triggerVibration(vibrationPatterns.error);
      const errorMessage = err.response?.data?.message || err.message || "Network or server error.";
      console.error('Error during scan submission:', err);
      setError(errorMessage);
      await Swal.fire({
        title: "Error",
        text: errorMessage,
        icon: "error",
        confirmButtonColor: '#EF4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const getLifecycleStage = () => {
    if (!parsedResult?.lifecycle) return null;
    
    const stage = parsedResult.lifecycle.stage;
    const stages = {
      generated: { label: 'Generated', color: 'bg-gray-500', step: 1 },
      manufactured: { label: 'Manufactured', color: 'bg-blue-500', step: 2 },
      received: { label: 'In Warehouse', color: 'bg-green-500', step: 3 },
      shipped: { label: 'Shipped', color: 'bg-purple-500', step: 4 }
    };
    
    return stages[stage] || null;
  };

  const currentStage = getLifecycleStage();

  return (
    <div className="h-4/5 bg-gray-50 pb-safe overflow-y-scroll">
      <div className="w-full max-w-sm mx-auto p-4 bg-white min-h-full">
        {/* Header */}
        <div className="text-center mb-4 pt-2">
          <h2 className="text-lg font-bold">QR Scanner</h2>
          <p className="text-xs text-gray-600">Select mode and scan</p>
        </div>

        {/* Operation Mode Selection */}
        <div className="mb-4">
          <h3 className="text-xs font-medium text-gray-700 mb-2 text-center">Operation Mode:</h3>
          <div className="grid grid-cols-1 gap-1">
            {operationModes.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => setOperationMode(mode.value)}
                className={`p-2 rounded text-xs font-medium transition-all ${
                  operationMode === mode.value 
                    ? `${mode.color} text-white shadow-md` 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={mode.description}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    operationMode === mode.value ? 'bg-white' : 'bg-gray-400'
                  }`}></span>
                  <span>{mode.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Mode Indicator */}
        <div className="mb-3 p-2 bg-gray-50 rounded text-center">
          <p className="text-xs text-gray-600">Current:</p>
          <p className={`font-medium text-white px-2 py-1 rounded inline-block mt-1 text-xs ${currentMode?.color || 'bg-gray-500'}`}>
            {currentMode?.label || 'Unknown'}
          </p>
        </div>

        {/* Lifecycle Progress Indicator */}
        {currentStage && (
          <div className="mb-3 p-2 bg-gray-50 rounded">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">Stage:</span>
              <span className={`px-1.5 py-0.5 rounded text-white text-xs ${currentStage.color}`}>
                {currentStage.label}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${currentStage.color}`}
                style={{ width: `${(currentStage.step / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Scanner Controls */}
        <div className="mb-3 text-center">
          {isInitializing ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600"></div>
              <span className="text-xs text-gray-600">Starting...</span>
            </div>
          ) : cameraActive ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">Active</span>
              </div>
              <button
                onClick={stopScanner}
                className="bg-red-600 text-white px-2 py-1 text-xs rounded hover:bg-red-700 transition"
              >
                Stop
              </button>
            </div>
          ) : (
            <button
              onClick={startScanner}
              className="bg-indigo-600 text-white px-3 py-1.5 text-xs rounded hover:bg-indigo-700 transition"
            >
              Start Camera
            </button>
          )}
        </div>

        {/* Video Element */}
        <div className="mb-3 relative">
          <video
            ref={videoRef}
            className={`w-full rounded border-2 transition-all duration-300 ${
              cameraActive ? 'border-green-300' : 'border-gray-300'
            }`}
            style={{ 
              height: '200px',
              display: isInitializing || cameraActive ? 'block' : 'none'
            }}
          />
          {!cameraActive && !isInitializing && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded border-2 border-gray-300 h-50">
              <p className="text-gray-500 text-xs">Camera Stopped</p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600 font-semibold text-xs text-center">{error}</p>
            <button
              onClick={startScanner}
              className="mt-1 w-full bg-red-600 text-white px-2 py-1 text-xs rounded hover:bg-red-700 transition"
            >
              Retry Camera
            </button>
          </div>
        )}
        
        {/* Scan Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Product Information */}
          <div className="border border-gray-300 rounded p-2 bg-gray-50">
            <p className="text-xs text-gray-600 mb-1">Scanned Product:</p>
            <p className="font-medium text-sm">
              {parsedResult ? parsedResult.productName || 'Unknown Product' : "Waiting for scan..."}
            </p>
            {parsedResult && (
              <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                <p>Segment: {parsedResult.segment || 'N/A'}</p>
                <p>Batch: {parsedResult.serialNumber || 'N/A'}/{parsedResult.totalCount || 'N/A'}</p>
                <p>Generated: {parsedResult.generatedAt ? new Date(parsedResult.generatedAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            )}
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            className={`${currentMode?.color || 'bg-black'} text-white px-4 py-2.5 rounded w-full hover:opacity-90 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium`}
            disabled={!scanResult || loading}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                <span>Processing...</span>
              </div>
            ) : (
              `Mark as ${currentMode?.label || 'Processed'}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QrWarehouseScanner;
