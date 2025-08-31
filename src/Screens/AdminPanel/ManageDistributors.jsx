import { useState, useEffect } from 'react';
import axios from 'axios';
import DistributorCard from '../../Components/AdminComponents/DistributorCard';
import { baseURL } from '../../Utils/URLS';
import { FaUsers, FaSpinner, FaPlus } from 'react-icons/fa';
import AddDistributorDialog from '../../Components/AdminComponents/AddDistributorDialog';

const AddDistributor = () => {
  const [distributors, setDistributors] = useState(null);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [loading, setLoading] = useState(true);

  const getDistributors = async () => {
    try {
      setLoading(true);
      let response = await axios.get(`${baseURL}/api/v1/admin/distributor/get`, {
        withCredentials: true,
      });
      if (response.data.result) {
        setDistributors(response.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDistributors();
  }, [isUpdated, isDeleted]);

  useEffect(() => {
    getDistributors();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section with Action Button */}
        <div className="mb-8">
          {/* Title and Icon Row */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gray-600 p-3 rounded-full">
                <FaUsers className="text-2xl text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              All Distributors
            </h1>
            <div className="w-24 h-1 bg-gray-600 mx-auto rounded-full"></div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            {/* Count Info */}
            {/* Add Distributor Button - Responsive positioning */}
            <div className="flex justify-center sm:justify-end">
              <AddDistributorDialog />
            </div>
            
            <div>
              {distributors && (
                <p className="text-gray-600 text-center sm:text-left">
                  Managing {distributors.length} distributor{distributors.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-white rounded-full p-6 shadow-lg mb-4">
              <FaSpinner className="text-3xl text-gray-600 animate-spin" />
            </div>
            <p className="text-gray-600 font-medium">Loading distributors...</p>
          </div>
        ) : (
          <>
            {/* Empty State */}
            {!distributors || distributors.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gray-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                  <FaUsers className="text-4xl text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Distributors Found
                </h3>
                <p className="text-gray-600 mb-6">
                  There are no distributors in your system yet. Start by adding your first distributor.
                </p>
                {/* Alternative Add Button for Empty State */}
                <div className="inline-block">
                  <AddDistributorDialog />
                </div>
              </div>
            ) : (
              /* Distributors Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {distributors.map((distributor) => (
                  <DistributorCard
                    key={distributor?._id}
                    distributor={distributor}
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

export default AddDistributor;
