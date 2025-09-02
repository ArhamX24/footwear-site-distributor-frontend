import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseURL } from '../../Utils/URLS';

const QRStatisticsDashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('latest'); // latest or oldest
  const [showSortOptions, setShowSortOptions] = useState(false);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async (customSort = null) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (customSort || sortBy) {
        params.append('sortBy', customSort || sortBy);
      }
      
      const queryString = params.toString();
      const url = `${baseURL}/api/v1/admin/qr/statistics${queryString ? `?${queryString}` : ''}`;
      
      console.log('Fetching from URL:', url);
      
      const response = await axios.get(url);
      console.log('API Response:', response.data);
      
      if (response.data.result) {
        setStatistics(response.data.data);
      } else {
        setError('No data received from server');
      }
    } catch (err) {
      setError(`Failed to fetch QR statistics: ${err.response?.data?.message || err.message}`);
      console.error('API Error:', err);
    }
    setLoading(false);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setShowSortOptions(false);
    fetchStatistics(newSort);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (type) => {
    const colors = {
      'manufactured': 'bg-blue-100 text-blue-800 border-blue-200',
      'scanned': 'bg-green-100 text-green-800 border-green-200',
      'active': 'bg-purple-100 text-purple-800 border-purple-200',
      'unused': 'bg-gray-100 text-gray-800 border-gray-200',
      'total': 'bg-gray-50 text-gray-900 border-gray-300'
    };
    return colors[type] || colors.total;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading QR Statistics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button 
          onClick={() => fetchStatistics()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          QR Statistics Dashboard
        </h1>
        <p className="text-gray-600">
          Monitor QR code generation, scanning, and distribution across all articles
        </p>
      </div>

      {statistics ? (
        <>
          {/* Overall Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className={`rounded-lg p-4 border-2 ${getStatusColor('total')}`}>
              <div className="text-2xl font-bold">{statistics.overview?.totalArticles || 0}</div>
              <div className="text-sm font-medium">Total Articles</div>
            </div>
            <div className={`rounded-lg p-4 border-2 ${getStatusColor('manufactured')}`}>
              <div className="text-2xl font-bold">{statistics.overview?.totalQRsGenerated || 0}</div>
              <div className="text-sm font-medium">QRs Generated</div>
            </div>
            <div className={`rounded-lg p-4 border-2 ${getStatusColor('scanned')}`}>
              <div className="text-2xl font-bold">{statistics.overview?.totalScannedQRs || 0}</div>
              <div className="text-sm font-medium">QRs Scanned</div>
            </div>
            <div className={`rounded-lg p-4 border-2 ${getStatusColor('active')}`}>
              <div className="text-2xl font-bold">{statistics.overview?.totalActiveQRs || 0}</div>
              <div className="text-sm font-medium">Active QRs</div>
            </div>
            <div className={`rounded-lg p-4 border-2 ${getStatusColor('unused')}`}>
              <div className="text-2xl font-bold">
                {(statistics.overview?.totalQRsGenerated || 0) - (statistics.overview?.totalScannedQRs || 0)}
              </div>
              <div className="text-sm font-medium">Unused QRs</div>
            </div>
          </div>
          {/* Article Statistics Table with Sort Filter */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 max-h-[600px] overflow-y-auto overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Article Breakdown</h2>
              {/* Sort Filter */}
              <div className="relative">
                <button
                  onClick={() => setShowSortOptions(!showSortOptions)}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 14v5a1 1 0 01-1 1H11a1 1 0 01-1-1v-5L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                  <span className="text-gray-700">
                    {sortBy === 'latest' ? 'Latest First' : 'Oldest First'}
                  </span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Sort Options Dropdown */}
                {showSortOptions && (
                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => handleSortChange('latest')}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortBy === 'latest' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                      >
                        📅 Latest First
                      </button>
                      <button
                        onClick={() => handleSortChange('oldest')}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortBy === 'oldest' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                      >
                        📅 Oldest First
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {statistics.statsByArticle && statistics.statsByArticle.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Article Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Segment</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Generated</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Scanned</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Active</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Unused</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Last Generated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.statsByArticle.map((article, index) => (
                      <tr 
                        key={`${article.productId}-${article.articleName}-${index}`} 
                        className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}
                      >
                        <td className="py-3 px-4 font-medium text-gray-900 capitalize">
                          {article.articleName || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-gray-700 capitalize">
                          {article.productTitle || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor('manufactured')}`}>
                            {article.totalQRsGenerated || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor('scanned')}`}>
                            {article.scannedQRs || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor('active')}`}>
                            {article.activeQRs || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor('unused')}`}>
                            {article.unusedQRs || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatDate(article.lastGenerated)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg">No article data found</p>
                <p className="text-sm">Try refreshing or check if QR codes have been generated</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No statistics data available</p>
          <p className="text-sm">Click retry to load data</p>
        </div>
      )}

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

export default QRStatisticsDashboard;
