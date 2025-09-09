import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseURL } from '../../Utils/URLS';
import { FaUsers, FaSpinner, FaUser, FaQrcode, FaEye } from 'react-icons/fa';
import AddContractorDialog from '../../Components/AdminComponents/AddContractorDialog';

const ContractorCard = ({ contractor, onViewStats, setIsDeleted, setIsUpdated }) => {
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this contractor?')) {
      try {
        await axios.delete(`${baseURL}/api/v1/admin/users/${contractor._id}`, {
          withCredentials: true
        });
        setIsDeleted(prev => !prev);
      } catch (error) {
        console.error('Error deleting contractor:', error);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300">
      <div className="flex items-center mb-4">
        <div className="bg-gray-600 p-3 rounded-full mr-4">
          <FaUser className="text-white text-xl" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{contractor.fullName}</h3>
          <p className="text-gray-600 text-sm">{contractor.phoneNo}</p>
        </div>
        <div className="flex items-center">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            contractor.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {contractor.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">Items Produced:</span>
          <span className="font-semibold text-gray-700">{contractor.totalItemsProduced}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Joined:</span>
          <span className="text-sm text-gray-600">
            {new Date(contractor.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onViewStats(contractor)}
          className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition duration-200 text-sm font-medium flex items-center justify-center"
        >
          <FaEye className="mr-2" />
          View Stats
        </button>
        <button
          onClick={handleDelete}
          className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition duration-200 text-sm font-medium"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

const ContractorStatsModal = ({ contractor, isOpen, onClose }) => {
  if (!isOpen || !contractor) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900/50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Contractor Stats</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold px-2 py-1 rounded-full border"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gray-600 p-4 rounded-full mr-4">
              <FaUser className="text-white text-2xl" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">{contractor.fullName}</h3>
              <p className="text-gray-600">{contractor.role}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Phone Number:</span>
              <span className="text-gray-800">{contractor.phoneNo}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                contractor.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {contractor.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Total Items Produced:</span>
              <span className="text-gray-800 font-semibold">{contractor.totalItemsProduced}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Joined Date:</span>
              <span className="text-gray-800">
                {new Date(contractor.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Role:</span>
              <span className="text-gray-800 capitalize">{contractor.role}</span>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaQrcode className="text-blue-600 mr-2" />
                <span className="text-blue-800 font-medium">QR Generation Stats</span>
              </div>
              <span className="text-blue-600 text-lg font-bold">
                {contractor.totalItemsProduced}
              </span>
            </div>
            <p className="text-blue-600 text-sm mt-1">
              Total QR codes generated by this contractor
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition duration-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const ManageContractors = () => {
  const [contractors, setContractors] = useState(null);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [statsModalOpen, setStatsModalOpen] = useState(false);

  const getContractors = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseURL}/api/v1/admin/users/contractors`, {
        withCredentials: true,
      });
      if (response.data.result) {
        setContractors(response.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStats = (contractor) => {
    setSelectedContractor(contractor);
    setStatsModalOpen(true);
  };

  const handleCloseStatsModal = () => {
    setStatsModalOpen(false);
    setSelectedContractor(null);
  };

  useEffect(() => {
    getContractors();
  }, [isUpdated, isDeleted]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gray-600 p-3 rounded-full">
                <FaUsers className="text-2xl text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Manage Contractors
            </h1>
            <div className="w-24 h-1 bg-gray-600 mx-auto rounded-full"></div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex justify-center sm:justify-end">
              <AddContractorDialog setIsUpdated={setIsUpdated} />
            </div>
            <div>
              {contractors && (
                <p className="text-gray-600 text-center sm:text-left">
                  Managing {contractors.length} contractor{contractors.length !== 1 ? 's' : ''}
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
            <p className="text-gray-600 font-medium">Loading contractors...</p>
          </div>
        ) : (
          <>
            {/* Empty State */}
            {!contractors || contractors.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gray-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                  <FaUsers className="text-4xl text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Contractors Found
                </h3>
                <p className="text-gray-600 mb-6">
                  There are no contractors in your system yet. Start by adding your first contractor.
                </p>
                <div className="inline-block">
                  <AddContractorDialog setIsUpdated={setIsUpdated} />
                </div>
              </div>
            ) : (
              /* Contractors Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {contractors.map((contractor) => (
                  <ContractorCard
                    key={contractor._id}
                    contractor={contractor}
                    onViewStats={handleViewStats}
                    setIsDeleted={setIsDeleted}
                    setIsUpdated={setIsUpdated}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Stats Modal */}
        <ContractorStatsModal
          contractor={selectedContractor}
          isOpen={statsModalOpen}
          onClose={handleCloseStatsModal}
        />
      </div>
    </div>
  );
};

export default ManageContractors;
