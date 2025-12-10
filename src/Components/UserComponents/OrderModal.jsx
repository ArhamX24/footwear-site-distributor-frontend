import { useState } from "react"; 
import { useFormik } from "formik"; 
import Swal from "sweetalert2"; 
import { FaChevronDown, FaChevronUp } from "react-icons/fa"; 
import { useDispatch, useSelector } from "react-redux"; 
import { addItem, dealGrasped, updateItem } from "../../Slice/CartSlice"; 

const OrderModal = ({ setPlaceOrderModal, selectedProductDetails, clearSearch }) => { 
  const [selectedSizes, setSelectedSizes] = useState([]); 
  const [selectedColors, setSelectedColors] = useState([]); 
  const [colorInput, setColorInput] = useState(""); 
  const [showDropdown, setShowDropdown] = useState(""); 

  const dispatch = useDispatch(); 
  const cartItems = useSelector((Store) => Store.cart.items);

  const minCartonsForDeal = selectedProductDetails?.product?.deal?.minQuantity || null; 
  const reward = selectedProductDetails?.product?.deal?.reward || null; 

  const formik = useFormik({ 
    initialValues: { quantity: "" }, 
    onSubmit: (values, action) => { 
      const sortedSizes = selectedSizes.sort((a, b) => a - b); 
      const finalSizes = selectedSizes.length > 0 
        ? sortedSizes[0] + "X" + sortedSizes[sortedSizes.length - 1]
        : ""; 
      const finalPrice = selectedProductDetails.product.price * values.quantity; 
      const isDealClaimed = 
        selectedProductDetails.product.indeal && 
        values.quantity >= minCartonsForDeal; 

      const data = { 
        productid: selectedProductDetails.product._id, 
        articlename: selectedProductDetails.product.name, 
        variant: selectedProductDetails.variant, 
        segment: selectedProductDetails.segment, 
        productImg: selectedProductDetails.product.images[0], 
        quantity: parseInt(values.quantity), 
        colors: selectedColors, 
        sizes: finalSizes, 
        price: finalPrice, 
        singlePrice: selectedProductDetails.product.price, 
        indeal: selectedProductDetails.product.indeal, 
        ...(isDealClaimed && { 
          dealReward: reward, 
          dealClaimed: true, 
        }), 
        allColorsAvailable: selectedProductDetails.product.allColorsAvailable,
        availableSizes: selectedProductDetails.product.sizes || [],
        availableColors: selectedProductDetails.product.colors || [], 
      }; 

      // Check if item already exists in cart
      const existingItemIndex = cartItems.findIndex(
        item => item.productid === data.productid &&
                item.variant === data.variant &&
                item.segment === data.segment &&
                JSON.stringify(item.colors) === JSON.stringify(data.colors) &&
                item.sizes === data.sizes
      );

      let isAddedAgain = false;
      
      if (existingItemIndex !== -1) {
        // Item exists - update quantity
        dispatch(updateItem({
          index: existingItemIndex,
          quantity: cartItems[existingItemIndex].quantity + data.quantity
        }));
        isAddedAgain = true;
      } else {
        // New item - add to cart
        dispatch(addItem(data));
      }

      if (isDealClaimed) dispatch(dealGrasped(selectedProductDetails._id)); 

      // Show Cart Preview with current items + newly added
      const updatedCartItems = [...cartItems];
      
      if (existingItemIndex !== -1) {
        updatedCartItems[existingItemIndex] = {
          ...updatedCartItems[existingItemIndex],
          quantity: updatedCartItems[existingItemIndex].quantity + data.quantity
        };
      } else {
        updatedCartItems.push(data);
      }

      const cartPreviewHTML = `
        <div class="text-left max-h-96 overflow-y-auto px-2">
          <h3 class="text-base md:text-lg font-bold mb-3 sticky top-0 bg-white pb-2 flex items-center justify-between border-b">
            <span>Cart Items (${updatedCartItems.length})</span>
            ${isAddedAgain 
              ? '<span class="text-xs md:text-sm text-orange-600 font-semibold bg-orange-50 px-2 py-1 rounded">⟳ Updated</span>' 
              : '<span class="text-xs md:text-sm text-green-600 font-semibold bg-green-50 px-2 py-1 rounded">✓ Added</span>'}
          </h3>
          <div class="space-y-2">
            ${updatedCartItems.map(item => `
              <div class="flex items-center gap-2 md:gap-3 p-2 bg-gray-50 rounded-lg border-2 ${
                item.productid === data.productid && 
                item.variant === data.variant && 
                item.sizes === data.sizes 
                  ? 'border-indigo-400 bg-indigo-50' 
                  : 'border-gray-200'
              }">
                <img src="${item.productImg}" alt="${item.articlename}" class="w-12 h-12 md:w-14 md:h-14 object-cover rounded-md flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-xs md:text-sm font-semibold capitalize text-gray-800 truncate">${item.articlename}</p>
                  <p class="text-10px md:text-xs text-gray-600 capitalize truncate">${item.variant} - ${item.segment}</p>
                  <p class="text-10px md:text-xs text-gray-600">Qty: <span class="font-medium text-indigo-600">${item.quantity}</span></p>
                  ${item.sizes ? `<p class="text-10px md:text-xs text-gray-500">Size: ${item.sizes}</p>` : ''}
                  ${item.colors.length > 0 ? `<p class="text-10px md:text-xs text-gray-500 truncate">Colors: ${item.colors.slice(0, 3).join(', ')}${item.colors.length > 3 ? '...' : ''}</p>` : ''}
                </div>
                ${item.productid === data.productid && item.variant === data.variant && item.sizes === data.sizes 
                  ? `<span class="text-xs ${isAddedAgain ? 'text-orange-600' : 'text-green-600'} font-bold flex-shrink-0">${isAddedAgain ? '⟳' : '✓'}</span>` 
                  : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;

      Swal.fire({ 
        title: isAddedAgain ? "Quantity Updated!" : "Added to Cart!",
        html: cartPreviewHTML,
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#4F46E5",
        width: '90%',
        maxWidth: '500px'
      }); 

      // Clear search after adding to cart
      if (clearSearch) {
        clearSearch();
      }

      action.resetForm(); 
      setSelectedColors([]); 
      setSelectedSizes([]); 
      setColorInput("");
      setPlaceOrderModal(false); 
    }, 
  }); 

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

  return ( 
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800/50 z-50 p-4"> 
      <div className="bg-gray-100 w-full max-w-md p-6 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto"> 
        <h2 className="text-lg font-semibold mb-2">Place Your Order</h2> 
        <form onSubmit={formik.handleSubmit}> 
          {/* Carton Quantity */} 
          <label className="block"> 
            <span className="font-medium">Cartons:</span> 
            <input 
              type="number" 
              min="1" 
              name="quantity" 
              onChange={formik.handleChange} 
              value={formik.values.quantity} 
              placeholder="Enter no. of cartons" 
              className="w-full mt-1 p-2 border rounded outline-none focus:ring-2 focus:ring-indigo-500" 
              required
            /> 
          </label> 

          {/* Deal Notice */} 
          {minCartonsForDeal && ( 
            <p className="text-sm mt-2 font-medium capitalize"> 
              {formik.values.quantity >= minCartonsForDeal ? ( 
                <span className="text-green-600"> 
                  🎉 You will get *{reward}* on your purchase! 
                </span> 
              ) : ( 
                <span className="text-blue-600 capitalize"> 
                  📢 Add *{minCartonsForDeal - formik.values.quantity}* more cartons for a free *{reward}!* 
                </span> 
              )} 
            </p> 
          )} 

          {/* Sizes Dropdown - ALWAYS SHOW */} 
          <label className="block mt-4 relative"> 
            <span className="font-medium">Sizes: <span className="text-red-500">*</span></span> 
            <div 
              className="w-full mt-1 p-2 border rounded outline-none cursor-pointer flex items-center justify-between bg-white" 
              onClick={() => setShowDropdown(showDropdown === "sizes" ? "" : "sizes")} 
            > 
              {selectedSizes.length > 0 ? selectedSizes.join(", ") : "Select sizes"} 
              {showDropdown === "sizes" ? <FaChevronUp /> : <FaChevronDown />} 
            </div> 

            {showDropdown === "sizes" && ( 
              <div className="absolute left-0 right-0 mt-1 bg-white shadow-lg rounded border max-h-40 overflow-y-auto z-50"> 
                {selectedProductDetails.product.sizes.map((size, index) => ( 
                  <div 
                    key={index} 
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

          {/* Colors: Input vs Dropdown - ALWAYS SHOW */} 
          <label className="block mt-4 relative"> 
            <span className="font-medium">Colors: <span className="text-red-500">*</span></span> 

            {selectedProductDetails.product.allColorsAvailable ? ( 
              <> 
                <input 
                  type="text" 
                  placeholder="Enter colors (comma separated)" 
                  value={colorInput} 
                  onChange={handleColorInputChange} 
                  onKeyDown={handleColorKeyDown} 
                  className="w-full mt-1 p-2 border rounded bg-white outline-none focus:ring-2 focus:ring-indigo-500" 
                  required
                /> 
                <p className="text-sm text-gray-600 mt-2"> 
                  Available colors: <span className="font-medium">All Colors</span> 
                </p> 
              </> 
            ) : ( 
              <> 
                <div 
                  className="w-full mt-1 p-2 border rounded outline-none cursor-pointer flex items-center justify-between bg-white" 
                  onClick={() => setShowDropdown(showDropdown === "colors" ? "" : "colors")} 
                > 
                  {selectedColors.length > 0 ? selectedColors.join(", ") : "Select colors"} 
                  {showDropdown === "colors" ? <FaChevronUp /> : <FaChevronDown />} 
                </div> 

                {showDropdown === "colors" && ( 
                  <div className="absolute left-0 right-0 mt-1 bg-white shadow-lg rounded border max-h-40 overflow-y-auto z-50 capitalize"> 
                    {selectedProductDetails.product.colors.map((color, index) => ( 
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

          {/* Buttons */} 
          <div className="flex justify-end gap-3 mt-6"> 
            <button 
              type="button" 
              onClick={() => setPlaceOrderModal(false)} 
              className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-all duration-300" 
            > 
              Cancel 
            </button> 
            <button 
              type="submit" 
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300" 
            > 
              Add to Cart 
            </button> 
          </div> 
        </form> 
      </div> 
    </div> 
  ); 
}; 

export default OrderModal;
