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

const handleDownloadPerforma = async (shipmentId) => {
    try {
        setDownloadingId(shipmentId);
        
        const response = await axios.get(
            `${baseURL}/api/v1/admin/shipments/performa/${shipmentId}`,
            {
                responseType: 'blob', // Important for PDF download
                withCredentials: true
            }
        );
        
        // Create a blob URL from the response
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `Performa_${shipmentId}.pdf`;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        Swal.fire({
            icon: 'success',
            title: 'Download Complete',
            text: 'PDF has been downloaded',
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
        <div className='bg-gray-50 min-h-screen p-6'>
            <div className='w-11/12 mx-auto'>
                {/* Header Card */}
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 mb-6'>
                    <div className='flex items-center justify-between p-6 border-b border-gray-200'>
                        <div>
                            <h3 className='text-xl font-semibold text-gray-900'>Past Shipments</h3>
                            <p className='text-sm text-gray-600 mt-1'>View and download shipment performas</p>
                        </div>
                        <div className='flex items-center gap-3'>
                            <div className='bg-blue-50 px-4 py-2 rounded-lg'>
                                <span className='text-blue-800 font-semibold text-sm'>
                                    {shipments.length} Total
                                </span>
                            </div>
                            <button
                                onClick={deleteOldShipments}
                                className='bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all text-sm font-medium'
                            >
                                🗑️ Cleanup
                            </button>
                        </div>
                    </div>

                    {/* Filters Section */}
                    <div className='p-6 border-b border-gray-200'>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
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
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="distributor">Distributor Name</option>
                            </select>
                        </div>

                        {/* Date Range Filter */}
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>From Date</label>
                                <input
                                    type="date"
                                    value={dateFilter.startDate}
                                    onChange={(e) => setDateFilter(prev => ({...prev, startDate: e.target.value}))}
                                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>To Date</label>
                                <input
                                    type="date"
                                    value={dateFilter.endDate}
                                    onChange={(e) => setDateFilter(prev => ({...prev, endDate: e.target.value}))}
                                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Shipments Table */}
                    <div className="p-6">
                        {isLoadingShipments ? (
                            <div className='flex w-full h-32 items-center justify-center'>
                                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
                            </div>
                        ) : (
                            <div className="max-h-96 overflow-y-auto">
                                {/* Table Headers */}
                                <div className="hidden md:grid md:grid-cols-5 gap-4 pb-3 mb-4 border-b border-gray-200">
                                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Distributor</h5>
                                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Shipped Date</h5>
                                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Cartons</h5>
                                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</h5>
                                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</h5>
                                </div>

                                {/* Data Rows */}
                                <div className="space-y-2">
                                    {sortedShipments.length > 0 ? (
                                        sortedShipments.map((shipment) => (
                                            <div key={shipment._id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 items-center hover:bg-gray-50 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200">
                                                <div className="font-semibold text-gray-900 capitalize">
                                                    {shipment.distributorName || 'Unknown'}
                                                </div>
                                                <div className="text-gray-700 font-medium">
                                                    {new Date(shipment.shippedAt).toLocaleDateString("en-GB")}
                                                </div>
                                                <div className="text-gray-600">
                                                    {shipment.totalCartons || 0} Cartons
                                                </div>
                                                <div>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Completed
                                                    </span>
                                                </div>
                                                <button
                                                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                                    onClick={() => setSelectedShipment(shipment)}
                                                >
                                                    View
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="text-4xl mb-4 opacity-50">📦</div>
                                            <p className="text-gray-500">No shipments found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal for Viewing Shipment Details */}
                {selectedShipment && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
                        <div className="bg-white w-full max-w-3xl mx-4 rounded-xl shadow-2xl border border-gray-200 transform transition-all">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
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

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Distributor</p>
                                        <p className="font-semibold text-gray-900">{selectedShipment.distributorName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Shipped Date</p>
                                        <p className="font-semibold text-gray-900">{new Date(selectedShipment.shippedAt).toLocaleDateString("en-GB")}</p>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <h3 className="text-lg font-semibold mb-3 text-gray-900">Articles ({selectedShipment.items?.length || 0})</h3>

                                    {/* Table Header */}
                                    <div className="grid grid-cols-5 bg-gray-50 text-gray-700 font-semibold text-sm p-3 rounded-t-lg border">
                                        <span>Article</span>
                                        <span className="text-center">Category</span>
                                        <span className="text-center">Sizes</span>
                                        <span className="text-center">Colors</span>
                                        <span className="text-center">Cartons</span>
                                    </div>

                                   {/* Article Items */}
                            <div className="border-l border-r border-b border-gray-200 rounded-b-lg overflow-hidden">
                                <div className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                                    {selectedShipment.items && selectedShipment.items.map((item, index) => (
                                        <div key={index} className="grid grid-cols-5 items-center p-3 bg-white hover:bg-gray-50">
                                            <span className="text-gray-800 text-sm font-medium capitalize">{item.articleName || 'N/A'}</span>
                                            <span className="text-gray-600 text-sm text-center capitalize">{item.productReference?.variantName || 'N/A'}</span>
                                            <span className="text-center">
                                                <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                                    {/* ✅ FIXED: Access sizes from articleDetails */}
                                                    {formatSizeRange(item.articleDetails?.sizes)}
                                                </span>
                                            </span>
                                            <span className="text-gray-600 text-xs text-center capitalize">
                                                {item.articleDetails?.colors?.join(', ') || 'N/A'}
                                            </span>
                                            {/* ✅ FIXED: Access totalCartons from articleDetails */}
                                            <span className="text-gray-800 text-sm font-semibold text-center">{selectedShipment.totalCartons || 0}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                                <button
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md font-medium"
                                    onClick={() => setSelectedShipment(null)}
                                >
                                    Close
                                </button>
                                <button
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    onClick={() => handleDownloadPerforma(selectedShipment._id)}
                                    disabled={downloadingId === selectedShipment._id}
                                >
                                    {downloadingId === selectedShipment._id ? 'Downloading...' : 'Download PDF'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PastOrdersPage;
