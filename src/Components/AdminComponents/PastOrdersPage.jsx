import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../../Utils/URLS";
import Swal from 'sweetalert2';

const PastOrdersPage = () => {
    const [shipments, setShipments] = useState([]);
    const [distributors, setDistributors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [distributorFilter, setDistributorFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState({
        startDate: '',
        endDate: ''
    });
    const [isLoadingShipments, setIsLoadingShipments] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);
    const [selectedShipment, setSelectedShipment] = useState(null);

    // ✅ Format sizes as range (3,4,5,6,7 -> 3X7)
    const formatSizeRange = (sizes) => {
        if (!sizes || !Array.isArray(sizes) || sizes.length === 0) return 'N/A';
        if (sizes.length === 1) return sizes[0].toString();
        
        const sortedSizes = [...sizes].sort((a, b) => a - b);
        return `${sortedSizes[0]}X${sortedSizes[sortedSizes.length - 1]}`;
    };

    const getShipments = async () => {
        try {
            setIsLoadingShipments(true);
            
            const params = new URLSearchParams();
            if (distributorFilter !== 'all') params.append('distributorId', distributorFilter);
            if (dateFilter.startDate) params.append('startDate', dateFilter.startDate);
            if (dateFilter.endDate) params.append('endDate', dateFilter.endDate);

            const response = await axios.get(`${baseURL}/api/v1/admin/shipments?${params}`, {
                withCredentials: true
            });
            
            if (response.data && response.data.result) {
                setShipments(response.data.data.shipments || []);
            } else {
                Swal.fire('Error', 'Invalid response from server', 'error');
            }
        } catch (error) {
            console.error('Error fetching shipments:', error);
            let errorMessage = 'Failed to fetch shipments';
            
            if (error.response) {
                errorMessage = error.response.data?.message || `Server Error: ${error.response.status}`;
            } else if (error.request) {
                errorMessage = 'Network error - please check your connection';
            }
            
            Swal.fire('Error', errorMessage, 'error');
            setShipments([]);
        } finally {
            setIsLoadingShipments(false);
        }
    };

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

    // ✅ Download Performa PDF
    const handleDownloadPerforma = async (shipmentId) => {
        try {
            setDownloadingId(shipmentId);
            
            window.open(`${baseURL}/api/v1/admin/shipments/performa/${shipmentId}`, "_blank");
            
            Swal.fire({
                icon: 'success',
                title: 'Downloading Performa',
                text: 'PDF is being downloaded',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Error downloading performa:", error);
            Swal.fire('Error', 'Failed to download performa', 'error');
        } finally {
            setTimeout(() => setDownloadingId(null), 1000);
        }
    };

    const deleteOldShipments = async () => {
        try {
            const result = await Swal.fire({
                title: 'Delete Old Shipments?',
                text: 'This will permanently delete shipment records older than 30 days. This action cannot be undone.',
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
                getShipments();
            }
        } catch (error) {
            console.error('Error deleting shipments:', error);
            Swal.fire('Error', 'Failed to delete old shipments', 'error');
        }
    };

    // Filter and sort shipments
    const filteredShipments = shipments.filter(shipment => {
        const matchesSearch = shipment.distributorName?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesDate = !dateFilter.startDate || !dateFilter.endDate || 
                          (new Date(shipment.shippedAt) >= new Date(dateFilter.startDate) &&
                           new Date(shipment.shippedAt) <= new Date(dateFilter.endDate));
        
        return matchesSearch && matchesDate;
    });

    const sortedShipments = [...filteredShipments].sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.shippedAt) - new Date(a.shippedAt);
            case 'oldest':
                return new Date(a.shippedAt) - new Date(b.shippedAt);
            case 'distributor':
                return (a.distributorName || '').localeCompare(b.distributorName || '');
            default:
                return 0;
        }
    });

    useEffect(() => {
        getShipments();
        getDistributors();
    }, [distributorFilter]);

    useEffect(() => {
        if (dateFilter.startDate && dateFilter.endDate) {
            getShipments();
        }
    }, [dateFilter]);

    return (
        <div className='bg-gray-50 min-h-screen'>
            {/* Header Section */}
            <div className='w-full bg-white shadow-sm border-b border-gray-200 mb-4 sm:mb-8'>
                <div className='w-11/12 mx-auto py-4 sm:py-6'>
                    <div className='flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
                        <div>
                            <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2'>Past Shipments</h1>
                            <p className='text-sm sm:text-base text-gray-600'>View and download shipment performas</p>
                        </div>
                        <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4'>
                            <div className='bg-blue-50 px-3 sm:px-4 py-2 rounded-lg text-center'>
                                <span className='text-blue-800 font-semibold text-sm sm:text-base'>
                                    {shipments.length} Total Shipments
                                </span>
                            </div>
                            <button
                                onClick={deleteOldShipments}
                                className='bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 transition-all text-sm font-medium'
                            >
                                🗑️ Cleanup Old Records
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className='w-11/12 mx-auto mb-4 sm:mb-6'>
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4'>
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

                        {/* Distributor Filter */}
                        <select
                            value={distributorFilter}
                            onChange={(e) => setDistributorFilter(e.target.value)}
                            className="px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Distributors</option>
                            {distributors.map(distributor => (
                                <option key={distributor._id} value={distributor._id}>
                                    {distributor.distributorDetails?.partyName || distributor.name}
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

            {/* Shipments Table */}
            <div className="w-11/12 mx-auto">
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
                    {isLoadingShipments ? (
                        <div className='flex items-center justify-center py-16 sm:py-20'>
                            <div className='text-center'>
                                <div className='animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
                                <p className='text-gray-600 text-sm sm:text-base'>Loading shipments...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* ✅ UPDATED: Desktop Table Header - 4 columns */}
                            <div className="hidden lg:grid lg:grid-cols-4 gap-4 p-4 sm:p-6 bg-gray-50 border-b border-gray-200">
                                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Distributor Name</h5>
                                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Date</h5>
                                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</h5>
                                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</h5>
                            </div>

                            {/* Shipments List */}
                            <div className="divide-y divide-gray-200 max-h-80 sm:max-h-96 overflow-y-auto">
                                {sortedShipments.length > 0 ? (
                                    sortedShipments.map((shipment, index) => (
                                        <div key={index} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-200">
                                            {/* ✅ UPDATED: Desktop View - 4 columns */}
                                            <div className="hidden lg:grid lg:grid-cols-4 gap-4 items-center">
                                                <div className="text-gray-700 font-medium capitalize text-sm">
                                                    {shipment.distributorName || 'Unknown'}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {new Date(shipment.shippedAt).toLocaleDateString("en-GB")}
                                                </div>
                                                <div>
                                                    {/* ✅ HARDCODED: Status as "COMPLETED" */}
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        COMPLETED
                                                    </span>
                                                </div>
                                                <div>
                                                    {/* ✅ UPDATED: Only View button */}
                                                    <button
                                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 text-xs font-medium"
                                                        onClick={() => setSelectedShipment(shipment)}
                                                    >
                                                        👁️ View
                                                    </button>
                                                </div>
                                            </div>

                                            {/* ✅ UPDATED: Mobile View */}
                                            <div className="lg:hidden">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-gray-900 capitalize text-sm sm:text-base mb-1">
                                                            {shipment.distributorName || 'Unknown'}
                                                        </div>
                                                        <div className="text-xs sm:text-sm text-gray-500 mt-1">
                                                            {new Date(shipment.shippedAt).toLocaleDateString("en-GB")}
                                                        </div>
                                                        <div className="mt-2">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                COMPLETED
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 text-xs font-medium"
                                                    onClick={() => setSelectedShipment(shipment)}
                                                >
                                                    👁️ View Details
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

            {/* ✅ UPDATED: MODAL FOR VIEWING SHIPMENT DETAILS */}
            {selectedShipment && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
                    <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl border border-gray-200 transform transition-all max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-semibold text-gray-900">Shipment Details</h2>
                            <button
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                                onClick={() => setSelectedShipment(null)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="text-gray-400">
                                    <path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"></path>
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            {/* ✅ Distributor Information */}
                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Distributor Information</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Distributor Name</p>
                                        <p className="font-semibold text-gray-900">{selectedShipment.distributorName || 'Unknown'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                                        <p className="font-semibold text-gray-900">{selectedShipment.distributorPhone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">City</p>
                                        <p className="font-semibold text-gray-900">{selectedShipment.distributorCity || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Order Date</p>
                                        <p className="font-semibold text-gray-900">{new Date(selectedShipment.shippedAt).toLocaleDateString("en-GB")}</p>
                                    </div>
                                </div>
                            </div>

                            {/* ✅ Articles Grid */}
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Articles ({selectedShipment.items?.length || 0})</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* ✅ UPDATED: COMPACT & RESPONSIVE MODAL */}
{selectedShipment && (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-2 sm:p-4">
        <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl border border-gray-200 transform transition-all max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Modal Header - Compact */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Shipment Details</h2>
                <button
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-200"
                    onClick={() => setSelectedShipment(null)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-gray-400">
                        <path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"></path>
                    </svg>
                </button>
            </div>

            {/* Modal Body - Compact */}
            <div className="p-3 sm:p-4">
                {/* ✅ Distributor Information - Compact Grid */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">Distributor Information</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-xs text-gray-500 mb-0.5">Distributor</p>
                            <p className="text-sm font-semibold text-gray-900 truncate">{selectedShipment.distributorName || 'Unknown'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                            <p className="text-sm font-semibold text-gray-900">{selectedShipment.distributorPhone || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-0.5">City</p>
                            <p className="text-sm font-semibold text-gray-900 truncate">{selectedShipment.distributorCity || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-0.5">Order Date</p>
                            <p className="text-sm font-semibold text-gray-900">{new Date(selectedShipment.shippedAt).toLocaleDateString("en-GB")}</p>
                        </div>
                    </div>
                </div>

                {/* ✅ Articles Grid - More Compact */}
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">
                    Articles ({selectedShipment.items?.length || 0})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedShipment.items && selectedShipment.items.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                            {/* Article Image - Smaller */}
                            <div className="mb-3">
                                {item.articleImage ? (
                                    <img 
                                        src={item.articleImage} 
                                        alt={item.articleName} 
                                        className="w-full h-32 sm:h-36 object-cover rounded-lg border border-gray-200"
                                    />
                                ) : (
                                    <div className="w-full h-32 sm:h-36 bg-gray-200 rounded-lg flex items-center justify-center">
                                        <span className="text-gray-400 text-xs">No Image</span>
                                    </div>
                                )}
                            </div>

                            {/* Article Details - Compact Spacing */}
                            <div className="space-y-2">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-0.5 font-semibold">Article</p>
                                    <p className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-1">{item.articleName}</p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-0.5 font-semibold">Sizes</p>
                                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                        {formatSizeRange(item.articleDetails?.sizes)}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-0.5 font-semibold">Colors</p>
                                    <div className="flex flex-wrap gap-1">
                                        {item.articleDetails?.colors && item.articleDetails.colors.length > 0 ? (
                                            item.articleDetails.colors.map((color, cIdx) => (
                                                <span key={cIdx} className="inline-block bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-medium capitalize">
                                                    {color}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-gray-500 text-xs">No colors</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ✅ Modal Footer - Compact */}
            <div className="flex justify-end gap-2 p-3 sm:p-4 bg-gray-50 border-t border-gray-200 sticky bottom-0">
                <button
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 text-xs sm:text-sm font-medium"
                    onClick={() => setSelectedShipment(null)}
                >
                    Close
                </button>
                <button
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 text-xs sm:text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1.5"
                    onClick={() => handleDownloadPerforma(selectedShipment._id)}
                    disabled={downloadingId === selectedShipment._id}
                >
                    {downloadingId === selectedShipment._id ? (
                        <>
                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                            <span className="hidden sm:inline">Downloading...</span>
                            <span className="sm:hidden">...</span>
                        </>
                    ) : (
                        <>
                            <span>📥</span>
                            <span className="hidden sm:inline">Download Performa</span>
                            <span className="sm:hidden">Download</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    </div>
)}

                            </div>
                        </div>

                        {/* ✅ Modal Footer with Download Button */}
                        <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200 sticky bottom-0">
                            <button
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 text-sm font-medium"
                                onClick={() => setSelectedShipment(null)}
                            >
                                Close
                            </button>
                            <button
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                                onClick={() => handleDownloadPerforma(selectedShipment._id)}
                                disabled={downloadingId === selectedShipment._id}
                            >
                                {downloadingId === selectedShipment._id ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Downloading...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>📥</span>
                                        <span>Download Performa</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PastOrdersPage;
