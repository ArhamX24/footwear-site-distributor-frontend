import { useState, useRef, useEffect, useMemo } from 'react';
import QrScanner from 'qr-scanner';
import Swal from 'sweetalert2';
import axios from 'axios';
import { baseURL } from '../../Utils/URLS';

const QrWarehouseScanner = ({ onScanSuccess, currentUser = null }) => {
  const [scanResult, setScanResult] = useState('');
  const [operationMode, setOperationMode] = useState('manufactured'); // Default mode
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
      label: 'Warehouse Receipt', 
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

  const triggerVibration = (pattern = [200]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const vibrationPatterns = {
    success: [200, 100, 200],
    error: [100, 50, 100, 50, 100],
    scan: [150]
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
      shipped: 'warehouse' // Warehouse ships to distributor
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
      
      // Prepare request data that matches your controller expectations
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

      const response = await axios.post(
        `${baseURL}/api/v1/admin/qr/scan/${uniqueId}`,
        requestData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const json = response.data;
      
      if (json.result) {
        triggerVibration(vibrationPatterns.success);
        
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
        
        // Auto-restart scanner after successful scan
        setTimeout(() => {
          setScanResult('');
          setScannedQRInfo(null);
          if (!cameraActive) {
            startScanner();
          }
        }, 1500);
        
      } else {
        triggerVibration(vibrationPatterns.error);
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
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md mt-8">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">QR Scanner</h2>
        <p className="text-sm text-gray-600">Select operation mode and scan</p>
      </div>

      {/* Operation Mode Selection */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">Select Operation Mode:</h3>
        <div className="grid grid-cols-1 gap-2">
          {operationModes.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => setOperationMode(mode.value)}
              className={`p-3 rounded-lg text-sm font-medium transition-all ${
                operationMode === mode.value 
                  ? `${mode.color} text-white shadow-lg` 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={mode.description}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${
                  operationMode === mode.value ? 'bg-white' : 'bg-gray-400'
                }`}></span>
                <span>{mode.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Mode Indicator */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg text-center">
        <p className="text-sm text-gray-600">Current Mode:</p>
        <p className={`font-medium text-white px-3 py-1 rounded inline-block mt-1 ${currentMode?.color || 'bg-gray-500'}`}>
          {currentMode?.label || 'Unknown'}
        </p>
      </div>

      {/* Lifecycle Progress Indicator */}
      {currentStage && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-500">Product Stage:</span>
            <span className={`px-2 py-1 rounded text-white ${currentStage.color}`}>
              {currentStage.label}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${currentStage.color}`}
              style={{ width: `${(currentStage.step / 4) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Scanner Status and Controls */}
      <div className="mb-4 text-center">
        {isInitializing ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            <span className="text-sm text-gray-600">Starting camera...</span>
          </div>
        ) : cameraActive ? (
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Scanner Active</span>
            </div>
            <button
              onClick={stopScanner}
              className="bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700 transition"
            >
              Stop
            </button>
          </div>
        ) : (
          <button
            onClick={startScanner}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
          >
            Restart Scanner
          </button>
        )}
      </div>

      {/* Video Element */}
      <div className="mb-4 relative">
        <video
          ref={videoRef}
          className={`w-full rounded-lg border-2 transition-all duration-300 ${
            cameraActive ? 'border-green-300' : 'border-gray-300'
          }`}
          style={{ 
            maxHeight: '300px',
            display: isInitializing || cameraActive ? 'block' : 'none'
          }}
        />
        {!cameraActive && !isInitializing && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg border-2 border-gray-300">
            <p className="text-gray-500 text-sm">Camera Stopped</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-semibold text-sm text-center">{error}</p>
          <button
            onClick={startScanner}
            className="mt-2 w-full bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700 transition"
          >
            Retry Camera Access
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        {/* Product Information Display */}
        <div className="border border-gray-300 rounded px-3 py-2 bg-gray-50">
          <p className="text-sm text-gray-600 mb-1">Scanned Product:</p>
          <p className="font-medium">
            {parsedResult ? parsedResult.productName || 'Unknown Product' : "Waiting for QR scan..."}
          </p>
          {parsedResult && (
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <p>Segment: {parsedResult.segment || 'N/A'}</p>
              <p>Batch: {parsedResult.serialNumber || 'N/A'}/{parsedResult.totalCount || 'N/A'}</p>
              <p>Generated: {parsedResult.generatedAt ? new Date(parsedResult.generatedAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          )}
        </div>
        
        <button
          type="submit"
          className={`${currentMode?.color || 'bg-black'} text-white px-4 py-2 rounded hover:opacity-90 transition disabled:bg-gray-400 disabled:cursor-not-allowed`}
          disabled={!scanResult || loading}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing...</span>
            </div>
          ) : (
            `Mark as ${currentMode?.label || 'Processed'}`
          )}
        </button>
      </form>
    </div>
  );
};

export default QrWarehouseScanner;
