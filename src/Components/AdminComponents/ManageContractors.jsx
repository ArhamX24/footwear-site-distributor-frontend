import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2'; // ✅ Add this import
import { baseURL } from '../../Utils/URLS';
import { FaUsers, FaSpinner, FaUser, FaQrcode, FaEye, FaPhone, FaLock } from 'react-icons/fa';
import AddContractorDialog from '../../Components/AdminComponents/AddContractorDialog';

const ContractorCard = ({ contractor, onViewStats, setIsDeleted, setIsUpdated }) => {
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [contractorDetails, setContractorDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleViewDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${baseURL}/api/v1/admin/users/details/${contractor._id}`,
        { withCredentials: true }
      );
      
      if (response.data.result) {
        setContractorDetails(response.data.data);
        setViewModalOpen(true);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to fetch details",
        background: "#1F2937",
        color: "#F9FAFB",
        confirmButtonColor: "#4B5563",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED handleDelete with SweetAlert2
  const handleDelete = async () => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#4B5563",
        cancelButtonColor: "#EF4444",
        confirmButtonText: "Yes, delete it!",
        background: "#1F2937",
        color: "#F9FAFB",
      });

      if (result.isConfirmed) {
        await axios.delete(`${baseURL}/api/v1/admin/users/${contractor._id}`, {
          withCredentials: true
        });
        
        Swal.fire({
          title: "Deleted!",
          text: "Contractor has been deleted.",
          icon: "success",
          background: "#1F2937",
          color: "#F9FAFB",
          confirmButtonColor: "#4B5563",
        });
        
        setIsDeleted(prev => !prev);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.response?.data?.message || "Failed to delete contractor",
        background: "#1F2937",
        color: "#F9FAFB",
        confirmButtonColor: "#4B5563",
      });
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300">
        <div className="flex items-center mb-4">
          <div className="bg-gray-600 p-3 rounded-full mr-4">
            <FaUser className="text-white text-xl" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 capitalize">{contractor.fullName}</h3>
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

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleViewDetails}
            disabled={loading}
            className="bg-gray-800 text-white px-2 py-2 rounded-lg hover:bg-gray-900 transition duration-200 text-xs font-medium flex items-center justify-center disabled:bg-gray-400"
          >
            <FaEye className="mr-1" />
            {loading ? "..." : "View"}
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-2 py-2 rounded-lg hover:bg-red-700 transition duration-200 text-xs font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {/* View Details Modal */}
      {viewModalOpen && contractorDetails && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 text-white sticky top-0 z-10">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FaEye />
                Contractor Full Details
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 font-medium">Full Name</label>
                  <p className="text-gray-900 font-semibold mt-1 capitalize">{contractorDetails.fullName || "N/A"}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 font-medium">Phone Number</label>
                  <p className="text-gray-900 font-semibold mt-1">{contractorDetails.phoneNo || "N/A"}</p>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg border-2 border-gray-600">
                  <label className="text-xs text-gray-300 font-medium flex items-center gap-1">
                    <FaLock className="text-xs" />
                    Password
                  </label>
                  <p className="text-white font-bold text-lg mt-2 font-mono tracking-wider break-all">
                    {contractorDetails.password || "Not available"}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 font-medium">Total Items Produced</label>
                  <p className="text-gray-900 font-semibold mt-1">{contractorDetails.totalItemsProduced || 0}</p>
                </div>


              </div>

              <button
                onClick={() => setViewModalOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
      console.error('Error fetching contractors:', error);
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
        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gray-600 p-3 rounded-full">
                <FaUsers className="text-2xl text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bar Code Generator
            </h1>
            <div className="w-24 h-1 bg-gray-600 mx-auto rounded-full"></div>
          </div>

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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-white rounded-full p-6 shadow-lg mb-4">
              <FaSpinner className="text-3xl text-gray-600 animate-spin" />
            </div>
            <p className="text-gray-600 font-medium">Loading contractors...</p>
          </div>
        ) : (
          <>
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
