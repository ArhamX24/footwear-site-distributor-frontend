import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseURL } from '../../Utils/URLS';
import { Link } from 'react-router';

const ManageInventory = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${baseURL}/api/v1/admin/inventory/all`, {
        withCredentials: true
      });

      if (response.data.result) {
        setInventoryData(response.data.data.inventoryData || []);
      } else {
        setError(response.data.message || 'Failed to fetch inventory data');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on search term
  const filteredData = inventoryData.filter(item => {
    const articleName = (item.articleName || '').toLowerCase();
    const segment = (item.segment || '').toLowerCase();
    return articleName.includes(searchTerm.toLowerCase()) || 
           segment.includes(searchTerm.toLowerCase());
  });

  // Calculate totals
  const totalAvailable = filteredData.reduce((sum, item) => 
    sum + (item.inventoryMetrics?.availableQuantity || 0), 0);
  const totalShipped = filteredData.reduce((sum, item) => 
    sum + (item.inventoryMetrics?.shippedQuantity || 0), 0);
  const inStockCount = filteredData.filter(item => 
    (item.inventoryMetrics?.availableQuantity || 0) > 0).length;
  const outOfStockCount = filteredData.filter(item => 
    (item.inventoryMetrics?.availableQuantity || 0) === 0).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
              <span className="ml-3 text-lg text-gray-600">Loading inventory data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-4">❌ {error}</div>
              <button 
                onClick={fetchInventoryData}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition duration-200"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                Godown Inventory Tracker
              </h1>
            </div>
            
            <Link to={"/secure/admin/demand"}>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="text-center bg-gray-100 p-3 rounded-lg hover:bg-gray-300 hover:cursor-pointer">
                <div className="text-sm text-gray-800">Check Demand</div>
              </div>
            </div>
            </Link>
          </div>
        </div>

        {/* Search Bar - Show only if there's data */}
        {inventoryData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by article name or segment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-200"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {inventoryData.length === 0 ? (
            /* Empty state when no inventory exists */
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Inventory Data Found
              </h3>
              <p className="text-gray-500 mb-6">
                Start scanning products to see inventory here
              </p>
              <button
                onClick={fetchInventoryData}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition duration-200"
              >
                Refresh
              </button>
            </div>
          ) : (
            <>
              {/* Mobile Cards View (Hidden on Desktop) */}
              <div className="block md:hidden">
                {filteredData.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <p className="text-gray-500">No results found for "{searchTerm}"</p>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-4 text-gray-600 underline"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredData.map((item, index) => (
                      <div key={item.articleId || index} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-800 capitalize">
                              {item.articleName || 'Unknown'}
                            </h3>
                            <p className="text-sm text-gray-500 capitalize">
                              {item.segment || 'Unknown'}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (item.inventoryMetrics?.availableQuantity || 0) > 0
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {(item.inventoryMetrics?.availableQuantity || 0) > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Available:</span>
                            <span className="ml-2 font-semibold text-green-600">
                              {item.inventoryMetrics?.availableQuantity || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Shipped:</span>
                            <span className="ml-2 font-semibold">
                              {item.inventoryMetrics?.shippedQuantity || 0}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500">Last Updated:</span>
                            <span className="ml-2 text-xs">
                              {item.lastUpdated ? new Date(item.lastUpdated).toLocaleString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop Table View (Hidden on Mobile) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Article Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Segment
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Available Qty
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shipped
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center">
                          <div className="text-4xl mb-4">🔍</div>
                          <p className="text-gray-500">No results found for "{searchTerm}"</p>
                          <button
                            onClick={() => setSearchTerm('')}
                            className="mt-4 text-gray-600 underline"
                          >
                            Clear search
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((item, index) => {
                        const availableQty = item.inventoryMetrics?.availableQuantity || 0;
                        const shippedQty = item.inventoryMetrics?.shippedQuantity || 0;
                        const status = availableQty > 0 ? 'In Stock' : 'Out of Stock';
                        
                        return (
                          <tr key={item.articleId || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 capitalize">
                                {item.articleName || 'Unknown'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500 capitalize">
                                {item.segment || 'Unknown'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                status === 'In Stock' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="text-sm font-semibold text-green-600">
                                {availableQty}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="text-sm font-semibold text-gray-900">
                                {shippedQty}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {item.lastUpdated 
                                  ? new Date(item.lastUpdated).toLocaleString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : 'N/A'}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer Stats - Only show if there's data */}
        {filteredData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {inStockCount}
                </div>
                <div className="text-sm text-gray-500">In Stock</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {outOfStockCount}
                </div>
                <div className="text-sm text-gray-500">Out of Stock</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {totalAvailable}
                </div>
                <div className="text-sm text-gray-500">Total Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {totalShipped}
                </div>
                <div className="text-sm text-gray-500">Total Shipped</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageInventory;
