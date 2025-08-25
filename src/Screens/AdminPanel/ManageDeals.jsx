import { useState, useEffect } from 'react';
import axios from 'axios';
import DealsCard from '../../Components/AdminComponents/DealsCard';
import { baseURL } from '../../Utils/URLS';
import { FaTag, FaSpinner, FaPercentage, FaClock, FaCalendarCheck } from 'react-icons/fa';

const AddDeal = () => {
  const [deals, setDeals] = useState(null);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [loading, setLoading] = useState(true);

  const getDeals = async () => {
    try {
      setLoading(true);
      let response = await axios.get(`${baseURL}/api/v1/admin/deal/get`, {
        withCredentials: true,
      });
      setDeals(response.data.data);
    } catch (error) {
      console.error(error);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDeals();
    if (isDeleted || isUpdated) {
      setIsDeleted(false);
      setIsUpdated(false);
    }
  }, [isDeleted, isUpdated]);

  useEffect(() => {
    getDeals();
  }, []);

  // Calculate deal statistics
  const getDealStats = () => {
    if (!deals || deals.length === 0) return null;

    const now = new Date();
    const activeDeals = deals.filter(deal => {
      const endDate = new Date(deal.endDate);
      return endDate > now;
    });
    
    const expiredDeals = deals.filter(deal => {
      const endDate = new Date(deal.endDate);
      return endDate <= now;
    });

    const endingSoon = deals.filter(deal => {
      const endDate = new Date(deal.endDate);
      const diffTime = endDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 7;
    });

    return {
      total: deals.length,
      active: activeDeals.length,
      expired: expiredDeals.length,
      endingSoon: endingSoon.length
    };
  };

  const stats = getDealStats();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-3 rounded-full shadow-lg">
              <FaTag className="text-2xl text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            All Deals & Offers
          </h1>
          <div className="w-24 h-1 bg-gray-600 mx-auto rounded-full"></div>
          {stats && (
            <p className="text-gray-600 mt-4">
              Managing {stats.total} deal{stats.total !== 1 ? 's' : ''} • {stats.active} Active • {stats.expired} Expired
            </p>
          )}
        </div>

        {/* Statistics Cards */}
        {stats && stats.total > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <FaTag className="text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-600">Total Deals</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <FaCalendarCheck className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <FaClock className="text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats.endingSoon}</p>
                  <p className="text-sm text-gray-600">Ending Soon</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <FaPercentage className="text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                  <p className="text-sm text-gray-600">Expired</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-white rounded-full p-6 shadow-lg mb-4">
              <FaSpinner className="text-3xl text-gray-600 animate-spin" />
            </div>
            <p className="text-gray-600 font-medium">Loading deals...</p>
          </div>
        ) : (
          <>
            {/* Empty State */}
            {!deals || deals.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gray-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                  <FaTag className="text-4xl text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Deals Found
                </h3>
                <p className="text-gray-600 mb-6">
                  There are no deals or offers in your system yet.
                </p>
                <button className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-medium shadow-sm">
                  Create First Deal
                </button>
              </div>
            ) : (
              /* Deals Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {deals.map((deal, idx) => (
                  <DealsCard
                    key={deal._id || idx}
                    deal={deal}
                    setIsDeleted={setIsDeleted}
                    setIsUpdated={setIsUpdated}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AddDeal;