import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";
import { FaChevronDown, FaChevronUp, FaEdit } from "react-icons/fa";
import { clearCart, dealGrasped, removeItem, updateItem } from "../../Slice/CartSlice";
import { baseURL } from "../../Utils/URLS";

// Edit Item Modal Component
const EditItemModal = ({ item, itemIndex, onClose, onSave }) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const [selectedSizes, setSelectedSizes] = useState(
    item.sizes ? item.sizes.split("X").map(s => parseInt(s)) : []
  );
  const [selectedColors, setSelectedColors] = useState(item.colors || []);
  const [colorInput, setColorInput] = useState(item.colors?.join(", ") || "");
  const [showDropdown, setShowDropdown] = useState("");

  const handleSave = () => {
    const sortedSizes = selectedSizes.sort((a, b) => a - b);
    const finalSizes = selectedSizes.length > 0 
      ? sortedSizes[0] + "X" + sortedSizes[sortedSizes.length - 1]
      : "";

    onSave({
      index: itemIndex,
      quantity: parseInt(quantity),
      colors: selectedColors,
      sizes: finalSizes
    });
    onClose();
  };

  const handleColorInputChange = (e) => {
    const value = e.target.value;
    setColorInput(value);
    setSelectedColors(
      value.split(",").map((c) => c.trim()).filter(Boolean)
    );
  };

  const handleColorKeyDown = (e) => {
    if (e.key === " ") {
      e.preventDefault();
      const newValue = colorInput.trim() + ", ";
      setColorInput(newValue);
      setSelectedColors(
        newValue.split(",").map((c) => c.trim()).filter(Boolean)
      );
    }
  };

  // Get available sizes and colors from item (stored during add to cart)
  const availableSizes = item.availableSizes || [];
  const availableColors = item.availableColors || [];
  const allColorsAvailable = item.allColorsAvailable || false;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800/50 z-50 p-4">
      <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Edit Item</h2>
        
        {/* Product Info */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <img src={item.productImg} alt={item.articlename} className="w-16 h-16 object-cover rounded-md" />
          <div>
            <p className="font-semibold capitalize text-gray-800">{item.articlename}</p>
            <p className="text-sm text-gray-600 capitalize">{item.segment}</p>
          </div>
        </div>

        {/* Quantity */}
        <label className="block mb-4">
          <span className="font-medium">Cartons:</span>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full mt-1 p-2 border rounded outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>

        {/* Sizes Dropdown */}
        {availableSizes.length > 0 && (
          <label className="block mb-4 relative">
            <span className="font-medium">Sizes:</span>
            <div
              className="w-full mt-1 p-2 border rounded cursor-pointer flex items-center justify-between bg-white"
              onClick={() => setShowDropdown(showDropdown === "sizes" ? "" : "sizes")}
            >
              {selectedSizes.length > 0 ? selectedSizes.join(", ") : "Select sizes"}
              {showDropdown === "sizes" ? <FaChevronUp /> : <FaChevronDown />}
            </div>

            {showDropdown === "sizes" && (
              <div className="absolute left-0 right-0 mt-1 bg-white shadow-lg rounded border max-h-40 overflow-y-auto z-50">
                {availableSizes.map((size) => (
                  <div
                    key={size}
                    className={`p-2 cursor-pointer hover:bg-gray-200 ${selectedSizes.includes(size) ? "bg-indigo-200" : ""}`}
                    onClick={() => {
                      setSelectedSizes((prev) =>
                        prev.includes(size)
                          ? prev.filter((s) => s !== size)
                          : [...prev, size]
                      );
                    }}
                  >
                    {size}
                  </div>
                ))}
              </div>
            )}
          </label>
        )}

        {/* Colors */}
        {(allColorsAvailable || availableColors.length > 0) && (
          <label className="block mb-4 relative">
            <span className="font-medium">Colors:</span>
            
            {allColorsAvailable ? (
              <>
                <input
                  type="text"
                  placeholder="Enter colors (comma separated)"
                  value={colorInput}
                  onChange={handleColorInputChange}
                  onKeyDown={handleColorKeyDown}
                  className="w-full mt-1 p-2 border rounded bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Available colors: <span className="font-medium">All Colors</span>
                </p>
              </>
            ) : (
              <>
                <div
                  className="w-full mt-1 p-2 border rounded cursor-pointer flex items-center justify-between bg-white"
                  onClick={() => setShowDropdown(showDropdown === "colors" ? "" : "colors")}
                >
                  {selectedColors.length > 0 ? selectedColors.join(", ") : "Select colors"}
                  {showDropdown === "colors" ? <FaChevronUp /> : <FaChevronDown />}
                </div>

                {showDropdown === "colors" && (
                  <div className="absolute left-0 right-0 mt-1 bg-white shadow-lg rounded border max-h-40 overflow-y-auto z-50 capitalize">
                    {availableColors.map((color, index) => (
                      <div
                        key={index}
                        className={`p-2 cursor-pointer hover:bg-gray-200 ${selectedColors.includes(color) ? "bg-indigo-200" : ""}`}
                        onClick={() => {
                          setSelectedColors((prev) =>
                            prev.includes(color)
                              ? prev.filter((c) => c !== color)
                              : [...prev, color]
                          );
                        }}
                      >
                        {color}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </label>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// Order Confirmation Modal
const OrderConfirmationModal = ({ cart, onClose, onConfirm, loading }) => {
  const [transportSource, setTransportSource] = useState("");

  const handleConfirm = () => {
    if (!transportSource.trim()) {
      Swal.fire({
        title: 'Transport Required',
        text: 'Please enter transport source',
        icon: 'warning'
      });
      return;
    }
    onConfirm(transportSource);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800/50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Confirm Order</h2>

        {/* Transport Input */}
        <div className="mb-4">
          <label className="block mb-2">
            <span className="font-medium text-gray-700">Transport Source: <span className="text-red-500">*</span></span>
            <input
              type="text"
              value={transportSource}
              onChange={(e) => setTransportSource(e.target.value)}
              placeholder="Enter transport company/source"
              className="w-full mt-1 p-2 border rounded outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </label>
        </div>

        {/* Cart Items */}
        <div className="max-h-64 overflow-y-auto mb-4 border rounded p-2">
          {cart.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between border-b py-2">
              <div>
                <h3 className="font-medium capitalize">{item.articlename || "No Name Provided"}</h3>
                <p className="text-sm text-gray-700">Cartons: {item.quantity}</p>
                <p className="text-sm text-gray-700">Size: {item.sizes || "-"}</p>
                <p className="text-sm text-gray-700 capitalize">Colors: {item.colors?.length > 0 ? item.colors.join(", ") : "-"}</p>
                {item.dealClaimed && (
                  <p className="capitalize text-gray-600 text-sm">
                    You Got <span className="text-gray-700 underline">{item.dealReward}</span> On This Article
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-gray-300 px-4 py-2 rounded cursor-pointer hover:bg-gray-400"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-indigo-700 flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : "Confirm Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

const CartPage = () => {
  const cart = useSelector((Store) => Store.cart.items);
  const dispatch = useDispatch();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const handlePlaceOrderClick = () => {
    if (cart.length === 0) {
      Swal.fire({
        title: 'Cart is Empty',
        text: 'Please add items to cart before placing order',
        icon: 'info'
      });
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmOrder = async (transportSource) => {
    try {
      const orderData = {
        items: cart,
        orderDate: new Date().toISOString(),
        transportSource: transportSource
      };

      setLoading(true);
      const response = await axios.post(
        `${baseURL}/api/v1/distributor/product/placeorder`,
        orderData,
        { withCredentials: true }
      );

      if (response.data.result) {
        setLoading(false);
        setShowConfirmModal(false);

        Swal.fire({
          title: "Order placed successfully!",
          text: "Your order has been placed successfully.",
          icon: "success",
          confirmButtonText: "Download Order Performa",
        }).then((result) => {
          if (result.isConfirmed) {
            window.open(
              `${baseURL}/api/v1/distributor/orders/download-performa/${response?.data.order._id}`,
              "_blank"
            );
          }
        });

        dispatch(clearCart());
        dispatch(dealGrasped(false));
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
      Swal.fire({
        title: "Error",
        text: "There was a problem placing your order. Please try again.",
        icon: "error",
      });
    }
  };

  const handleEditItem = (updateData) => {
    dispatch(updateItem(updateData));
    Swal.fire({
      title: 'Updated!',
      text: 'Item has been updated successfully',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 min-h-screen">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Your Cart</h2>

      {cart?.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p className="text-gray-500 text-lg">Your cart is empty</p>
          <p className="text-gray-400 text-sm mt-2">Add items to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cart.map((item, index) => {
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-3 md:p-4 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
              >
                {/* Product Image */}
                <img
                  src={item.productImg}
                  alt={item.articlename}
                  className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-md border flex-shrink-0"
                />

                {/* Product Info - Left Side */}
                <div className="flex-1 min-w-0">
                  {/* Article Name */}
                  <h3 className="text-sm md:text-base font-semibold text-gray-800 capitalize truncate mb-2">
                    {item.articlename || "No Name Provided"}
                  </h3>
                  
                  {/* Size */}
                  <p className="text-xs md:text-sm text-gray-600 mb-1">
                    <span className="font-medium">Size:</span> {item.sizes || "-"}
                  </p>
                  
                  {/* Colors */}
                  <p className="text-xs md:text-sm text-gray-600">
                    <span className="font-medium">Colors:</span> {item.colors?.length > 0 ? (
                      <span className="capitalize">{item.colors.join(", ")}</span>
                    ) : "-"}
                  </p>
                </div>

                {/* Quantity - Right Side */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0 min-w-[80px]">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Quantity</p>
                    <p className="text-lg md:text-xl font-bold text-indigo-600">
                      {item.quantity}
                    </p>
                    <p className="text-xs text-gray-500">cartons</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditingItem({ item, index })}
                    className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    title="Edit"
                  >
                    <FaEdit size={16} />
                  </button>
                  <button
                    onClick={() => dispatch(removeItem(item))}
                    className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM13.4142 13.9997L15.182 15.7675L13.7678 17.1817L12 15.4139L10.2322 17.1817L8.81802 15.7675L10.5858 13.9997L8.81802 12.232L10.2322 10.8178L12 12.5855L13.7678 10.8178L15.182 12.232L13.4142 13.9997ZM9 4V6H15V4H9Z" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cart?.length > 0 && (
        <div className="mt-6">
          <button
            onClick={handlePlaceOrderClick}
            className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md"
          >
            Place Order ({cart.length} {cart.length === 1 ? 'item' : 'items'})
          </button>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <EditItemModal
          item={editingItem.item}
          itemIndex={editingItem.index}
          onClose={() => setEditingItem(null)}
          onSave={handleEditItem}
        />
      )}

      {/* Order Confirmation Modal */}
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

export default CartPage;
