import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../../Utils/URLS";
import Swal from 'sweetalert2';

const PastOrdersPage = () => {
    const [shipments, setShipments] = useState(null);
    const [distributors, setDistributors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [statusFilter, setStatusFilter] = useState('all');
    const [distributorFilter, setDistributorFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState({
        startDate: '',
        endDate: ''
    });
    const [autoDeleteSettings, setAutoDeleteSettings] = useState({
        enabled: false,
        days: 30
    });
    const [selectedShipment, setSelectedShipment] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const getShipments = async () => {
  try {
    // ✅ FIXED: Use the correct endpoint from your controller
    const response = await axios.get(`${baseURL}/api/v1/admin/shipments`, {
      withCredentials: true,
      params: {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        distributorId: distributorFilter !== 'all' ? distributorFilter : undefined
      }
    });
    
    // ✅ IMPROVED: Add data validation
    if (response.data && response.data.result) {
      setShipments(response.data.data.shipments || []);
    } else {
      console.error('Invalid response structure:', response.data);
      Swal.fire('Error', 'Invalid response from server', 'error');
    }
  } catch (error) {
    // ✅ IMPROVED: Better error handling
    console.error('Full error details:', error);
    let errorMessage = 'Failed to fetch shipments';
    
    if (error.response) {
      // Server responded with error status
      errorMessage = error.response.data?.message || `Server Error: ${error.response.status}`;
    } else if (error.request) {
      // Network error
      errorMessage = 'Network error - please check your connection';
    }
    
    Swal.fire('Error', errorMessage, 'error');
  }
};


    // ✅ FIXED: Correct all endpoints
const getDistributors = async () => {
  try {
    const response = await axios.get(`${baseURL}/api/v1/admin/distributor/get`, {
      withCredentials: true
    });
    
    if (response.data && response.data.result) {
      setDistributors(response.data.data || []);
    }
  } catch (error) {
    console.error('Error fetching distributors:', error);
    Swal.fire('Error', 'Failed to fetch distributors', 'error');
  }
};

const handleViewShipment = async (shipment) => {
  try {
    setIsLoading(true);
    // ✅ FIXED: Use correct endpoint for shipment details
    const response = await axios.get(`${baseURL}/api/v1/admin/shipments/${shipment._id}`, {
      withCredentials: true
    });
    
    if (response.data && response.data.result) {
      setSelectedShipment(response.data.data);
      console.log('====================================');
      console.log(selectedShipment);
      console.log('====================================');
      setShowModal(true);
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    console.error('Error viewing shipment:', error);
    Swal.fire('Error', 'Failed to view shipment details', 'error');
  } finally {
    setIsLoading(false);
  }
};


    const getAutoDeleteSettings = async () => {
        try {
            const response = await axios.get(`${baseURL}/api/v1/admin/shipments/auto-delete-settings`, {
                withCredentials: true
            });
            setAutoDeleteSettings(response.data.data);
        } catch (error) {
            console.error('Error fetching auto-delete settings:', error);
        }
    };

    const updateAutoDeleteSettings = async () => {
        try {
            const { value: formValues } = await Swal.fire({
                title: 'Auto-Delete Settings',
                html: `
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Enable Auto-Delete
                            </label>
                            <select id="enabled" class="w-full p-2 border border-gray-300 rounded-md">
                                <option value="true" ${autoDeleteSettings.enabled ? 'selected' : ''}>Enabled</option>
                                <option value="false" ${!autoDeleteSettings.enabled ? 'selected' : ''}>Disabled</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Delete After (Days)
                            </label>
                            <select id="days" class="w-full p-2 border border-gray-300 rounded-md">
                                <option value="15" ${autoDeleteSettings.days === 15 ? 'selected' : ''}>15 Days</option>
                                <option value="30" ${autoDeleteSettings.days === 30 ? 'selected' : ''}>30 Days</option>
                                <option value="60" ${autoDeleteSettings.days === 60 ? 'selected' : ''}>60 Days</option>
                                <option value="90" ${autoDeleteSettings.days === 90 ? 'selected' : ''}>90 Days</option>
                            </select>
                        </div>
                    </div>
                `,
                focusConfirm: false,
                preConfirm: () => {
                    return {
                        enabled: document.getElementById('enabled').value === 'true',
                        days: parseInt(document.getElementById('days').value)
                    };
                }
            });

            if (formValues) {
                await axios.put(`${baseURL}/api/v1/admin/shipments/auto-delete-settings`, formValues, {
                    withCredentials: true
                });
                setAutoDeleteSettings(formValues);
                Swal.fire('Success', 'Auto-delete settings updated successfully', 'success');
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to update auto-delete settings', 'error');
        }
    };

    const deleteOldShipments = async () => {
        try {
            const result = await Swal.fire({
                title: 'Delete Old Shipments?',
                text: 'This will permanently delete old shipment records. This action cannot be undone.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete them!'
            });

            if (result.isConfirmed) {
                const response = await axios.delete(`${baseURL}/api/v1/admin/shipments/cleanup`, {
                    withCredentials: true
                });
                Swal.fire('Deleted!', `${response.data.deletedCount} old shipments have been deleted.`, 'success');
                getShipments(); // Refresh the list
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to delete old shipments', 'error');
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedShipment(null);
    };

    // Spinner Component
    const Spinner = () => (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
    );

    // Filter and sort shipments
    const filteredShipments = shipments?.filter(shipment => {
        const matchesSearch = shipment.distributorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (shipment.items?.[0]?.articleName || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesDate = !dateFilter.startDate || !dateFilter.endDate || 
                          (new Date(shipment.shippedAt) >= new Date(dateFilter.startDate) &&
                           new Date(shipment.shippedAt) <= new Date(dateFilter.endDate));
        
        return matchesSearch && matchesDate;
    });

    const sortedShipments = filteredShipments?.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.shippedAt) - new Date(a.shippedAt);
            case 'oldest':
                return new Date(a.shippedAt) - new Date(b.shippedAt);
            case 'distributor':
                return a.distributorName.localeCompare(b.distributorName);
            default:
                return 0;
        }
    });

    useEffect(() => {
        getShipments();
        getDistributors();
        getAutoDeleteSettings();
    }, [statusFilter, distributorFilter]);

    return (
        <div className='bg-gray-50 min-h-screen'>
            {/* Enhanced Header Section */}
            <div className='w-full bg-white shadow-sm border-b border-gray-200 mb-4 sm:mb-8'>
                <div className='w-11/12 mx-auto py-4 sm:py-6'>
                    <div className='flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
                        <div>
                            <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2'>Shipment Records</h1>
                            <p className='text-sm sm:text-base text-gray-600'>Track all distributor shipments and manage records</p>
                        </div>
                        <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4'>
                            <div className='bg-blue-50 px-3 sm:px-4 py-2 rounded-lg text-center'>
                                <span className='text-blue-800 font-semibold text-sm sm:text-base'>
                                    {shipments?.length || 0} Total Shipments
                                </span>
                            </div>
                            <button
                                onClick={updateAutoDeleteSettings}
                                className='bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 transition-all text-sm font-medium'
                            >
                                Settings
                            </button>
                            <button
                                onClick={deleteOldShipments}
                                className='bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 transition-all text-sm font-medium'
                            >
                                Cleanup Old Records
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Filters Section */}
            <div className='w-11/12 mx-auto mb-4 sm:mb-6'>
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4'>
                        {/* Search */}
                        <div className='relative'>
                            <svg className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by distributor..."
                                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="shipped">Shipped</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        {/* Distributor Filter */}
                        <select
                            value={distributorFilter}
                            onChange={(e) => setDistributorFilter(e.target.value)}
                            className="px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Distributors</option>
                            {distributors.map(distributor => (
                                <option key={distributor._id} value={distributor._id}>
                                    {distributor.name}
                                </option>
                            ))}
                        </select>

                        {/* Sort By */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="distributor">Distributor Name</option>
                        </select>
                    </div>

                    {/* Date Range Filter */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>From Date</label>
                            <input
                                type="date"
                                value={dateFilter.startDate}
                                onChange={(e) => setDateFilter(prev => ({...prev, startDate: e.target.value}))}
                                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>To Date</label>
                            <input
                                type="date"
                                value={dateFilter.endDate}
                                onChange={(e) => setDateFilter(prev => ({...prev, endDate: e.target.value}))}
                                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Shipments Table */}
            <div className="w-11/12 mx-auto">
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
                    {!shipments ? (
                        <div className='flex items-center justify-center py-16 sm:py-20'>
                            <div className='text-center'>
                                <div className='animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
                                <p className='text-gray-600 text-sm sm:text-base'>Loading shipments...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Enhanced Desktop Table Header */}
                            <div className="hidden lg:grid lg:grid-cols-5 gap-4 p-4 sm:p-6 bg-gray-50 border-b border-gray-200">
                                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Distributor</h5>
                                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</h5>
                                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</h5>
                                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Shipped Date</h5>
                                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</h5>
                            </div>

                            {/* Enhanced Shipments List */}
                            <div className="divide-y divide-gray-200 max-h-80 sm:max-h-96 overflow-y-auto">
                                {sortedShipments?.length > 0 ? (
                                    sortedShipments.map((shipment, index) => (
                                        <div key={index} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-200">
                                            {/* Desktop View */}
                                            <div className="hidden lg:grid lg:grid-cols-5 gap-4 items-center">
                                                <div className="text-gray-700 font-medium capitalize text-sm">{shipment.distributorName}</div>
                                                <div className="text-gray-600 text-sm">{shipment.totalCartons} cartons ({shipment.items?.length} articles)</div>
                                                <div>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        shipment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        shipment.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                        shipment.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {shipment.status.charAt(0).toUpperCase() + shipment.status.slice(1)}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {new Date(shipment.shippedAt).toLocaleDateString("en-GB")}
                                                </div>
                                                <div>
                                                    <button
                                                        className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                                        onClick={() => handleViewShipment(shipment)}
                                                        disabled={isLoading}
                                                    >
                                                        {isLoading ? <Spinner /> : null}
                                                        <span>View Details</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Mobile View */}
                                            <div className="lg:hidden">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="font-semibold text-gray-900 capitalize text-sm sm:text-base">
                                                        {shipment.distributorName}
                                                    </div>
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        shipment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        shipment.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                        shipment.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {shipment.status.charAt(0).toUpperCase() + shipment.status.slice(1)}
                                                    </span>
                                                </div>
                                                <div className="space-y-1 mb-4">
                                                    <div>
                                                        <span className="text-xs sm:text-sm text-gray-500">Items:</span>
                                                        <span className="ml-2 font-medium text-gray-900 text-xs sm:text-sm">
                                                            {shipment.totalCartons} cartons ({shipment.items?.length} articles)
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs sm:text-sm text-gray-500">Shipped:</span>
                                                        <span className="ml-2 font-medium text-gray-900 text-xs sm:text-sm">
                                                            {new Date(shipment.shippedAt).toLocaleDateString("en-GB")}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200 text-sm font-medium flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                                    onClick={() => handleViewShipment(shipment)}
                                                    disabled={isLoading}
                                                >
                                                    {isLoading ? <Spinner /> : null}
                                                    <span>View Details</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-16 sm:py-20">
                                        <div className="text-4xl sm:text-6xl mb-4 opacity-30">📦</div>
                                        <h3 className="text-lg sm:text-xl font-medium text-gray-600 mb-2">No shipments found</h3>
                                        <p className="text-gray-500 text-sm sm:text-base">
                                            {searchTerm || dateFilter.startDate ? 'Try adjusting your search criteria' : 'Shipment records will appear here'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Enhanced Shipment Details Modal - With Background Overlay */}
            {showModal && selectedShipment && (
                <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-0 lg:p-4">
                    {/* Desktop Modal */}
                    <div className="hidden lg:block bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-300">
                        {/* Modal Header with Cross */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Shipment Details</h2>
                                <p className="text-gray-600 capitalize">
                                    {selectedShipment.distributorName} - {new Date(selectedShipment.shippedAt).toLocaleDateString("en-GB")}
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                            {/* Shipment Summary */}
                            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-medium text-blue-800">Distributor</h3>
                                    <p className="text-lg font-semibold text-blue-900 capitalize">{selectedShipment.distributorName}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-medium text-green-800">Total Items</h3>
                                    <p className="text-lg font-semibold text-green-900">{selectedShipment.items?.length} Articles</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-medium text-purple-800">Total Cartons</h3>
                                    <p className="text-lg font-semibold text-purple-900">{selectedShipment.totalCartons}</p>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-medium text-yellow-800">Status</h3>
                                    <p className="text-lg font-semibold text-yellow-900 capitalize">{selectedShipment.status}</p>
                                </div>
                            </div>

                            {/* Articles Table */}
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">Shipped Articles</h3>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Article Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Details
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Cartons
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Tracking Number
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {selectedShipment.items?.map((item, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900 capitalize">{item.articleName || 'N/A'}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900">
                                                            {item.articleDetails && (
                                                                <>
                                                                    {item.articleDetails.color && (
                                                                        <div><span className="font-medium">Color:</span> {item.articleDetails.color}</div>
                                                                    )}
                                                                    {item.articleDetails.size && (
                                                                        <div><span className="font-medium">Size:</span> {item.articleDetails.size}</div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {item.articleDetails?.numberOfCartons || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {item.trackingNumber || 'N/A'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Modal - Full Screen */}
                    <div className="lg:hidden bg-white w-full h-full overflow-hidden flex flex-col">
                        {/* Mobile Header with Close Button on Top */}
                        <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Shipment Details</h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Mobile Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {/* Mobile Shipment Info */}
                            <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-medium text-gray-900 capitalize mb-2 text-sm sm:text-base">
                                    {selectedShipment.distributorName}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600">
                                    {new Date(selectedShipment.shippedAt).toLocaleDateString("en-GB")}
                                </p>
                            </div>

                            {/* Mobile Summary Cards */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <h3 className="text-xs font-medium text-blue-800">Total Items</h3>
                                    <p className="text-lg font-semibold text-blue-900">{selectedShipment.items?.length}</p>
                                </div>
                                <div className="bg-green-50 p-3 rounded-lg">
                                    <h3 className="text-xs font-medium text-green-800">Total Cartons</h3>
                                    <p className="text-lg font-semibold text-green-900">{selectedShipment.totalCartons}</p>
                                </div>
                            </div>

                            {/* Mobile Articles List */}
                            <div className="space-y-3 sm:space-y-4">
                                <h3 className="text-base sm:text-lg font-medium text-gray-900">Shipped Articles</h3>
                                {selectedShipment.items?.map((item, index) => (
                                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                                        <div className="flex items-start space-x-3">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 mb-1">
                                                    {item.articleName || 'N/A'}
                                                </h4>
                                                {item.articleDetails && (
                                                    <div className="space-y-1">
                                                        {item.articleDetails.color && (
                                                            <p className="text-xs text-gray-600">
                                                                <span className="font-medium">Color:</span> {item.articleDetails.color}
                                                            </p>
                                                        )}
                                                        {item.articleDetails.size && (
                                                            <p className="text-xs text-gray-600">
                                                                <span className="font-medium">Size:</span> {item.articleDetails.size}
                                                            </p>
                                                        )}
                                                        {item.articleDetails.numberOfCartons && (
                                                            <p className="text-xs text-gray-600">
                                                                <span className="font-medium">Cartons:</span> {item.articleDetails.numberOfCartons}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                {item.trackingNumber && (
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        <span className="font-medium">Tracking:</span> {item.trackingNumber}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PastOrdersPage;
