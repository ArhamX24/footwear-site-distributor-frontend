import React, { useState, useEffect } from 'react';
import QrWarehouseScanner from './QrWarehouseScanner';
import axios from 'axios';
import { baseURL } from '../../Utils/URLS';

const ManageInventory = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedArticleKey, setSelectedArticleKey] = useState(null);
  
  // ✅ Updated filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('dateDesc');
  const [showSortOptions, setShowSortOptions] = useState(false);

  // Fetch all inventory data on component mount
  useEffect(() => {
    fetchAllInventoryData();
  }, []);

  // Apply search when searchQuery changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedProduct && searchQuery !== '') {
        applySearch();
      } else if (selectedProduct && searchQuery === '') {
        // Clear search
        fetchProductInventory(selectedProduct.product._id);
      }
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

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

  // ✅ Enhanced fetch with search and sort
  const fetchProductInventory = async (productId) => {
    setLoading(true);
    setError('');
    setSelectedArticleKey(null);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (sortOption) params.append('sort', sortOption);
      
      const queryString = params.toString();
      const url = `${baseURL}/api/v1/admin/inventory/${productId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await axios.get(url);
      if (response.data.result) {
        setSelectedProduct(response.data.data);
        console.log('Fetched product data:', response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch product inventory');
      console.error(err);
    }
    setLoading(false);
  };

  // ✅ Apply search function
  const applySearch = () => {
    if (selectedProduct) {
      fetchProductInventory(selectedProduct.product._id);
    }
  };

  // ✅ Apply sort function
  const applySort = (newSortOption) => {
    setSortOption(newSortOption);
    setShowSortOptions(false);
    if (selectedProduct) {
      fetchProductInventory(selectedProduct.product._id);
    }
  };

  // ✅ Clear search function
  const clearSearch = () => {
    setSearchQuery('');
    if (selectedProduct) {
      fetchProductInventory(selectedProduct.product._id);
    }
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

  const formatSizes = (sizes) => {
    if (!sizes || !Array.isArray(sizes) || sizes.length === 0) return 'N/A';
    
    const numericSizes = sizes.map(size => parseFloat(size)).filter(size => !isNaN(size)).sort((a, b) => a - b);
    
    if (numericSizes.length === 0) return sizes.join(',');
    if (numericSizes.length === 1) return numericSizes[0].toString();
    
    const min = numericSizes[0];
    const max = numericSizes[numericSizes.length - 1];
    
    return `${min}X${max}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      'manufactured': 'bg-blue-100 text-blue-800',
      'in_warehouse': 'bg-green-100 text-green-800',
      'shipped_to_distributor': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-gray-100 text-gray-800',
      'damaged': 'bg-red-100 text-red-800',
      'returned': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get sort option display name
  const getSortDisplayName = (option) => {
    const options = {
      'dateAsc': 'Date ↑',
      'dateDesc': 'Date ↓',
      'timeAsc': 'Time ↑',
      'timeDesc': 'Time ↓'
    };
    return options[option] || 'Sort';
  };

  // ✅ Updated to show current status counts
  const getDisplayStatistics = () => {
    if (!selectedProduct) return null;

    if (selectedArticleKey && selectedProduct.articleStatsByStatus) {
      const articleStats = selectedProduct.articleStatsByStatus[selectedArticleKey] || {};
      
      return {
        title: selectedArticleKey,
        isArticleView: true,
        stats: [
          { 
            label: 'Manufactured', 
            value: articleStats.manufactured || 0, 
            color: 'text-blue-600',
            description: 'Items currently at manufactured status'
          },
          { 
            label: 'In Warehouse', 
            value: articleStats.in_warehouse || 0, 
            color: 'text-green-600',
            description: 'Items currently in warehouse'
          },
          { 
            label: 'Shipped', 
            value: articleStats.shipped_to_distributor || 0, 
            color: 'text-purple-600',
            description: 'Items shipped to distributors'
          },
          { 
            label: 'Delivered', 
            value: articleStats.delivered || 0, 
            color: 'text-gray-600',
            description: 'Items delivered'
          }
        ]
      };
    } else {
      // ✅ Calculate current status counts for overall view
      const currentStatusCounts = {
        manufactured: 0,
        in_warehouse: 0,
        shipped_to_distributor: 0,
        delivered: 0
      };
      
      if (selectedProduct.inventoryItems) {
        selectedProduct.inventoryItems.forEach(item => {
          if (currentStatusCounts.hasOwnProperty(item.status)) {
            currentStatusCounts[item.status]++;
          }
        });
      }
      
      return {
        title: selectedProduct.product.segment,
        subtitle: selectedProduct.product.title,
        isArticleView: false,
        stats: [
          { 
            label: 'Manufactured', 
            value: currentStatusCounts.manufactured, 
            color: 'text-blue-600',
            description: 'Items currently at manufactured status'
          },
          { 
            label: 'In Warehouse', 
            value: currentStatusCounts.in_warehouse, 
            color: 'text-green-600',
            description: 'Items currently in warehouse'
          },
          { 
            label: 'Shipped Out', 
            value: currentStatusCounts.shipped_to_distributor, 
            color: 'text-purple-600',
            description: 'Items shipped to distributors'
          },
          { 
            label: 'Delivered', 
            value: currentStatusCounts.delivered, 
            color: 'text-gray-600',
            description: 'Items delivered'
          }
        ]
      };
    }
  };

  const displayStats = getDisplayStatistics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          Inventory Management
        </h1>
      </div>

      <div className="w-full mx-auto">
        <div className="grid grid-cols-1 gap-6 mb-6">

          {/* Selected Product Details - Enhanced with Search & Sort */}
          <div className="bg-white rounded-xl shadow-lg p-6 w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-800">Product Details</h2>
                {selectedArticleKey && (
                  <button
                    onClick={() => setSelectedArticleKey(null)}
                    className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg transition-colors"
                  >
                    ← Back to Overview
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedProduct && (
                  <button 
                    onClick={refreshInventory}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm transition-colors"
                  >
                    Refresh
                  </button>
                )}
              </div>
            </div>

            {/* ✅ Enhanced Search Bar and Filter */}
            {selectedProduct && (
              <div className="mb-6 relative">
                <div className="flex items-center gap-2">
                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Search by article name or QR code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          applySearch();
                        }
                      }}
                    />
                    {searchQuery && (
                      <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Sort Filter Button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSortOptions(!showSortOptions)}
                      className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 14v5a1 1 0 01-1 1H11a1 1 0 01-1-1v-5L3.293 6.707A1 1 0 013 6V4z" />
                      </svg>
                      <span className="text-gray-700">{getSortDisplayName(sortOption)}</span>
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Sort Options Dropdown */}
                    {showSortOptions && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                        <div className="py-1">
                          <button
                            onClick={() => applySort('dateDesc')}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortOption === 'dateDesc' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                          >
                            📅 Date (Newest First)
                          </button>
                          <button
                            onClick={() => applySort('dateAsc')}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortOption === 'dateAsc' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                          >
                            📅 Date (Oldest First)
                          </button>
                          <button
                            onClick={() => applySort('timeDesc')}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortOption === 'timeDesc' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                          >
                            🕐 Time (Latest First)
                          </button>
                          <button
                            onClick={() => applySort('timeAsc')}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortOption === 'timeAsc' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                          >
                            🕐 Time (Earliest First)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Search/Filter Results Info */}
                {selectedProduct.filters && (
                  <div className="mt-2 text-xs text-gray-600">
                    {searchQuery && `Search: "${searchQuery}" • `}
                    Sort: {getSortDisplayName(sortOption)} • 
                    Showing {selectedProduct.filters.totalItemsAfterFilter} of {selectedProduct.filters.totalItemsBeforeFilter} items
                  </div>
                )}
              </div>
            )}
            
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
              <div className="space-y-6 w-full">
                {/* Enhanced Product Summary with Dynamic Statistics */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold capitalize text-blue-800">
                        {displayStats?.isArticleView ? 'Article Analytics' : displayStats?.title}
                      </h3>
                      <h4 className="text-lg font-medium capitalize text-blue-700">
                        {displayStats?.isArticleView ? displayStats?.title : displayStats?.subtitle}
                      </h4>
                    </div>
                    {displayStats?.isArticleView && (
                      <div className="text-sm text-blue-700 bg-white/60 px-3 py-1 rounded-full">
                        Article View
                      </div>
                    )}
                  </div>
                  
                  {/* Enhanced Dynamic Statistics Grid with Status Tracking */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {displayStats?.stats.map((stat, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                        <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                        <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                        {stat.description && (
                          <div className="text-xs text-gray-500 mt-1">{stat.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {selectedProduct.lastUpdated && (
                    <div className="text-sm text-blue-700 bg-white/50 px-3 py-2 rounded">
                      Last Updated: {formatDate(selectedProduct.lastUpdated)}
                    </div>
                  )}
                </div>

                {/* Enhanced Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    {[
                      { key: 'overview', label: 'Articles', count: Object.keys(selectedProduct.itemsByArticle || {}).length },
                      { key: 'items', label: 'All Items', count: selectedProduct.inventoryCount },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setSelectedTab(tab.key)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                          selectedTab === tab.key
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab.label}
                        {tab.count > 0 && (
                          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Enhanced Tab Content with Status Information */}
                <div className="mt-4">
                  {selectedTab === 'overview' && (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedProduct.itemsByArticle && Object.keys(selectedProduct.itemsByArticle).length > 0 ? (
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-3 capitalize">Articles Breakdown</h4>
                          {Object.entries(selectedProduct.itemsByArticle).map(([articleName, items]) => {
                            const sizesSet = new Set();
                            items.forEach(item => {
                              (item.articleDetails?.sizes || []).forEach(s => sizesSet.add(s));
                            });
                            const sizesArr = Array.from(sizesSet);
                            const isSelected = selectedArticleKey === articleName;
                            
                            // Get status counts for this specific article
                            const articleStats = selectedProduct.articleStatsByStatus?.[articleName] || {};
                            
                            return (
                              <div 
                                key={articleName} 
                                onClick={() => setSelectedArticleKey(articleName)}
                                className={`cursor-pointer transition-all duration-200 p-4 rounded-lg mb-3 hover:shadow-md ${
                                  isSelected ? 'bg-blue-100 border border-blue-300 shadow-md' : 'bg-gray-50 hover:bg-gray-100'
                                }`}
                              >
                                <div className="flex justify-between items-center mb-3">
                                  <span className="font-medium text-gray-700 capitalize text-lg">{articleName}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                      {items.length} Total
                                    </span>
                                    {isSelected && (
                                      <span className="text-blue-600 text-sm font-medium">• Selected</span>
                                    )}
                                  </div>
                                </div>

                                {/* ✅ Updated Status Breakdown with Current Counts */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                                    <div className="text-lg font-bold text-blue-600">{articleStats.manufactured || 0}</div>
                                    <div className="text-xs text-blue-700">Manufactured</div>
                                  </div>
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                                    <div className="text-lg font-bold text-green-600">{articleStats.in_warehouse || 0}</div>
                                    <div className="text-xs text-green-700">In Warehouse</div>
                                  </div>
                                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-center">
                                    <div className="text-lg font-bold text-purple-600">{articleStats.shipped_to_distributor || 0}</div>
                                    <div className="text-xs text-purple-700">Shipped</div>
                                  </div>
                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                                    <div className="text-lg font-bold text-gray-600">{articleStats.delivered || 0}</div>
                                    <div className="text-xs text-gray-700">Delivered</div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2 items-center text-sm text-gray-700">
                                  <span className="font-medium">Sizes:</span>
                                  <span className="text-gray-600 bg-white px-2 py-1 rounded">{formatSizes(sizesArr)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h2m0 0V6a2 2 0 012-2h2.586a1 1 0 01.707.293l2.414 2.414A1 1 0 0116 7v2m-2 2h2" />
                            </svg>
                          </div>
                          <p className="text-lg">No Items In Inventory</p>
                          <p className="text-sm">Scan QR codes to add items</p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedTab === 'items' && (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedProduct.inventoryItems && selectedProduct.inventoryItems.length > 0 ? (
                        selectedProduct.inventoryItems.map((item, index) => {
                          const isSelected = selectedArticleKey === item.articleName;
                          
                          return (
                            <div 
                              key={item._id || index} 
                              onClick={() => setSelectedArticleKey(item.articleName)}
                              className={`cursor-pointer transition-all duration-200 border rounded-lg p-3 hover:shadow-md ${
                                isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                {/* Article Image */}
                                <div className="flex-shrink-0">
                                  {item.articleDetails?.images && item.articleDetails.images.length > 0 ? (
                                    <img 
                                      src={item.articleDetails.images[0]} 
                                      alt={item.articleName}
                                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                      onError={(e) => {
                                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yOCAzMkMzMCAzMiAzMiAzMCAzMiAyOEMzMiAyNiAzMCAyNCAyOCAyNEMyNiAyNCAyNCAyNiAyNCAyOEMyNCAzMCAyNiAzMiAyOCAzMloiIGZpbGw9IiM5Q0E0QUYiLz4KPHBhdGggZD0iTTQwIDQwSDI0VjQ0SDQwVjQwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'
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
                                      <p className="text-xs text-gray-500 capitalize">
                                        Size: {formatSizes(item.articleDetails?.sizes)}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-1 rounded-full text-xs capitalize font-medium ${getStatusColor(item.status)}`}>
                                        {item.status.replace('_', ' ')}
                                      </span>
                                      {isSelected && (
                                        <span className="text-blue-600 text-xs">Selected</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                    <div>Manufactured: {formatDate(item.manufacturedAt)}</div>
                                    <div>Received: {formatDate(item.receivedAt)}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h2m0 0V6a2 2 0 012-2h2.586a1 1 0 01.707.293l2.414 2.414A1 1 0 0116 7v2m-2 2h2" />
                            </svg>
                          </div>
                          <p className="text-lg">No Individual Items Found</p>
                          <p className="text-sm">Items will appear here after scanning</p>
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
                <p className="text-lg">No Product Selected</p>
                <p className="text-sm">Scan A QR Code To View Product Details</p>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Overview - Enhanced with Status Display */}
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
                  <h3 className="font-semibold text-gray-800 mb-2 capitalize">
                    {item.product?.segment || 'Unknown Product'}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <div className="text-xl font-bold text-blue-600">{item.inventoryCount}</div>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-green-600">{item.availableQuantity}</div>
                      <p className="text-xs text-gray-500">Available</p>
                    </div>
                  </div>
                  
                  {item.statusBreakdown && Object.keys(item.statusBreakdown).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {Object.entries(item.statusBreakdown).map(([status, count]) => (
                        <span key={status} className={`px-1 py-0.5 rounded text-xs capitalize ${getStatusColor(status)}`}>
                          {status.replace('_', ' ')}: {count}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {item.lastUpdated && (
                    <p className="text-xs text-gray-400">
                      Updated: {formatDate(item.lastUpdated)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No Inventory Data Available</p>
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

      {/* Click outside handler for sort dropdown */}
      {showSortOptions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSortOptions(false)}
        />
      )}
    </div>
  );
};

export default ManageInventory;
