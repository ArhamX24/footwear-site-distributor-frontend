import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux"; // ✅ Added useSelector
import { addItem } from "../../Slice/CartSlice";
import { baseURL } from "../../Utils/URLS";

const OrderModal = ({ setPlaceOrderModal, selectedProductDetails, clearSearch }) => {
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items); // ✅ Get cart items
  
  // Inventory state
  const [inventoryData, setInventoryData] = useState(null);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [inventoryError, setInventoryError] = useState(null);

  // Fetch real-time inventory data (only for colors and sizes)
  useEffect(() => {
    const fetchInventory = async () => {
      const articleId = selectedProductDetails?.product?._id;
      
      if (!articleId) {
        setInventoryError("Product ID not available");
        setLoadingInventory(false);
        return;
      }

      try {
        setLoadingInventory(true);
        setInventoryError(null);


        const response = await axios.get(
          `${baseURL}/api/v1/distributor/article-details/${articleId}`,
          { withCredentials: true }
        );


        if (response.data.success && response.data.data) {
          const data = response.data.data;
          
          const transformedData = {
            articleId: data.articleId,
            articleName: data.articleName,
            colors: (data.colors || []).filter(c => c && c !== 'N/A' && c.toLowerCase() !== 'unknown'),
            sizes: (data.sizes || []).filter(s => s && s !== 0),
            sizeRange: data.sizeRange || 'N/A',
            inStock: data.colors?.length > 0 && data.sizes?.length > 0,
          };

          setInventoryData(transformedData);
        } else {
          setInventoryError("No inventory found for this article");
        }
      } catch (error) {
        console.error('[ORDERMODAL] Error:', error);
        console.error('[ORDERMODAL] Error Response:', error.response?.data);
        
        if (error.response?.status === 404) {
          setInventoryError("This article is not yet added to inventory");
        } else {
          setInventoryError(error.response?.data?.message || "Failed to load inventory data");
        }
      } finally {
        setLoadingInventory(false);
      }
    };

    fetchInventory();
  }, [selectedProductDetails]);

  const handleColorToggle = (color) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const handleSizeToggle = (size) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleAddToCart = () => {
    // Validation
    if (selectedColors.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Select Colors",
        text: "Please select at least one color",
      });
      return;
    }

    if (selectedSizes.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Select Sizes",
        text: "Please select at least one size",
      });
      return;
    }

    if (!quantity || quantity <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Enter Quantity",
        text: "Please enter a valid quantity (minimum 1 carton)",
      });
      return;
    }

    try {
      setLoading(true);

      // Format sizes like "6X10"
      const sortedSizes = [...selectedSizes].sort((a, b) => a - b);
      const finalSizes = sortedSizes.length > 0 
        ? `${sortedSizes[0]}X${sortedSizes[sortedSizes.length - 1]}`
        : "";

      // Create cart item data matching your Redux structure
      const cartItem = {
        productid: selectedProductDetails.product._id,
        articlename: selectedProductDetails.product.name,
        variant: selectedProductDetails.variant,
        segment: selectedProductDetails.segment,
        productImg: selectedProductDetails.product.images?.[0] || null,
        quantity: Number(quantity),
        colors: selectedColors,
        sizes: finalSizes,
        // Store available options for editing later
        availableSizes: inventoryData.sizes,
        availableColors: inventoryData.colors,
        allColorsAvailable: false,
      };

      // Dispatch to Redux
      dispatch(addItem(cartItem));

      // ✅ Create cart preview HTML
      const updatedCart = [...cartItems];
      
      // Check if this exact item already exists
      const existingIndex = updatedCart.findIndex(
        (item) =>
          item.productid === cartItem.productid &&
          item.variant === cartItem.variant &&
          item.segment === cartItem.segment &&
          item.sizes === cartItem.sizes &&
          JSON.stringify([...item.colors].sort()) === JSON.stringify([...cartItem.colors].sort())
      );

      if (existingIndex !== -1) {
        // Update existing item quantity
        updatedCart[existingIndex].quantity += cartItem.quantity;
      } else {
        // Add new item
        updatedCart.push(cartItem);
      }

      // Generate cart items HTML
      const cartHTML = updatedCart.map((item, index) => `
        <div style="
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 10px;
          text-align: left;
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img 
              src="${item.productImg}" 
              alt="${item.articlename}"
              style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb;"
            />
            <div style="flex: 1;">
              <p style="margin: 0; font-weight: 600; color: #1f2937; font-size: 14px; text-transform: capitalize;">
                ${item.articlename}
              </p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">
                <span style="font-weight: 500;">Qty:</span> ${item.quantity} cartons
              </p>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: #6b7280;">
                <span style="font-weight: 500;">Size:</span> ${item.sizes}
              </p>
              <p style="margin: 2px 0 0 0; font-size: 12px; color: #6b7280; text-transform: capitalize;">
                <span style="font-weight: 500;">Colors:</span> ${item.colors.join(', ')}
              </p>
            </div>
          </div>
        </div>
      `).join('');

      // Show success alert with cart preview
      Swal.fire({
        icon: "success",
        title: "✅ Added to Cart!",
        html: `
          <div style="text-align: left; max-height: 400px; overflow-y: auto; margin-top: 20px;">
            <p style="margin: 0 0 16px 0; font-weight: 600; color: #4b5563; font-size: 14px;">
              🛒 Your Cart (${updatedCart.length} ${updatedCart.length === 1 ? 'item' : 'items'}):
            </p>
            ${cartHTML}
          </div>
        `,
        confirmButtonText: "OK",
        confirmButtonColor: "#4f46e5",
        customClass: {
          popup: 'swal-wide',
          htmlContainer: 'swal-cart-container'
        },
        didOpen: () => {
          // Add custom CSS for better scrolling
          const style = document.createElement('style');
          style.innerHTML = `
            .swal-wide {
              width: 600px !important;
              max-width: 90% !important;
            }
            .swal-cart-container {
              padding: 0 10px;
            }
            .swal-cart-container::-webkit-scrollbar {
              width: 6px;
            }
            .swal-cart-container::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 10px;
            }
            .swal-cart-container::-webkit-scrollbar-thumb {
              background: #888;
              border-radius: 10px;
            }
            .swal-cart-container::-webkit-scrollbar-thumb:hover {
              background: #555;
            }
          `;
          document.head.appendChild(style);
        }
      }).then((result) => {
        if (result.isConfirmed) {
          // Reset form and close modal
          setSelectedColors([]);
          setSelectedSizes([]);
          setQuantity("");
          setPlaceOrderModal(false);
          
          if (clearSearch) {
            clearSearch();
          }
        }
      });

    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to Add",
        text: "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 md:p-6 rounded-t-xl md:rounded-t-2xl shadow-lg z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white">
                {selectedProductDetails?.variant}
              </h2>
              <p className="text-xs md:text-sm text-indigo-100 mt-1">
                {selectedProductDetails?.product?.name} • {selectedProductDetails?.segment}
              </p>
            </div>
            <button
              onClick={() => setPlaceOrderModal(false)}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {loadingInventory ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600 text-sm md:text-base">Loading inventory data...</p>
            </div>
          ) : inventoryError ? (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 font-semibold text-sm md:text-base">This Article Is Not In Stock</p>
            </div>
          ) : !inventoryData?.inStock ? (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-yellow-700 font-semibold text-sm md:text-base">No Colors or Sizes Available</p>
              <p className="text-yellow-600 text-xs md:text-sm mt-2">This article needs inventory configuration</p>
            </div>
          ) : (
            <>
              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-blue-800 font-semibold text-sm md:text-base">Available Options</p>
                  <p className="text-blue-700 text-xs md:text-sm">
                    {inventoryData.colors.length} colors • {inventoryData.sizes.length} sizes
                  </p>
                </div>
              </div>

              {/* Colors Section */}
              <div>
                <label className="block text-sm md:text-base font-semibold text-gray-800 mb-2 md:mb-3">
                  Select Colors
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    ({selectedColors.length} selected)
                  </span>
                </label>
                {inventoryData.colors.length === 0 ? (
                  <p className="text-sm text-gray-500 italic bg-gray-100 p-3 rounded-lg border border-gray-200">No colors available in inventory</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {inventoryData.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorToggle(color)}
                        className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium capitalize transition-all ${
                          selectedColors.includes(color)
                            ? "bg-indigo-600 text-white shadow-md scale-105 ring-2 ring-indigo-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105 border border-gray-300"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sizes Section */}
              <div>
                <label className="block text-sm md:text-base font-semibold text-gray-800 mb-2 md:mb-3">
                  Select Sizes
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    ({selectedSizes.length} selected) • Range: {inventoryData.sizeRange}
                  </span>
                </label>
                {inventoryData.sizes.length === 0 ? (
                  <p className="text-sm text-gray-500 italic bg-gray-100 p-3 rounded-lg border border-gray-200">No sizes available in inventory</p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {inventoryData.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => handleSizeToggle(size)}
                        className={`px-2 md:px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                          selectedSizes.includes(size)
                            ? "bg-indigo-600 text-white shadow-md scale-105 ring-2 ring-indigo-300"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105 border border-gray-300"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity Section - No Max Limit */}
              <div>
                <label className="block text-sm md:text-base font-semibold text-gray-800 mb-2 md:mb-3">
                  Quantity (Cartons)
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  placeholder="Enter number of cartons"
                  className="w-full px-3 md:px-4 py-2 md:py-3 bg-white border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-sm md:text-base text-gray-900 placeholder-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Enter any quantity - no limit
                </p>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={loading || !inventoryData.inStock || inventoryData.colors.length === 0 || inventoryData.sizes.length === 0}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 md:py-4 rounded-lg font-bold text-sm md:text-base shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 disabled:from-gray-400 disabled:to-gray-400"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Adding to Cart...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add to Cart
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
