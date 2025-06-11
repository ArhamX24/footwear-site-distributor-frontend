import React, { useContext, useState, useEffect } from 'react'
import Smallcard from '../../Components/AdminComponents/Smallcard'
import AddDialog from '../../Components/AdminComponents/AddDialog'
import AddDealDialog from '../../Components/AdminComponents/AddDealDialog';
import AddDistributorDialog from '../../Components/AdminComponents/AddDistributorDialog';
import axios from 'axios';
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";
import AddFestivleImageDialog from '../../Components/AdminComponents/AddFestivleImageDialog';
import { baseURL } from '../../Utils/URLS';

const AdminDashboard = () => {
  const [products, setProducts] = useState(null);
  const [distributors, setDistributors] = useState(null);
  const [orders, setOrders] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewOrderModal, setViewOrderModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [ordersStatus, setOrdersStatus] = useState({ pending: 0, completed: 0 });

  const getProducts = async () => {
    try {
      let response = await axios.get(
        `https://${baseURL}/api/v1/admin/products/getproducts`
      );
      setProducts(response.data.data);
    } catch (error) {
      console.error(error.response?.data);
    }
  };

  const getDistributors = async () => {
    try {
      let response = await axios.get(`https://${baseURL}/api/v1/admin/distributor/get`, {withCredentials: true});
      setDistributors(response.data.data);
    } catch (error) {
      console.error(error)
    }
  }

  const getOrders = async () => {
    try {
      let response = await axios.get(`https://${baseURL}/api/v1/admin/products/orders`, {withCredentials: true});
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

      let response = await axios.post(`http://localhost:8080/api/v1/admin/products/orders/confirm/${id}`);

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
      console.error(error.response.data);
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
    <div>
      <div className='w-11/12 mx-auto flex flex-wrap justify-around '>
        <Smallcard name={"Articles"} quantity={products?.length} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M4.00488 16V4H2.00488V2H5.00488C5.55717 2 6.00488 2.44772 6.00488 3V15H18.4433L20.4433 7H8.00488V5H21.7241C22.2764 5 22.7241 5.44772 22.7241 6C22.7241 6.08176 22.7141 6.16322 22.6942 6.24254L20.1942 16.2425C20.083 16.6877 19.683 17 19.2241 17H5.00488C4.4526 17 4.00488 16.5523 4.00488 16ZM6.00488 23C4.90031 23 4.00488 22.1046 4.00488 21C4.00488 19.8954 4.90031 19 6.00488 19C7.10945 19 8.00488 19.8954 8.00488 21C8.00488 22.1046 7.10945 23 6.00488 23ZM18.0049 23C16.9003 23 16.0049 22.1046 16.0049 21C16.0049 19.8954 16.9003 19 18.0049 19C19.1095 19 20.0049 19.8954 20.0049 21C20.0049 22.1046 19.1095 23 18.0049 23Z"></path></svg>} />
        <div className='md:w-72 w-full mx-auto md:mx-0 md:ml-4 md:h-48 h-32 bg-gray-200 rounded-2xl mt-3 lg:mt-0 flex items-center'>
      <div className='w-11/12 md:px-2 px-1 py-2 md:py-4 mx-auto rounded-2xl flex items-center md:block'>
  {/* Icon Container */}
  <div className='bg-gray-100 rounded-3xl p-3 block w-fit md:mb-8'>
    <span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
        <path d="M12 1L21.5 6.5V17.5L12 23L2.5 17.5V6.5L12 1ZM5.49388 7.0777L13.0001 11.4234V20.11L19.5 16.3469V7.65311L12 3.311L5.49388 7.0777ZM4.5 8.81329V16.3469L11.0001 20.1101V12.5765L4.5 8.81329Z"></path>
      </svg>
    </span>
  </div>

  {/* Order Details Container */}
  <div className='ml-2'>
    <span className='text-lg block mb-1 font-bold'>Orders</span>
    
    {/* Completed & Pending Orders */}
    <div className='flex flex-col md:flex-row text-gray-700 gap-x-2'>
      <span >Completed: <strong>{ordersStatus.completed}</strong></span>
      <span >Pending: <strong>{ordersStatus.pending}</strong></span>
    </div>
  </div>
</div>
    </div>
        <Smallcard name={"Distributors"} quantity={distributors?.length} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M2 22C2 17.5817 5.58172 14 10 14C14.4183 14 18 17.5817 18 22H16C16 18.6863 13.3137 16 10 16C6.68629 16 4 18.6863 4 22H2ZM10 13C6.685 13 4 10.315 4 7C4 3.685 6.685 1 10 1C13.315 1 16 3.685 16 7C16 10.315 13.315 13 10 13ZM10 11C12.21 11 14 9.21 14 7C14 4.79 12.21 3 10 3C7.79 3 6 4.79 6 7C6 9.21 7.79 11 10 11ZM18.2837 14.7028C21.0644 15.9561 23 18.752 23 22H21C21 19.564 19.5483 17.4671 17.4628 16.5271L18.2837 14.7028ZM17.5962 3.41321C19.5944 4.23703 21 6.20361 21 8.5C21 11.3702 18.8042 13.7252 16 13.9776V11.9646C17.6967 11.7222 19 10.264 19 8.5C19 7.11935 18.2016 5.92603 17.041 5.35635L17.5962 3.41321Z"></path></svg>} />
        </div>
        <div className='w-11/12 mx-auto flex items-center justify-around flex-wrap mt-5'>
        <AddDialog getProducts={getProducts}/>
        <AddDealDialog products={products}/>
        <AddDistributorDialog/>
        <AddFestivleImageDialog/>
        </div>
        <div className='w-4/5 mx-auto border my-8'></div>
        <h1 className='text-xl text-center mb-2'>Recent Orders</h1>
        <div className="w-11/12 mx-auto">
        {
          !orders ? <div className='flex w-full h-4/5 items-center justify-center'><span className="loading loading-bars loading-lg"></span></div>
          :
          <div className="w-11/12 mx-auto bg-gray-200 max-h-96 overflow-y-auto rounded-lg shadow-md p-5">
      {/* Table Headers */}
      <div className="hidden md:grid md:grid-cols-5 gap-4 border-b border-gray-300 pb-2">
        <h5 className="font-bold text-gray-800 text-left">Bill No</h5>
        <h5 className="font-bold text-gray-800 text-left">Party Name</h5>
        <h5 className="font-bold text-gray-800 text-left">Phone No</h5>
        <h5 className="font-bold text-gray-800 text-left"></h5>
      </div>

      {/* Data Rows */}
      <div className="divide-y divide-gray-500">
        {orders?.map((order, index) => (
          !order.isFulfiled ? 
          <div key={order._id} className="grid grid-cols-1 md:grid-cols-5 gap-4 py-4 items-center">
            <h5 className="text-gray-900 font-medium">{order.billNo}</h5>
            <h5 className="text-gray-900 font-medium">{order.partyName}</h5>
            <h5 className="text-gray-900 font-medium">{order.phoneNo}</h5>
            <button
              className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 transition-all duration-200 text-sm"
              onClick={() => setSelectedOrder(order)}
            >
              View
            </button>
          </div>
          : ""
        ))}
      </div>

      {/* Modal for Viewing Order Details */}
      {selectedOrder && (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-800/50 z-50">
    <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Order Details</h2>
        <span
          className="p-1 bg-gray-100 rounded-full cursor-pointer border"
          onClick={() => setSelectedOrder(null)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"></path>
          </svg>
        </span>
      </div>

      <p><strong>Bill No:</strong> {selectedOrder.billNo}</p>
      <p><strong>Party Name:</strong> {selectedOrder.partyName}</p>
      <p><strong>Phone No:</strong> {selectedOrder.phoneNo}</p>
      <p><strong>Order Placed On:</strong> {new Date(selectedOrder.createdAt).toLocaleDateString("en-GB")}</p>

<div className="mt-4">
  <h3 className="text-md font-semibold mb-2">Items Ordered</h3>

  {/* Table Header */}
  <div className="grid grid-cols-4 bg-gray-200 text-gray-700 font-bold text-sm p-3 rounded-t-md text-center">
    <span>Image</span>
    <span>Article Name</span>
    <span>Size</span>
    <span>Total C/s</span>
  </div>

  {/* Order Items - With Max Height & Scroll */}
  <div className="divide-y divide-gray-300 border border-gray-300 rounded-b-md overflow-y-auto max-h-[140px]">
    {selectedOrder.items.map((item, index) => (
      <div key={index} className="grid grid-cols-4 items-center p-3 bg-white text-center">
        <div className="flex justify-center">
          <img src={item.articleImg} alt={item.articleName} className="w-12 h-12 rounded-md object-cover" />
        </div>
        <span className="text-gray-800 text-sm">{item.articleName}</span>
        <span className="text-gray-800 text-sm">{item.sizes}</span>
        <span className="text-gray-800 text-sm">{item.totalCartons}</span>
      </div>
    ))}
  </div>
</div>

      {/* Error Message */}
      <div className="text-sm text-center text-red-500 mt-2">{error ? error : ""}</div>

      {/* Action Buttons */}
      <div className="flex justify-end mt-4">
        <button
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-all duration-300 cursor-pointer"
          onClick={() => handleViewOrder(selectedOrder._id)}
        >
          Download Order Performa
        </button>

        <button
          className="px-4 py-2 bg-gray-200 border border-black text-black rounded-md hover:bg-gray-300 transition-all duration-300 ml-2 cursor-pointer"
          onClick={() => handleConfirmOrder(selectedOrder._id)}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}
          </div>
        }
</div>
    </div>
  )
}

export default AdminDashboard

