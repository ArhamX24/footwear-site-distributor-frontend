import { useState, useRef, useEffect, useMemo } from 'react';
import QrScanner from 'qr-scanner';
import Swal from 'sweetalert2';
import axios from 'axios';
import { baseURL } from '../../Utils/URLS';

const QrWarehouseScanner = ({ onScanSuccess }) => {
  const [scanResult, setScanResult] = useState('');
  const [event, setEvent] = useState('received');
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  const parsedResult = useMemo(() => {
    try {
      return JSON.parse(scanResult);
    } catch {
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

  // Auto-start scanner when component mounts
  useEffect(() => {
    // Small delay to ensure video element is ready
    const timer = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, []); // Empty dependency array means this runs once on mount

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!scanResult) return;

    setLoading(true);
    try {
      const uniqueId = parsedResult ? parsedResult.uniqueId : scanResult.trim();
      const response = await axios.post(
        `${baseURL}/api/v1/admin/qr/scan/${uniqueId}`,
        { event }
      );
      const json = response.data;
      
      if (json.result) {
        triggerVibration(vibrationPatterns.success);
        
        if (event === 'received') {
          Swal.fire("Received!", "Product added to inventory.", "success");
        } else if (event === 'shipped') {
          Swal.fire("Shipped!", "Product marked as shipped from inventory.", "success");
        }
        setError('');
        
        if (onScanSuccess) {
          onScanSuccess();
        }
        
        // Auto-restart scanner after successful scan
        setTimeout(() => {
          setScanResult('');
          if (!cameraActive) {
            startScanner();
          }
        }, 2000);
        
      } else {
        triggerVibration(vibrationPatterns.error);
        Swal.fire("Scan Failed", json.message || "Unknown error.", "error");
        setError(json.message || 'Unknown error.');
      }
    } catch (err) {
      triggerVibration(vibrationPatterns.error);
      const errorMessage = err.response?.data?.message || err.message || "Network or server error.";
      setError(errorMessage);
      Swal.fire("Error", errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md mt-8">
      <h2 className="text-xl font-bold mb-4 text-center">Fast QR Scanner</h2>

      {/* Event Buttons */}
      <div className="flex space-x-4 mb-4 justify-center">
        <button
          type="button"
          onClick={() => setEvent('received')}
          className={`px-4 py-2 rounded ${event === 'received' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Receive
        </button>
        <button
          type="button"
          onClick={() => setEvent('shipped')}
          className={`px-4 py-2 rounded ${event === 'shipped' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Ship
        </button>
      </div>

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

      {/* Video Element - Always rendered for auto-start */}
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
        <div className="border border-gray-300 rounded px-3 py-2 bg-gray-50">
          <p className="text-sm text-gray-600 mb-1">Scanned Product:</p>
          <p className="font-medium capitalize">
            {parsedResult ? parsedResult.productName : "Waiting for QR scan..."}
          </p>
        </div>
        
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={!scanResult || loading}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing...</span>
            </div>
          ) : (
            event === 'received' ? 'Mark as Received' : 'Mark as Shipped'
          )}
        </button>
      </form>
    </div>
  );
};

export default QrWarehouseScanner;
