import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { baseURL } from '../../Utils/URLS';
import { FaSearch, FaSort, FaRedo } from 'react-icons/fa';
import { ChevronDown, RefreshCw } from 'lucide-react';

const DemandPage = () => {
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('');
  const [sortBy, setSortBy] = useState('demand');
  const [sortOrder, setSortOrder] = useState('-1');
  const [segments, setSegments] = useState([]);

  // ✅ SIZES FORMATTER (6X8)
  const formatSizes = (sizes) => {
    if (!sizes || sizes.length === 0) return 'N/A';
    if (sizes.length === 1) return sizes[0];
    const sorted = [...sizes].sort((a, b) => a - b);
    return `${sorted[0]}X${sorted[sorted.length - 1]}`;
  };

  const fetchDemand = useCallback(async (pageNum = 1, reset = false) => {
    try {
      setLoading(pageNum === 1);
      const params = new URLSearchParams({
        page: pageNum,
        limit: 15,
        search,
        segment: segmentFilter || '',
        sort: `${sortBy}${sortOrder === '-1' ? '' : 'asc'}`
      });

      const res = await axios.get(
        `${baseURL}/api/v1/admin/demand?${params}`,
        { withCredentials: true }
      );

      if (res.data.result) {
        setTotal(res.data.pagination?.total || 0);
        setHasMore(res.data.pagination?.hasMore || false);
        
        if (reset || pageNum === 1) {
          setDemands(res.data.data);
          setPage(1);
        } else {
          setDemands(prev => [...prev, ...res.data.data]);
        }

        const uniqueSegments = [...new Set(res.data.data.map(d => d.segment))];
        setSegments(uniqueSegments);
      }
    } catch (error) {
      console.error('Demand fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [search, segmentFilter, sortBy, sortOrder]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDemand(1, true);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search, segmentFilter, sortBy, sortOrder, fetchDemand]);

  useEffect(() => {
    fetchDemand(1, true);
  }, [fetchDemand]);

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchDemand(page + 1);
      setPage(prev => prev + 1);
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === '-1' ? '1' : '-1');
    } else {
      setSortBy(field);
      setSortOrder('-1');
    }
  };

  const handleRefreshAllDemand = async () => {
  try {
    const res = await axios.post(
      `${baseURL}/api/v1/admin/demand/refresh`, 
      {}, 
      { withCredentials: true }
    );
    if (res.data.result) {
      fetchDemand(1, true);
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
};
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Demand Dashboard</h1>
            <p className="text-lg text-gray-600">
              Total Items: <span className="font-semibold">{total}</span>
            </p>
          </div>
          <button
            onClick={handleRefreshAllDemand}
            disabled={loading}
            className="px-6 py-2.5 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search articles, segments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all"
            />
          </div>

          {/* Segment Filter */}
          <div className="relative">
            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all appearance-none"
            >
              <option value="">All Segments</option>
              {segments.map(seg => (
                <option key={seg} value={seg}>{seg}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>

          {/* Sort */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => toggleSort('demand')}
              className={`px-4 py-2.5 border-2 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                sortBy === 'demand'
                  ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                  : 'bg-white border-gray-300 hover:border-gray-500 hover:shadow-sm'
              }`}
            >
              <FaSort className="w-3.5 h-3.5" />
              Demand{sortBy === 'demand' ? (sortOrder === '-1' ? ' ↓' : ' ↑') : ''}
            </button>
            <button
              onClick={() => toggleSort('lastOrderUpdate')}
              className={`px-4 py-2.5 border-2 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                sortBy === 'lastOrderUpdate'
                  ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                  : 'bg-white border-gray-300 hover:border-gray-500 hover:shadow-sm'
              }`}
            >
              <FaSort className="w-3.5 h-3.5" />
              Recent{sortBy === 'lastOrderUpdate' ? (sortOrder === '-1' ? ' ↓' : ' ↑') : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Article</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Segment</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Demand</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Colors</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Sizes</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                Array(8).fill().map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="flex items-center"><div className="w-12 h-12 bg-gray-200 rounded-lg mr-4"></div><div className="h-4 bg-gray-200 rounded w-32"></div></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-6 bg-gray-200 rounded w-16 mx-auto"></div></td>
                    <td className="px-6 py-4 text-center"><div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div></td>
                    <td className="px-6 py-4 text-center"><div className="h-6 bg-gray-200 rounded w-20 mx-auto"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div></td>
                  </tr>
                ))
              ) : demands.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-gray-500">
                    <div className="text-4xl mb-4 mx-auto">📊</div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">No Demand Data</h3>
                    <p>Place distributor orders to see demand tracking</p>
                  </td>
                </tr>
              ) : (
                demands.map((demand) => (
                  <tr key={demand._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img 
                          src={demand.articleImage || '/placeholder.jpg'}
                          alt={demand.articleName}
                          className="w-12 h-12 rounded-lg object-cover mr-4 border"
                          onError={(e) => e.target.src = '/placeholder.jpg'}
                        />
                        <div>
                          <div className="font-semibold text-sm capitalize">{demand.articleName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                        {demand.segment}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-4 py-2 text-lg rounded-full font-semibold ${
                        demand.availableStock >= demand.totalOrdered 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {demand.availableStock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-4 py-2 rounded-full font-bold text-lg ${
                        demand.demand > 0 
                          ? 'bg-red-100 text-red-800 border border-red-200' 
                          : 'bg-green-100 text-green-800 border border-green-200'
                      }`}>
                        {demand.demand > 0 ? `-${demand.demand}` : '0'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {demand.colors.join(', ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-gray-900">
                      {formatSizes(demand.sizes)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">
                      {new Date(demand.lastStockUpdate).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {hasMore && !loading && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={loadMore}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors shadow-sm"
            >
              Load More ({demands.length}/{total})
            </button>
          </div>
        )}


      </div>
    </div>
  );
};

export default DemandPage;
