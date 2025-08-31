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
            maxScansPerSecond: 10, // High scan rate for fast detection
          }
        );
        
        await qrScannerRef.current.start();
        setCameraActive(true);
      }
    } catch (err) {
      setError('Camera access denied or not available');
      console.error(err);
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
    return () => {
      stopScanner();
    };
  }, []);

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
    }
    setLoading(false);
    stopScanner();
    setScanResult('');
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

      {/* Camera Controls */}
      <div className="mb-4 text-center">
        {!cameraActive ? (
          <button
            onClick={startScanner}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
          >
           Open Scanner
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Close Scanner
          </button>
        )}
      </div>

      {/* Video Element */}
      {cameraActive && (
        <div className="mb-4 relative">
          <video
            ref={videoRef}
            className="w-full rounded-lg border-2 border-indigo-300"
            style={{ maxHeight: '300px' }}
          />
        </div>
      )}

      {error && <p className="mb-2 text-red-600 font-semibold text-sm text-center">{error}</p>}
      
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <p className='border border-gray-300 rounded px-3 py-2 capitalize'>
          {parsedResult ? parsedResult.productName : "Scanned Result Will Appear Here"}
        </p>
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-700 transition"
          disabled={!scanResult || loading}
        >
          {loading ? 'Processing...' : event === 'received' ? 'Mark as Received' : 'Mark as Shipped'}
        </button>
      </form>
    </div>
  );
};

export default QrWarehouseScanner;
