import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseURL } from '../../Utils/URLS';

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
      const response = await axios.get(`${baseURL}/api/v1/admin/inventory/all`, {
        withCredentials: true
      });

      if (response.data.result) {
        setInventoryData(response.data.data.inventoryData || []);
      } else {
        setError('Failed to fetch inventory data');
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on search term
  const filteredData = inventoryData.filter(item => {
    const articleNames = Object.keys(item.articleBreakdown || {}).join(' ').toLowerCase();
    const segment = (item.productInfo?.segment || '').toLowerCase();
    return articleNames.includes(searchTerm.toLowerCase()) || 
           segment.includes(searchTerm.toLowerCase());
  });

  // Extract all articles from breakdown for display
  const getTableRows = () => {
    const rows = [];
    filteredData.forEach((product) => {
      const articles = Object.entries(product.articleBreakdown || {});
      
      if (articles.length === 0) {
        // If no articles, show product-level info
        rows.push({
          productId: product.productId,
          articleName: 'No Articles',
          segment: product.productInfo?.segment || 'Unknown',
          totalVariants: product.productInfo?.totalVariants || 0,
          totalArticles: product.productInfo?.totalArticles || 0,
          availableQuantity: product.inventoryMetrics?.availableQuantity || 0,
          received: product.inventoryMetrics?.quantityByStage?.received || 0,
          shipped: product.inventoryMetrics?.quantityByStage?.shipped || 0,
          qrsGenerated: product.qrCodeStats?.totalQRs || 0,
          qrsScanned: product.qrCodeStats?.scannedQRs || 0,
          lastActivity: product.lastUpdated,
          status: product.inventoryMetrics?.availableQuantity > 0 ? 'In Stock' : 'Out of Stock'
        });
      } else {
        articles.forEach(([articleName, articleStats]) => {
          rows.push({
            productId: product.productId,
            articleName: articleName,
            segment: product.productInfo?.segment || 'Unknown',
            totalVariants: product.productInfo?.totalVariants || 0,
            totalArticles: product.productInfo?.totalArticles || 0,
            availableQuantity: product.inventoryMetrics?.availableQuantity || 0,
            received: product.inventoryMetrics?.quantityByStage?.received || 0,
            shipped: product.inventoryMetrics?.quantityByStage?.shipped || 0,
            qrsGenerated: articleStats.qrsGenerated || 0,
            qrsScanned: articleStats.qrsScanned || 0,
            lastActivity: articleStats.lastActivity || product.lastUpdated,
            status: product.inventoryMetrics?.availableQuantity > 0 ? 'In Stock' : 'Out of Stock'
          });
        });
      }
    });
    return rows;
  };

  const tableRows = getTableRows();

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
                📦 Inventory Tracker
              </h1>
              <p className="text-gray-600">
                Track articles, stock levels, and availability
              </p>
            </div>
            
            {/* Summary Stats */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="text-center bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Total Products</div>
                <div className="text-xl font-bold text-gray-600">{inventoryData.length}</div>
              </div>
              <div className="text-center bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Total Articles</div>
                <div className="text-xl font-bold text-gray-600">{tableRows.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
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

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Mobile Cards View (Hidden on Desktop) */}
          <div className="block md:hidden">
            {tableRows.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-gray-500">No inventory data found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {tableRows.map((row, index) => (
                  <div key={index} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800 capitalize">
                          {row.articleName}
                        </h3>
                        <p className="text-sm text-gray-500 capitalize">
                          {row.segment}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        row.status === 'In Stock' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {row.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Available:</span>
                        <span className="ml-2 font-semibold text-green-600">
                          {row.availableQuantity}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Received:</span>
                        <span className="ml-2 font-semibold">{row.received}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Shipped:</span>
                        <span className="ml-2 font-semibold">{row.shipped}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">QRs:</span>
                        <span className="ml-2 font-semibold">
                          {row.qrsScanned}/{row.qrsGenerated}
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
                    Received
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shipped
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QRs (Scanned/Total)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <div className="text-4xl mb-4">📭</div>
                      <p className="text-gray-500">No inventory data found</p>
                      {searchTerm && (
                        <p className="text-sm text-gray-400 mt-2">
                          Try adjusting your search terms
                        </p>
                      )}
                    </td>
                  </tr>
                ) : (
                  tableRows.map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {row.articleName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 capitalize">
                          {row.segment}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          row.status === 'In Stock' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-semibold text-green-600">
                          {row.availableQuantity}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-semibold text-gray-900">
                          {row.received}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-semibold text-gray-900">
                          {row.shipped}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          <span className="font-semibold text-blue-600">{row.qrsScanned}</span>
                          <span className="text-gray-400"> / </span>
                          <span className="font-semibold">{row.qrsGenerated}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {row.lastActivity ? new Date(row.lastActivity).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Stats */}
        {tableRows.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {tableRows.filter(row => row.status === 'In Stock').length}
                </div>
                <div className="text-sm text-gray-500">In Stock</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {tableRows.filter(row => row.status === 'Out of Stock').length}
                </div>
                <div className="text-sm text-gray-500">Out of Stock</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {tableRows.reduce((sum, row) => sum + row.received, 0)}
                </div>
                <div className="text-sm text-gray-500">Total Received</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {tableRows.reduce((sum, row) => sum + row.shipped, 0)}
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



