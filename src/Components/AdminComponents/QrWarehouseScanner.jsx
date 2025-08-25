import React, { useState, useMemo } from 'react';
import QrScanner from 'react-qr-barcode-scanner';
import Swal from 'sweetalert2';
import axios from 'axios';
import { baseURL } from '../../Utils/URLS';

const QrWarehouseScanner = () => {
  const [scanResult, setScanResult] = useState('');
  const [event, setEvent] = useState('received');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('')

  const parsedResult = useMemo(() => {
    try {
      return JSON.parse(scanResult);
    } catch {
      return null;
    }
  }, [scanResult]);

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
        if (event === 'received') {
          Swal.fire("Received!", "Product added to inventory.", "success");
        } else if (event === 'shipped') {
          Swal.fire("Shipped!", "Product marked as shipped from inventory.", "success");
        }
      } else {
        Swal.fire("Scan Failed", json.message || "Unknown error.", "error");
      }
    } catch (err) {
        setError(err.response.data)
      Swal.fire("Error", err.message || "Network or server error.", "error");
    }
    setLoading(false);
    setScanResult('');
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md mt-8">
        <p>{error}</p>
      <h2 className="text-xl font-bold mb-4">Warehouse QR Scanner</h2>
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
      <div className="mb-4">
        <QrScanner
          onUpdate={(err, result) => {
            if (result) setScanResult(result.text);
            if (err) console.error(err);
          }}
          style={{ width: '100%' }}
        />
      </div>
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
