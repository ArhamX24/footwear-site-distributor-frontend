import React, { useState, useEffect } from 'react';
import QrWarehouseScanner from './QrWarehouseScanner';
import axios from 'axios';
import { baseURL } from '../../Utils/URLS';

const ManageInventory = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all inventory data on component mount
  useEffect(() => {
    fetchAllInventoryData();
  }, []);

  const fetchAllInventoryData = async () => {
    setLoading(true);
    setError('');
    try {
      // You might need to create an endpoint to get all inventory items
      // For now, this is a placeholder - adjust according to your API
      const response = await axios.get(`${baseURL}/api/v1/admin/inventory/all`);
      if (response.data.result) {
        setInventoryData(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch inventory data');
      console.error(err);
    }
    setLoading(false);
  };

  const fetchProductInventory = async (productId) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${baseURL}/api/v1/admin/inventory/${productId}`);
      if (response.data.result) {
        setSelectedProduct(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch product inventory');
      console.error(err);
    }
    setLoading(false);
  };

  const refreshInventory = () => {
    fetchAllInventoryData();
    if (selectedProduct) {
      fetchProductInventory(selectedProduct.product._id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          Inventory
        </h1>
        <p className="text-gray-600">Scan QR codes to manage product inventory</p>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* QR Scanner Section - Left/Top */}
          <div className="bg-white rounded-xl shadow-lg p-6 order-1 lg:order-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">QR Code Scanner</h2>
              <button 
                onClick={refreshInventory}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
              >
                Refresh
              </button>
            </div>
            <QrWarehouseScanner onScanSuccess={refreshInventory} />
          </div>

          {/* Selected Product Details - Right/Bottom */}
          <div className="bg-white rounded-xl shadow-lg p-6 order-2 lg:order-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Product Details</h2>
            
            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {selectedProduct ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">
                    {selectedProduct.product.segment}
                  </h3>
                  <div className="text-2xl font-bold">
                    Stock: {selectedProduct.inventoryCount} units
                  </div>
                </div>

                {selectedProduct.product.variants?.map((variant, vIndex) => (
                  <div key={vIndex} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3 capitalize">
                      {variant.name}
                    </h4>
                    
                    {variant.articles?.map((article, aIndex) => (
                      <div key={aIndex} className="bg-gray-50 p-3 rounded mb-2 last:mb-0">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-700">{article.name}</h5>
                          {article.indeal && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                              Deal Available
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Colors:</span> {article.colors?.join(', ') || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Sizes:</span> {article.sizes?.join(', ') || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Gender:</span> {article.gender || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Quantity:</span> {article.quantity || 0}
                          </div>
                        </div>

                        {article.deal && (
                          <div className="mt-2 text-sm bg-yellow-100 p-2 rounded">
                            <strong>Deal:</strong> {article.deal.reward} (Min: {article.deal.minQuantity})
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h2m0 0V6a2 2 0 012-2h2.586a1 1 0 01.707.293l2.414 2.414A1 1 0 0116 7v2m-2 2h2" />
                </svg>
                <p className="text-lg">No product selected</p>
                <p className="text-sm">Scan a QR code to view product details</p>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Inventory Overview</h2>
          
          {inventoryData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {inventoryData.map((item, index) => (
                <div 
                  key={index}
                  onClick={() => fetchProductInventory(item.productId)}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50"
                >
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {item.product?.segment || 'Unknown Product'}
                  </h3>
                  <div className="text-2xl font-bold text-blue-600">
                    {item.inventoryCount}
                  </div>
                  <p className="text-sm text-gray-500">units in stock</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No inventory data available</p>
              <button 
                onClick={fetchAllInventoryData}
                className="mt-2 bg-gray-700 text-white hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors"
              >
                Refresh Inventory
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageInventory;
