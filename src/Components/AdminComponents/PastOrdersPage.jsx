import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../../Utils/URLS";

const PastOrdersPage = () => {
    const [orders, setOrders] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    const getPastOrders = async () => {
        try {
            let response = await axios.get(`${baseURL}/api/v1/admin/products/orders`, {withCredentials: true})
            let orders = response.data.data;

            let filteredOrders = orders.filter((order)=> {
                return order.isFulfiled == true
            })

            setOrders(filteredOrders)
        } catch (error) {
            console.error(error)
        }
    }

    const handleViewOrder = async (id) => {
      try {
        // Open the generated order performa PDF in the user's default browser
        window.open(`${baseURL}/api/v1/admin/orders/view-performa/${id}`, "_blank");
      } catch (error) {
        console.error("Error viewing order performa:", error);
      }
    };

    // Filter and sort orders
    const filteredOrders = orders?.filter(order => 
        order.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phoneNo.includes(searchTerm)
    );

    const sortedOrders = filteredOrders?.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'oldest':
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'billNo':
                return a.billNo.localeCompare(b.billNo);
            case 'partyName':
                return a.partyName.localeCompare(b.partyName);
            default:
                return 0;
        }
    });

    useEffect(() => {
      getPastOrders()
    }, [])
    
    return (
        <div className='bg-gray-50 min-h-screen'>
            {/* Enhanced Header Section */}
            <div className='w-full bg-white shadow-sm border-b border-gray-200 mb-8'>
                <div className='w-11/12 mx-auto py-6'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h1 className='text-3xl font-bold text-gray-900 mb-2'>Past Orders</h1>
                            <p className='text-gray-600'>View and manage all completed orders</p>
                        </div>
                        <div className='flex items-center gap-4'>
                            <div className='bg-blue-50 px-4 py-2 rounded-lg'>
                                <span className='text-blue-800 font-semibold'>
                                    {orders?.length || 0} Total Orders
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Filters Section */}
            <div className='w-11/12 mx-auto mb-6'>
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
                    <div className='flex flex-col md:flex-row gap-4 items-center justify-between'>
                        <div className='flex-1 max-w-md'>
                            <div className='relative'>
                                <svg className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search by bill no, party name, or phone..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Orders Table */}
            <div className="w-11/12 mx-auto">
                <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
                    {!orders ? (
                        <div className='flex items-center justify-center py-20'>
                            <div className='text-center'>
                                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
                                <p className='text-gray-600'>Loading past orders...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Enhanced Desktop Table Header */}
                            <div className="hidden md:grid md:grid-cols-6 gap-4 p-6 bg-gray-50 border-b border-gray-200">
                                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bill No</h5>
                                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Party Name</h5>
                                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone No</h5>
                                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Status</h5>
                                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Dates</h5>
                                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</h5>
                            </div>

                            {/* Enhanced Orders List */}
                            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                                {sortedOrders?.length > 0 ? (
                                    sortedOrders.map((order, index) => (
                                        <div key={index} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                                            {/* Desktop View */}
                                            <div className="hidden md:grid md:grid-cols-6 gap-4 items-center">
                                                <div className="font-semibold text-gray-900">#{order.billNo}</div>
                                                <div className="text-gray-700 font-medium capitalize">{order.partyName}</div>
                                                <div className="text-gray-600">{order.phoneNo}</div>
                                                <div>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        {order.isFulfiled ? "Completed" : "Not Completed"}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    <div>
                                                        <span className="text-xs text-gray-500">Placed:</span>
                                                        <div className="font-medium">{new Date(order.createdAt).toLocaleDateString("en-GB")}</div>
                                                    </div>
                                                    <div className="mt-1">
                                                        <span className="text-xs text-gray-500">Confirmed:</span>
                                                        <div className="font-medium">{new Date(order.updatedAt).toLocaleDateString("en-GB")}</div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <button
                                                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                                                        onClick={() => handleViewOrder(order._id)}
                                                    >
                                                        View Order
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Mobile View */}
                                            <div className="md:hidden">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="font-semibold text-gray-900 text-lg">#{order.billNo}</div>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        {order.isFulfiled ? "Completed" : "Not Completed"}
                                                    </span>
                                                </div>
                                                <div className="space-y-2 mb-4">
                                                    <div>
                                                        <span className="text-sm text-gray-500">Party:</span>
                                                        <span className="ml-2 font-medium text-gray-900 capitalize">{order.partyName}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-gray-500">Phone:</span>
                                                        <span className="ml-2 font-medium text-gray-900">{order.phoneNo}</span>
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <div>
                                                            <span className="text-xs text-gray-500">Placed:</span>
                                                            <div className="text-sm font-medium">{new Date(order.createdAt).toLocaleDateString("en-GB")}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs text-gray-500">Confirmed:</span>
                                                            <div className="text-sm font-medium">{new Date(order.updatedAt).toLocaleDateString("en-GB")}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200 text-sm font-medium"
                                                    onClick={() => handleViewOrder(order._id)}
                                                >
                                                    View Order
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20">
                                        <div className="text-6xl mb-4 opacity-30">📦</div>
                                        <h3 className="text-xl font-medium text-gray-600 mb-2">No past orders found</h3>
                                        <p className="text-gray-500">
                                            {searchTerm ? 'Try adjusting your search criteria' : 'Completed orders will appear here'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PastOrdersPage;