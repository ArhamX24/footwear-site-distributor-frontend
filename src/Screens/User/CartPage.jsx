import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import Swal from 'sweetalert2';
import CircularProgress from "@mui/material/CircularProgress";
import { clearCart, dealGrasped, removeItem } from '../../Slice/CartSlice';
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

      const response = await axios.post(`${baseURL}/api/v1/distributor/product/placeorder`, orderData, {withCredentials: true});

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
            window.open(`${baseURL}/api/v1/distributor/orders/download-performa/${response?.data.order._id}`, '_blank');
          }
        });
      }

      dispatch(clearCart());
      dispatch(dealGrasped(false))

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
          {cart.map((item) => {
            const totalPrice = item.singlePrice * item.quantity;
            return (
              <div key={item.productid} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md">
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
  <div className="flex justify-end mt-1">
    <button className="cursor-pointer" onClick={() => dispatch(removeItem(item))}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="#FF0000"
      >
        <path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM13.4142 13.9997L15.182 15.7675L13.7678 17.1817L12 15.4139L10.2322 17.1817L8.81802 15.7675L10.5858 13.9997L8.81802 12.232L10.2322 10.8178L12 12.5855L13.7678 10.8178L15.182 12.232L13.4142 13.9997ZM9 4V6H15V4H9Z" />
      </svg>
    </button>
  </div>
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
                <h3 className="font-medium capitalize">{item.articlename || "No Name Provided"}</h3>
                <p className="text-sm text-gray-700">Cartons: {item.quantity}</p>
                <p className="text-sm text-gray-700">Size: {item.sizes}</p>
                {
                  item.dealClaimed && <p className='capitalize text-gray-600 text-sm'>You Got : <span className='text-gray-700 underline'>{item.dealReward}</span> On This Article</p>
                }
              </div>
            </div>
          ))}
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