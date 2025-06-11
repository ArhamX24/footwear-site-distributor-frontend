import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../../Utils/URLS";

const PastOrdersPage = () => {
    const [orders, setOrders] = useState(null)

    const getPastOrders = async () => {
        try {
            let response = await axios.get(`https://${baseURL}/api/v1/admin/products/orders`, {withCredentials: true})
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
        window.open(`https://${baseURL}/api/v1/admin/orders/view-performa/${id}`, "_blank");
      } catch (error) {
        console.error("Error viewing order performa:", error);
      }
    };

    useEffect(() => {
      getPastOrders()
    }, [])
    

  return (
    <div className="w-11/12 mx-auto bg-gray-100 rounded-lg shadow-md p-5">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Past Orders</h2>
      {
        !orders ? <div className='flex w-full h-4/5 items-center justify-center'><span className="loading loading-bars loading-lg"></span></div>
        :
      <div className="max-h-96 overflow-y-auto">
      <div className="hidden md:grid md:grid-cols-7 gap-4 border-b border-gray-300 pb-2">
        <h5 className="font-bold text-gray-800 text-left">Bill No</h5>
        <h5 className="font-bold text-gray-800 text-left">Party Name</h5>
        <h5 className="font-bold text-gray-800 text-left">Phone No</h5>
        <h5 className="font-bold text-gray-800 text-left">Order Status</h5>
        <h5 className="font-bold text-gray-800 text-left">Order Dates</h5>
      </div>

<div className="divide-y divide-gray-600">
        {orders?.map((order, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-7 gap-4 py-4">
            <h5 className="text-gray-900 font-medium">{order.billNo}</h5>
            <h5 className="text-gray-900 font-medium capitalize">{order.partyName}</h5>
            <h5 className="text-gray-900 font-medium">{order.phoneNo}</h5>
            <h5 className="text-gray-900 font-medium">{order.isFulfiled ? "Completed" : "Not Completed"}</h5>
            <h5 className="text-gray-900 font-medium">
              Placed: {new Date(order.createdAt).toLocaleDateString("en-GB")} <br />
              Confirmed: {new Date(order.updatedAt).toLocaleDateString("en-GB")}
            </h5>
            <button
                            className="px-4 py-2 flex items-center justify-center h-10 md:h-14 lg:h-10 bg-gray-200 border border-black text-black rounded-md hover:bg-gray-300 transition-all duration-300 cursor-pointer"
                            onClick={() => handleViewOrder(order._id)}
                          >
                            View Order
                          </button>
          </div>
        ))}
      </div>
      </div>
        }
      </div>
  );
};

export default PastOrdersPage;