import React, { useState, useEffect } from 'react';
import QrWarehouseScanner from './QrWarehouseScanner';
import axios from 'axios';
import { baseURL } from '../../Utils/URLS';

const ManageInventory = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview'); // overview, items

  console.log(inventoryData);
  
  // Fetch all inventory data on component mount
  useEffect(() => {
    fetchAllInventoryData();
  }, []);

  const fetchAllInventoryData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${baseURL}/api/v1/admin/inventory/all`);
      if (response.data.result) {
        setInventoryData(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch inventory data');
      console.log(err);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'received': 'bg-green-100 text-green-800',
      'in_stock': 'bg-blue-100 text-blue-800',
      'reserved': 'bg-yellow-100 text-yellow-800',
      'shipped': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          Advanced Inventory Management
        </h1>
        <p className="text-gray-600">Track individual items and manage inventory with detailed insights</p>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* QR Scanner Section */}
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

          {/* Selected Product Details */}
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
                {/* Product Summary - Simple Gray Background */}
                <div className="bg-gray-100 border border-gray-200 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2 capitalize text-gray-800">
                    {selectedProduct.product.segment}
                  </h3>
                  <h4 className="text-base font-medium mb-3 capitalize text-gray-700">
                    {selectedProduct.product.title}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-2xl font-bold text-gray-800">{selectedProduct.inventoryCount}</div>
                      <div className="text-gray-600 capitalize">Total Items</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-800">{selectedProduct.availableQuantity}</div>
                      <div className="text-gray-600 capitalize">Available</div>
                    </div>
                  </div>
                  {selectedProduct.lastUpdated && (
                    <div className="text-xs mt-2 text-gray-500 capitalize">
                      Last Updated: {formatDate(selectedProduct.lastUpdated)}
                    </div>
                  )}
                </div>

                {/* Tabs - Remove details tab */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    {['overview', 'items'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setSelectedTab(tab)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                          selectedTab === tab
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="mt-4">
                  {selectedTab === 'overview' && (
                    <div className="space-y-4">
                      {/* Article Breakdown */}
                      {selectedProduct.itemsByArticle && Object.keys(selectedProduct.itemsByArticle).length > 0 ? (
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-3 capitalize">Articles In Stock</h4>
                          {Object.entries(selectedProduct.itemsByArticle).map(([articleName, items]) => (
                            <div key={articleName} className="bg-gray-50 p-3 rounded-lg mb-2">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-700 capitalize">{articleName}</span>
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                  {items.length} Items
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {Array.from(new Set(items.map(item => item.status))).map(status => (
                                  <span key={status} className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(status)}`}>
                                    {status}: {items.filter(item => item.status === status).length}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <p className="capitalize">No Items In Inventory</p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedTab === 'items' && (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedProduct.inventoryItems && selectedProduct.inventoryItems.length > 0 ? (
                        selectedProduct.inventoryItems.map((item, index) => (
                          <div key={item._id || index} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start space-x-3">
                              {/* Article Image */}
                              <div className="flex-shrink-0">
                                {item.articleDetails?.images && item.articleDetails.images.length > 0 ? (
                                  <img 
                                    src={item.articleDetails.images[0]} 
                                    alt={item.articleName}
                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                    onError={(e) => {
                                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yOCAzMkMzMCAzMiAzMiAzMCAzMiAyOEMzMiAyNiAzMCAyNCAyOCAyNEMyNiAyNCAyNCAyNiAyNCAyOEMyNCAzMCAyNiAzMiAyOCAzMloiIGZpbGw9IiM5Q0E0QUYiLz4KPHBhdGggZD0iTTQwIDQwSDI0VjQ0SDQwVjQwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                                    }}
                                  />
                                ) : (
                                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center border border-gray-200">
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              
                              {/* Item Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h5 className="font-medium text-gray-800 capitalize">{item.articleName}</h5>
                                    <p className="text-xs text-gray-500 capitalize">QR: {item.uniqueId}</p>
                                  </div>
                                  <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(item.status)}`}>
                                    {item.status}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                  <div className="capitalize">Received: {formatDate(item.receivedAt)}</div>
                                  <div className="capitalize">By: {item.receivedBy?.userId || 'Unknown'}</div>
                                </div>
                                {item.receivedLocation?.address && (
                                  <div className="text-xs text-gray-600 mt-1 capitalize">
                                    Location: {item.receivedLocation.address}
                                  </div>
                                )}
                                {item.notes && (
                                  <div className="text-xs text-gray-600 mt-1 italic capitalize">
                                    Notes: {item.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p className="capitalize">No Individual Items Found</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h2m0 0V6a2 2 0 012-2h2.586a1 1 0 01.707.293l2.414 2.414A1 1 0 0116 7v2m-2 2h2" />
                </svg>
                <p className="text-lg capitalize">No Product Selected</p>
                <p className="text-sm capitalize">Scan A QR Code To View Product Details</p>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 capitalize">Inventory Overview</h2>
          
          {inventoryData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {inventoryData.map((item, index) => (
                <div 
                  key={index}
                  onClick={() => fetchProductInventory(item.productId)}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50"
                >
                  <h3 className="font-semibold text-gray-800 mb-2 capitalize">
                    {item.product?.segment || 'Unknown Product'}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <div className="text-xl font-bold text-blue-600">{item.inventoryCount}</div>
                      <p className="text-xs text-gray-500 capitalize">Total</p>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-600">{item.availableQuantity}</div>
                      <p className="text-xs text-gray-500 capitalize">Available</p>
                    </div>
                  </div>
                  
                  {/* Status indicators */}
                  {item.statusBreakdown && Object.keys(item.statusBreakdown).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {Object.entries(item.statusBreakdown).map(([status, count]) => (
                        <span key={status} className={`px-1 py-0.5 rounded text-xs capitalize ${getStatusColor(status)}`}>
                          {status}: {count}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {item.lastUpdated && (
                    <p className="text-xs text-gray-400 capitalize">
                      Updated: {formatDate(item.lastUpdated)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="capitalize">No Inventory Data Available</p>
              <button 
                onClick={fetchAllInventoryData}
                className="mt-2 bg-gray-700 text-white hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors capitalize"
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
