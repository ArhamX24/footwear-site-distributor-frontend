import { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../../Utils/URLS";
import CircularProgress from "@mui/material/CircularProgress";

const PastOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    fetchPastOrders();
  }, []);

  const fetchPastOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${baseURL}/api/v1/distributor/orders/past`,
        { withCredentials: true }
      );
      
      if (response.data.result) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error("Error fetching past orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPerforma = (orderId) => {
    window.open(`${baseURL}/api/v1/distributor/orders/download-performa/${orderId}`, '_blank');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CircularProgress size={40} style={{ color: '#4F46E5' }} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Past Orders</h2>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No orders found</p>
          <p className="text-gray-400 text-sm mt-2">Your past orders will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
            >
              {/* Order Header */}
              <div
                className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-base md:text-lg font-semibold text-gray-800 capitalize">
                      Order
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 mt-1">
                      Date: {formatDate(order.orderDate)}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600">
                      Items: {order.items.length}
                    </p>
                    {order.transportSource && (
                      <p className="text-xs md:text-sm text-gray-600">
                        Transport: <span className="font-medium">{order.transportSource}</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        order.isFulfiled
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {order.isFulfiled ? 'Fulfilled' : 'Pending'}
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPerforma(order._id);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 text-xs md:text-sm font-medium flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download
                    </button>
                  </div>
                </div>

                {/* Expand/Collapse Icon */}
                <div className="flex justify-center mt-2">
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      expandedOrder === order._id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Order Items (Expandable) */}
              {expandedOrder === order._id && (
                <div className="p-4 border-t border-gray-200 bg-white">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Order Items</h4>
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <img
                          src={item.articleImg}
                          alt={item.articleName}
                          className="w-16 h-16 object-cover rounded-md border"
                        />
                        <div className="flex-1">
                          <h5 className="text-sm font-medium capitalize text-gray-800">
                            {item.articleName}
                          </h5>
                          <p className="text-xs text-gray-600 capitalize">
                            {item.variant} - {item.segment}
                          </p>
                          <p className="text-xs text-gray-600">
                            Cartons: <span className="font-medium">{item.totalCartons}</span>
                          </p>
                          <p className="text-xs text-gray-600 capitalize">
                            Colors: <span className="font-medium">{item.colors.join(", ")}</span>
                          </p>
                          <p className="text-xs text-gray-600">
                            Sizes: <span className="font-medium">{item.sizes}</span>
                          </p>
                          {item.dealReward && (
                            <p className="text-xs text-green-600 font-medium mt-1">
                              🎁 Reward: {item.dealReward}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PastOrders;
