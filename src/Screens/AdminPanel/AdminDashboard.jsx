import {useState, useEffect } from 'react'
import Smallcard from '../../Components/AdminComponents/Smallcard'
import AddDialog from '../../Components/AdminComponents/AddDialog'
import axios from 'axios';
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";
import AddFestivleImageDialog from '../../Components/AdminComponents/AddFestivleImageDialog';
import { baseURL } from '../../Utils/URLS';
import AddProductsUsingExcel from '../../Components/AdminComponents/AddProductsUsingExcel';

const AdminDashboard = () => {
  const [products, setProducts] = useState(null);
  const [distributors, setDistributors] = useState(null);
  const [orders, setOrders] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [ordersStatus, setOrdersStatus] = useState({ pending: 0, completed: 0 });
  const [totalProducts, setTotalProducts] = useState(null)

  const getProducts = async () => {
    try {
      let response = await axios.get(
        `${baseURL}/api/v1/admin/products/getproducts`
      );
      setProducts(response.data.data);
      setTotalProducts(response.data.totalCount)
    } catch (error) {
      console.error(error.response?.data);
    }
  };

  const getDistributors = async () => {
    try {
      let response = await axios.get(`${baseURL}/api/v1/admin/distributor/get`, {withCredentials: true});
      setDistributors(response.data.data);
    } catch (error) {
      console.error(error)
    }
  }

  const getOrders = async () => {
    try {
      let response = await axios.get(`${baseURL}/api/v1/admin/products/orders`, {withCredentials: true});
      setOrders(response.data.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
  if (!orders) return; // Ensure orders exist before processing

  const updatedStatus = orders.reduce(
    (acc, order) => {
      if (!order?.isFulfiled) {
        acc.pending += 1;
      } else {
        acc.completed += 1;
      }
      return acc;
    },
    { pending: 0, completed: 0 }
  );

  setOrdersStatus(updatedStatus);
}, [orders]); // Runs only when `orders` updates

  useEffect(() => {
      getProducts();
      getDistributors();
      getOrders();
    }, []);    

const handleConfirmOrder = async (id) => {
    try {
      setIsLoading(true);
      setError("");

      let response = await axios.post(`${baseURL}/api/v1/admin/products/orders/confirm/${id}`);

      if(!response.data.result){
        setIsLoading(false);
        setError(response.data.message);
      }

      setIsLoading(false);

      Swal.fire({
                title: "Success!",
                text: "Order Confirmed!",
                icon: "success",
      });

      setOrdersStatus(prev => ({
      pending: prev.pending > 0 ? prev.pending - 1 : 0,
      completed: prev.completed + 1
      }));



      setSelectedOrder(null);
      getOrders();
      
    } catch (error) {
      console.error(error);
    }
};

const handleViewOrder = async (id) => {
  try {
    // Open the generated order performa PDF in the user's default browser
    window.open(`http://localhost:8080/api/v1/admin/orders/view-performa/${id}`, "_blank");
  } catch (error) {
    console.error("Error viewing order performa:", error);
  }
};
  return (
    <div className='bg-gray-50 min-h-screen'>
      {/* Enhanced Header */}
      <div className='w-full bg-white shadow-sm border-b border-gray-200 mb-8'>
        <div className='w-11/12 mx-auto py-6'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>Dashboard</h1>
        </div>
      </div>

      {/* Stats Grid - Keep existing functionality */}
      <div className='w-11/12 mx-auto mb-8'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <Smallcard name={"Total Articles"} quantity={totalProducts} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M4.00488 16V4H2.00488V2H5.00488C5.55717 2 6.00488 2.44772 6.00488 3V15H18.4433L20.4433 7H8.00488V5H21.7241C22.2764 5 22.7241 5.44772 22.7241 6C22.7241 6.08176 22.7141 6.16322 22.6942 6.24254L20.1942 16.2425C20.083 16.6877 19.683 17 19.2241 17H5.00488C4.4526 17 4.00488 16.5523 4.00488 16ZM6.00488 23C4.90031 23 4.00488 22.1046 4.00488 21C4.00488 19.8954 4.90031 19 6.00488 19C7.10945 19 8.00488 19.8954 8.00488 21C8.00488 22.1046 7.10945 23 6.00488 23ZM18.0049 23C16.9003 23 16.0049 22.1046 16.0049 21C16.0049 19.8954 16.9003 19 18.0049 19C19.1095 19 20.0049 19.8954 20.0049 21C20.0049 22.1046 19.1095 23 18.0049 23Z"></path></svg>} />
          
          <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center'>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className='text-gray-600'>
                  <path d="M12 1L21.5 6.5V17.5L12 23L2.5 17.5V6.5L12 1ZM5.49388 7.0777L13.0001 11.4234V20.11L19.5 16.3469V7.65311L12 3.311L5.49388 7.0777ZM4.5 8.81329V16.3469L11.0001 20.1101V12.5765L4.5 8.81329Z"></path>
                </svg>
              </div>
            </div>
            <div className='ml-2'>
          <span className='text-lg block mb-1 font-bold'>Orders</span>
    
            {/* Completed & Pending Orders */}
            <div className='flex flex-col md:flex-row text-gray-700 gap-x-2'>
              <span>Completed: <strong>{ordersStatus.completed}</strong></span>
              <span>Pending: <strong>{ordersStatus.pending}</strong></span>
            </div>
          </div>
            <div className='mt-3 w-full bg-gray-200 rounded-full h-1'>
              <div 
                className='bg-gray-600 h-1 rounded-full transition-all duration-300'
                style={{ width: `${ordersStatus.completed + ordersStatus.pending > 0 ? (ordersStatus.completed / (ordersStatus.completed + ordersStatus.pending)) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          
          <Smallcard name={"Total Distributors"} quantity={distributors?.length} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M2 22C2 17.5817 5.58172 14 10 14C14.4183 14 18 17.5817 18 22H16C16 18.6863 13.3137 16 10 16C6.68629 16 4 18.6863 4 22H2ZM10 13C6.685 13 4 10.315 4 7C4 3.685 6.685 1 10 1C13.315 1 16 3.685 16 7C16 10.315 13.315 13 10 13ZM10 11C12.21 11 14 9.21 14 7C14 4.79 12.21 3 10 3C7.79 3 6 4.79 6 7C6 9.21 7.79 11 10 11ZM18.2837 14.7028C21.0644 15.9561 23 18.752 23 22H21C21 19.564 19.5483 17.4671 17.4628 16.5271L18.2837 14.7028ZM17.5962 3.41321C19.5944 4.23703 21 6.20361 21 8.5C21 11.3702 18.8042 13.7252 16 13.9776V11.9646C17.6967 11.7222 19 10.264 19 8.5C19 7.11935 18.2016 5.92603 17.041 5.35635L17.5962 3.41321Z"></path></svg>} />
        </div>
      </div>

{/* Enhanced Action Buttons Section */}
<div className='w-11/12 mx-auto mb-8'>
  <h3 className='text-xl font-semibold text-gray-900 mb-4'>Quick Actions</h3>
  
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
    {/* Left Column - Action Buttons (3/4 width on large screens) */}
    <div className="lg:col-span-3">
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
        <AddDialog getProducts={getProducts} />
        <AddFestivleImageDialog />
      </div>
    </div>
  </div>
</div>

      {/* Recent Orders Section */}
      <div className='w-11/12 mx-auto'>
        <div className='bg-white rounded-xl shadow-sm border border-gray-200'>
          <div className='flex items-center justify-between p-6 border-b border-gray-200'>
            <h3 className='text-xl font-semibold text-gray-900'>Recent Orders</h3>
          </div>
          <div className="p-6">
            {
              !orders ? 
              <div className='flex w-full h-32 items-center justify-center'>
                <span className="loading loading-bars loading-lg"></span>
              </div>
              :
              <div className="max-h-96 overflow-y-auto">
                {/* Enhanced Table Headers */}
                <div className="hidden md:grid md:grid-cols-5 gap-4 pb-3 mb-4 border-b border-gray-200">
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bill No</h5>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Party Name</h5>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone No</h5>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</h5>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</h5>
                </div>

                {/* Enhanced Data Rows */}
                <div className="space-y-2">
                  {orders?.map((order, index) => (
                    !order.isFulfiled ? 
                    <div key={order._id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 items-center hover:bg-gray-50 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200">
                      <div className="font-semibold text-gray-900">#{order.billNo}</div>
                      <div className="text-gray-700 font-medium">{order.partyName}</div>
                      <div className="text-gray-600">{order.phoneNo}</div>
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </div>
                      <button
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5"
                        onClick={() => setSelectedOrder(order)}
                      >
                        View
                      </button>
                    </div>
                    : ""
                  ))}
                  
                  {/* Empty state */}
                  {orders?.every(order => order.isFulfiled) && (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4 opacity-50">📦</div>
                      <p className="text-gray-500">No pending orders</p>
                    </div>
                  )}
                </div>
              </div>
            }
          </div>

      {/* Enhanced Modal for Viewing Order Details */}
      {selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <div className="bg-white w-full max-w-lg mx-4 rounded-xl shadow-2xl border border-gray-200 transform transition-all">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                onClick={() => setSelectedOrder(null)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="text-gray-400">
                  <path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"></path>
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Bill No</p>
                  <p className="font-semibold text-gray-900">#{selectedOrder.billNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Order Date</p>
                  <p className="font-semibold text-gray-900">{new Date(selectedOrder.createdAt).toLocaleDateString("en-GB")}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Party Name</p>
                <p className="font-semibold text-gray-900">{selectedOrder.partyName}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                <p className="font-semibold text-gray-900">{selectedOrder.phoneNo}</p>
              </div>

              <div className="pt-2">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Items Ordered</h3>

                {/* Enhanced Table Header */}
                <div className="grid grid-cols-4 bg-gray-50 text-gray-700 font-semibold text-sm p-3 rounded-t-lg border">
                  <span className="text-center">Image</span>
                  <span>Article</span>
                  <span className="text-center">Size</span>
                  <span className="text-center">Cartons</span>
                </div>

                {/* Order Items */}
                <div className="border-l border-r border-b border-gray-200 rounded-b-lg overflow-hidden">
                  <div className="divide-y divide-gray-200 max-h-40 overflow-y-auto">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-4 items-center p-3 bg-white hover:bg-gray-50">
                        <div className="flex justify-center">
                          <img 
                            src={item.articleImg} 
                            alt={item.articleName} 
                            className="w-10 h-10 rounded-md object-cover border border-gray-200" 
                          />
                        </div>
                        <span className="text-gray-800 text-sm font-medium">{item.articleName}</span>
                        <span className="text-gray-600 text-sm text-center">{item.sizes}</span>
                        <span className="text-gray-800 text-sm font-semibold text-center">{item.totalCartons}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200 rounded-b-xl">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md font-medium"
                onClick={() => handleViewOrder(selectedOrder._id)}
              >
                Download PDF
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md font-medium"
                onClick={() => handleConfirmOrder(selectedOrder._id)}
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard