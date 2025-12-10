import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2'; // ✅ Add this import
import { baseURL } from '../../Utils/URLS';
import { FaUserShield, FaSpinner, FaTruck, FaWarehouse, FaEye, FaUser, FaPhone, FaLock } from 'react-icons/fa';
import AddManagerDialog from '../../Components/AdminComponents/AddManagerDialog';

const ManagerCard = ({ manager, managerType, onDelete, setIsUpdated }) => {
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [managerDetails, setManagerDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleViewDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${baseURL}/api/v1/admin/users/details/${manager._id}`,
        { withCredentials: true }
      );
      
      if (response.data.result) {
        setManagerDetails(response.data.data);
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
        await axios.delete(`${baseURL}/api/v1/admin/users/${manager._id}`, {
          withCredentials: true
        });
        
        Swal.fire({
          title: "Deleted!",
          text: "Manager has been deleted.",
          icon: "success",
          background: "#1F2937",
          color: "#F9FAFB",
          confirmButtonColor: "#4B5563",
        });
        
        setIsUpdated(prev => !prev);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.response?.data?.message || "Failed to delete manager",
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
            {managerType === 'warehouse' ? (
              <FaWarehouse className="text-white text-xl" />
            ) : (
              <FaTruck className="text-white text-xl" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{manager.fullName || manager.name}</h3>
            <p className="text-gray-600 text-sm">{manager.phoneNo}</p>
          </div>
          <div className="flex items-center">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              manager.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {manager.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Role:</span>
            <span className="font-semibold text-gray-700 capitalize">
              {managerType == "warehouse" ? "In" : "Out"} Manager
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Joined:</span>
            <span className="text-sm text-gray-600">
              {new Date(manager.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleViewDetails}
            disabled={loading}
            className="bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-900 transition duration-200 text-sm font-medium flex items-center justify-center disabled:bg-gray-400"
          >
            <FaEye className="mr-1" />
            {loading ? "..." : "View"}
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition duration-200 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {/* View Details Modal - remains the same */}
      {viewModalOpen && managerDetails && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 text-white sticky top-0 z-10">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FaEye />
                Manager Full Details
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 font-medium">Full Name</label>
                  <p className="text-gray-900 font-semibold mt-1 capitalize">{managerDetails.fullName || "N/A"}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 font-medium">Phone Number</label>
                  <p className="text-gray-900 font-semibold mt-1">{managerDetails.phoneNo || "N/A"}</p>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg border-2 border-gray-600">
                  <label className="text-xs text-gray-300 font-medium flex items-center gap-1">
                    <FaLock className="text-xs" />
                    Password
                  </label>
                  <p className="text-white font-bold text-lg mt-2 font-mono tracking-wider break-all">
                    {managerDetails.password || "Not available"}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 font-medium">Role</label>
                  <p className="text-gray-900 font-semibold mt-1 capitalize">
                    {managerDetails.role == 'warehouse_inspector' ? "In": "Out"} Manager
                  </p>
                </div>

                {managerType === 'warehouse' && (
                  <>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="text-xs text-gray-500 font-medium">Total Items Inspected</label>
                      <p className="text-gray-900 font-semibold mt-1">{managerDetails.totalItemsInspected || 0}</p>
                    </div>
                  </>
                )}

                {managerType === 'shipment' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="text-xs text-gray-500 font-medium">Total Shipments Handled</label>
                    <p className="text-gray-900 font-semibold mt-1">{managerDetails.totalShipmentsHandled || 0}</p>
                  </div>
                )}

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



const ManageManagers = () => {
  const [managers, setManagers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdated, setIsUpdated] = useState(false);
  const [activeTab, setActiveTab] = useState('warehouse');

  const getManagers = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'warehouse' 
        ? `${baseURL}/api/v1/admin/users/warehouse-managers`
        : `${baseURL}/api/v1/admin/users/shipment-managers`;
      
      const response = await axios.get(endpoint, {
        withCredentials: true,
      });
      if (response.data.result) {
        setManagers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching managers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getManagers();
  }, [isUpdated, activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gray-600 p-3 rounded-full">
                <FaUserShield className="text-2xl text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Manage Managers
            </h1>
            <div className="w-24 h-1 bg-gray-600 mx-auto rounded-full"></div>
          </div>

          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-lg p-1 shadow-md inline-flex">
              <button
                onClick={() => setActiveTab('warehouse')}
                className={`flex items-center justify-center px-4 py-2 rounded-md transition duration-200 flex-1 whitespace-nowrap ${
                  activeTab === 'warehouse'
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FaWarehouse className="mr-2" />
                IN Managers
              </button>
              <button
                onClick={() => setActiveTab('shipment')}
                className={`flex items-center justify-center px-4 py-2 rounded-md transition duration-200 ml-2 flex-1 whitespace-nowrap ${
                  activeTab === 'shipment'
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FaTruck className="mr-2" />
                OUT Managers
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex justify-center sm:justify-end">
              <AddManagerDialog 
                managerType={activeTab} 
                setIsUpdated={setIsUpdated} 
              />
            </div>
            <div>
              {managers && (
                <p className="text-gray-600 text-center sm:text-left">
                  Managing {managers.length} {activeTab} manager{managers.length !== 1 ? 's' : ''}
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
            <p className="text-gray-600 font-medium">Loading {activeTab} managers...</p>
          </div>
        ) : (
          <>
            {!managers || managers.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gray-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                  {activeTab === 'warehouse' ? (
                    <FaWarehouse className="text-4xl text-gray-400" />
                  ) : (
                    <FaTruck className="text-4xl text-gray-400" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No {activeTab} Managers Found
                </h3>
                <p className="text-gray-600 mb-6">
                  There are no {activeTab} managers in your system yet. Start by adding your first {activeTab} manager.
                </p>
                <div className="inline-block">
                  <AddManagerDialog 
                    managerType={activeTab} 
                    setIsUpdated={setIsUpdated} 
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {managers.map((manager) => (
                  <ManagerCard
                    key={manager._id}
                    manager={manager}
                    managerType={activeTab}
                    onDelete={() => {}}
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

export default ManageManagers;
