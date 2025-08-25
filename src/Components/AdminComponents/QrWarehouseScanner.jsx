import { useState, useMemo } from 'react';
import QrScanner from 'react-qr-barcode-scanner';
import Swal from 'sweetalert2';
import axios from 'axios';
import { baseURL } from '../../Utils/URLS';

const QrWarehouseScanner = ({onScanSuccess}) => {
  const [scanResult, setScanResult] = useState('');
  const [event, setEvent] = useState('received');
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState('');

  const parsedResult = useMemo(() => {
    try {
      return JSON.parse(scanResult);
    } catch {
      return null;
    }
  }, [scanResult]);

  // Vibration function
  const triggerVibration = (pattern = [200]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    } else {
      console.log('Vibration not supported on this device');
    }
  };

  // Success vibration patterns
  const vibrationPatterns = {
    success: [200, 100, 200], // Long-short-long pattern for success
    error: [100, 50, 100, 50, 100], // Short bursts for error
    scan: [100] // Single short vibration when QR is detected
  };

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
        // Success vibration
        triggerVibration(vibrationPatterns.success);
        
        if (event === 'received') {
          Swal.fire("Received!", "Product added to inventory.", "success");
        } else if (event === 'shipped') {
          Swal.fire("Shipped!", "Product marked as shipped from inventory.", "success");
        }
        setError('');
        
        // Call the callback for parent component
        if (onScanSuccess) {
          onScanSuccess();
        }
      } else {
        // Error vibration
        triggerVibration(vibrationPatterns.error);
        Swal.fire("Scan Failed", json.message || "Unknown error.", "error");
        setError(json.message || 'Unknown error.');
      }
    } catch (err) {
      // Error vibration
      triggerVibration(vibrationPatterns.error);
      const errorMessage = err.response?.data?.message || err.message || "Network or server error.";
      setError(errorMessage);
      Swal.fire("Error", errorMessage, "error");
    }
    setLoading(false);
    // Optionally deactivate camera after scan
    setCameraActive(false);
    setScanResult('');
  };

  // Enhanced QR detection with vibration
  const handleQRDetection = (err, result) => {
    if (result && result.text !== scanResult) {
      // QR detected vibration
      triggerVibration(vibrationPatterns.scan);
      setScanResult(result.text);
    }
    if (err) console.error(err);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md mt-8">
      <h2 className="text-xl font-bold mb-4 text-center">QR Scanner</h2>

      {/* Vibration Support Indicator */}
      {!('vibrate' in navigator) && (
        <div className="mb-4 p-2 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm text-center">
          <span className="text-xs">⚠️ Vibration not supported on this device</span>
        </div>
      )}

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

      {/* Activate Camera Button */}
      <div className="mb-4 text-center">
        {!cameraActive ? (
          <button
            onClick={() => setCameraActive(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
          >
            Open Camera to Scan
          </button>
        ) : (
          <button
            onClick={() => setCameraActive(false)}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Close Camera
          </button>
        )}
      </div>

      {/* QR Scanner (conditionally rendered) */}
      {cameraActive && (
        <div className="mb-4">
          <QrScanner
            onUpdate={handleQRDetection}
            style={{ width: '100%' }}
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

      {/* Vibration Test Buttons (Optional - for testing) */}
      {('vibrate' in navigator) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2 text-center">Test Vibrations:</p>
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => triggerVibration(vibrationPatterns.scan)}
              className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs hover:bg-gray-300"
            >
              Scan
            </button>
            <button
              onClick={() => triggerVibration(vibrationPatterns.success)}
              className="px-2 py-1 bg-green-200 text-green-600 rounded text-xs hover:bg-green-300"
            >
              Success
            </button>
            <button
              onClick={() => triggerVibration(vibrationPatterns.error)}
              className="px-2 py-1 bg-red-200 text-red-600 rounded text-xs hover:bg-red-300"
            >
              Error
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QrWarehouseScanner;
