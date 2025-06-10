import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import Swal from 'sweetalert2';
import CircularProgress from "@mui/material/CircularProgress";
import { clearCart } from '../../Slice/CartSlice';
import { baseURL } from '../../Utils/URLS';

const CartPage = () => {
  const cart = useSelector((Store) => Store.cart.items);
  const dispatch = useDispatch();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Opens the Order Confirmation modal.
  const handlePlaceOrderClick = () => {
    setShowConfirmModal(true);
  };

  // When the order is confirmed, send the data to the backend.
  const handleConfirmOrder = async () => {
    try {
      const orderData = {
        items: cart,
        orderDate: new Date().toISOString(),
      };
      setLoading(true)

      const response = await axios.post(`http://${baseURL}/api/v1/distributor/product/placeorder`, orderData, {withCredentials: true});

      if(response.data.result){
        setLoading(false)
        setShowConfirmModal(false);
        
        Swal.fire({
          title: 'Order placed successfully!',
          text: 'Your order has been placed successfully.',
          icon: 'success',
          confirmButtonText: 'Download Order Performa'
        }).then((result) => {
          if (result.isConfirmed) {
            // Open the download endpoint in a new window.
            window.open(`http://${baseURL}/api/v1/distributor/orders/download-performa/${response?.data.order._id}`, '_blank');
          }
        });
      }

      dispatch(clearCart());

    } catch (error) {
      setLoading(false)
      Swal.fire({
        title: 'Error',
        text: 'There was a problem placing your order. Please try again.',
        icon: 'error'
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Your Cart</h2>

      {cart?.length === 0 ? (
        <p className="text-gray-500 text-center">Your cart is empty.</p>
      ) : (
        <div className="space-y-4">
          {cart.map((item, index) => {
            const totalPrice = item.singlePrice * item.quantity;
            return (
              <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md">
                {/* Product Image */}
                <img
                  src={item.productImg}
                  alt={item.articlename || "Product Image"}
                  className="w-24 h-24 object-cover rounded-md border"
                />

                {/* Product Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 capitalize">
                    {item.articlename || "No Name Provided"}
                  </h3>
                  <p className="text-gray-600 capitalize">
                    {item.variants ? item.variants[0] : ""}
                  </p>
                  <p className="text-sm text-gray-600">
                    Cartons: <span className="font-medium">{item.quantity}</span>
                  </p>
                  <p className="text-sm text-gray-600 capitalize">
                    Colors: <span className="font-medium">{item.colors.join(", ")}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Size: <span className="font-medium">{item.sizes}</span>
                  </p>
                </div>

                {/* Price Section */}
                <div className="text-right">
                  <p className="text-gray-700 font-semibold">
                    ₹{item.singlePrice} / carton
                  </p>
                  <p className="text-gray-900 font-bold text-lg">
                    Total: ₹{totalPrice}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cart?.length > 0 && (
        <div 
          className="text-center bg-gray-300 cursor-pointer px-4 py-2 w-52 mx-auto rounded-md mt-3"
          onClick={handlePlaceOrderClick}
        >
          Place Order
        </div>
      )}

      {/* Render the Order Confirmation modal if needed */}
      {showConfirmModal && (
        <OrderConfirmationModal
          cart={cart}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmOrder}
          loading={loading}
        />
      )}
    </div>
  );
};
// Modal component to show order confirmation details
const OrderConfirmationModal = ({ cart, onClose, onConfirm , loading}) => {
  // Calculate total order price
  const calculateTotal = () =>
    cart.reduce((acc, item) => acc + item.singlePrice * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800/50 bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-11/12 md:w-2/3 lg:w-1/2">
        <h2 className="text-xl font-bold mb-4">Confirm Order</h2>

        <div className="max-h-64 overflow-y-auto mb-4">
          {cart.map((item, idx) => (
            <div 
              key={idx} 
              className="flex items-center justify-between border-b py-2"
            >
              <div>
                <h3 className="font-medium">{item.articlename || "No Name Provided"}</h3>
                <p className="text-gray-600">{item.variants[0]}</p>
                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                <p className="text-sm text-gray-600">Price: ₹{item.singlePrice} / carton</p>
              </div>
              <div className="font-semibold">₹{item.singlePrice * item.quantity}</div>
            </div>
          ))}
        </div>

        <div className="text-right font-bold text-lg mb-4">
          Total: ₹{calculateTotal()}
        </div>

        <div className="flex justify-end gap-4">
          <button 
            onClick={onClose} 
            className="bg-gray-300 px-4 py-2 rounded cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer flex items-center justify-center"
          >
            {loading ? <CircularProgress size={20} color='white'/> : "Confirm Order"}
          </button>
        </div>
      </div>
    </div>
  );
};


export default CartPage;