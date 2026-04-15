import {useState, useEffect } from 'react'
import Smallcard from '../../Components/AdminComponents/Smallcard'
import AddDialog from '../../Components/AdminComponents/AddDialog'
import axios from 'axios';
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";
import AddFestivleImageDialog from '../../Components/AdminComponents/AddFestivleImageDialog';
import { baseURL } from '../../Utils/URLS';
import AddProductsUsingExcel from '../../Components/AdminComponents/AddProductsUsingExcel';

const OrderRow = ({ order, onView }) => (
  <div className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors gap-4">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 truncate">{order.partyName}</p>
      <p className="text-xs text-gray-400 mt-0.5">
        {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        &nbsp;&middot;&nbsp;{order.items.length} item{order.items.length > 1 ? 's' : ''}
      </p>
    </div>
    <span className="hidden sm:block text-sm text-gray-500">{order.phoneNo}</span>
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${order.isFulfiled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
      {order.isFulfiled ? 'Completed' : 'Pending'}
    </span>
    <button
      onClick={onView}
      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition font-medium whitespace-nowrap"
    >
      View
    </button>
  </div>
);

const AdminDashboard = () => {
  const [products, setProducts] = useState(null);
  const [distributors, setDistributors] = useState(null);
  const [orders, setOrders] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [ordersStatus, setOrdersStatus] = useState({ pending: 0, completed: 0 });
  const [totalProducts, setTotalProducts] = useState(null)

  const [sortMode, setSortMode] = useState('recent');

  const getSortedOrders = () => {
    if (!orders) return [];
    let list = sortMode === 'pending' ? orders.filter(o => !o.isFulfiled) : [...orders];
    return list.sort((a, b) =>
      sortMode === 'oldest'
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt)
    );
  };

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

    console.log('🔍 Frontend confirming order:', id); // ✅ DEBUG

    // ✅ FIXED: Use PUT instead of POST
    let response = await axios.put(  // ← CHANGED FROM POST
      `${baseURL}/api/v1/admin/products/orders/confirm/${id}`,
      {}, // Empty body for PUT
      { withCredentials: true }
    );

    console.log('🔍 Response:', response.data); // ✅ DEBUG

    if(!response.data.result){
      setIsLoading(false);
      setError(response.data.message);
      
      return;
    }

    setIsLoading(false);

    Swal.fire({
      title: "Success!",
      text: "Order Confirmed!",
      icon: "success",
    });

    // Refresh data
    setSelectedOrder(null)
    getOrders();
    
  } catch (error) {
    console.error('❌ Frontend confirm error:', error.response?.data);
    setIsLoading(false);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error?.response?.data?.message || "Failed to confirm order",
    });
  }
};


const handleViewOrder = async (id) => {
  try {
    // Open the generated order performa PDF in the user's default browser
    window.open(`${baseURL}/api/v1/admin/orders/view-performa/${id}`, "_blank");
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
        <AddProductsUsingExcel/>
        <AddFestivleImageDialog />
      </div>
    </div>
  </div>
</div>

      {/* Recent Orders Section */}
      {/* Recent Orders Section */}
<div className='w-11/12 mx-auto'>
  <div className='bg-white rounded-xl shadow-sm border border-gray-200'>
    
    {/* Header + Sort Controls */}
    <div className='flex items-center justify-between p-6 border-b border-gray-200 flex-wrap gap-3'>
      <h3 className='text-xl font-semibold text-gray-900'>Recent orders</h3>
      <div className='flex items-center gap-2 flex-wrap'>
        {['recent', 'oldest'].map(mode => (
          <button
            key={mode}
            onClick={() => setSortMode(mode)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
              sortMode === mode
                ? 'bg-gray-100 border-gray-400 text-gray-800'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {mode === 'recent' ? 'Newest first' : mode === 'oldest' ? 'Oldest first' : mode === 'pending' ? 'Pending only' : 'All orders'}
          </button>
        ))}
      </div>
    </div>

    <div className="p-0">
      {!orders ? (
        <div className='flex w-full h-32 items-center justify-center'>
          <span className="loading loading-bars loading-lg"></span>
        </div>
      ) : (
        <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">

          {/* Pending group */}
          {getSortedOrders().filter(o => !o.isFulfiled).length > 0 && (
            <>
              <div className='px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50'>
                Pending
              </div>
              {getSortedOrders().filter(o => !o.isFulfiled).map(order => (
                <OrderRow key={order._id} order={order} onView={() => setSelectedOrder(order)} />
              ))}
            </>
          )}


          {getSortedOrders().length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm">No orders found</div>
          )}
        </div>
      )}
    </div>
  </div>
</div>

      {selectedOrder && (
  <div
    className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4"
    onClick={(e) => e.target === e.currentTarget && setSelectedOrder(null)}
  >
    <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-gray-200 max-h-[90vh] flex flex-col">
      
      {/* Modal Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
        <h2 className="text-base font-semibold text-gray-900">{selectedOrder.partyName}</h2>
        <button
          onClick={() => setSelectedOrder(null)}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-100 transition text-sm"
        >
          ✕
        </button>
      </div>

      {/* Modal Body */}
      <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
        
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Order date', value: new Date(selectedOrder.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
            { label: 'Status', value: selectedOrder.isFulfiled ? '✅ Completed' : '⏳ Pending' },
            { label: 'Phone', value: selectedOrder.phoneNo },
            { label: 'Transport', value: selectedOrder.transportSource || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
              <p className="text-sm font-medium text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        <hr className="border-gray-100" />

        {/* Items Table */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Items ordered</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs text-gray-400 font-medium pb-2 w-9"></th>
                <th className="text-left text-xs text-gray-400 font-medium pb-2">Article</th>
                <th className="text-left text-xs text-gray-400 font-medium pb-2">Sizes</th>
                <th className="text-right text-xs text-gray-400 font-medium pb-2">Cartons</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {selectedOrder.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-3 pr-2">
                    <img src={item.articleImg} alt={item.articleName} className="w-8 h-8 rounded-md object-cover border border-gray-200" />
                  </td>
                  <td className="py-3">
                    <p className="font-medium text-gray-900">{item.articleName}</p>
                    <p className="text-xs text-gray-400">{item.colors?.join(', ')}</p>
                  </td>
                  <td className="py-3 text-gray-500">{item.sizes}</td>
                  <td className="py-3 text-right font-semibold text-gray-900">{item.totalCartons}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>
        )}
      </div>

      {/* Modal Footer */}
      <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl sticky bottom-0">
        <button
          onClick={() => handleViewOrder(selectedOrder._id)}
          className="text-sm px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
        >
          Download PDF
        </button>
        <button
          onClick={() => handleConfirmOrder(selectedOrder._id)}
          className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Confirm order
        </button>
      </div>
    </div>
  </div>
)}
        </div>
  )
}

export default AdminDashboard