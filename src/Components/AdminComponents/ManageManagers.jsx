import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { baseURL } from '../../Utils/URLS';
import { FaUserShield, FaSpinner, FaTruck, FaWarehouse, FaEye, FaUser } from 'react-icons/fa';
import AddManagerDialog from '../../Components/AdminComponents/AddManagerDialog';

const ManagerCard = ({ manager, managerType, onDelete, setIsUpdated }) => {
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this manager?')) {
      try {
        await axios.delete(`${baseURL}/api/v1/admin/users/${manager._id}`, {
          withCredentials: true
        });
        setIsUpdated(prev => !prev);
      } catch (error) {
        console.error('Error deleting manager:', error);
      }
    }
  };

  return (
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
            {manager.role?.replace('_', ' ') || `${managerType} Manager`}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Joined:</span>
          <span className="text-sm text-gray-600">
            {new Date(manager.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex space-x-2">
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

const ManageManagers = () => {
  const [managers, setManagers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdated, setIsUpdated] = useState(false);
  const [activeTab, setActiveTab] = useState('warehouse'); // warehouse or shipment

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
        {/* Header Section */}
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

          {/* Tab Navigation */}
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-lg p-1 shadow-md">
              <button
                onClick={() => setActiveTab('warehouse')}
                className={`flex items-center px-4 py-2 rounded-md transition duration-200 ${
                  activeTab === 'warehouse'
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FaWarehouse className="mr-2" />
                Warehouse Managers
              </button>
              <button
                onClick={() => setActiveTab('shipment')}
                className={`flex items-center px-4 py-2 rounded-md transition duration-200 ml-2 ${
                  activeTab === 'shipment'
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FaTruck className="mr-2" />
                Shipment Managers
              </button>
            </div>
          </div>

          {/* Action Bar */}
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

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-white rounded-full p-6 shadow-lg mb-4">
              <FaSpinner className="text-3xl text-gray-600 animate-spin" />
            </div>
            <p className="text-gray-600 font-medium">Loading {activeTab} managers...</p>
          </div>
        ) : (
          <>
            {/* Empty State */}
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
              /* Managers Grid */
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
