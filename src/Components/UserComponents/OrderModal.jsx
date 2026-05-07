import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import { addItem } from "../../Slice/CartSlice";
import { baseURL } from "../../Utils/URLS";

// ── Size range helpers ──────────────────────────────────────────────────────

/**
 * Given a raw sizes array (numbers, possibly unsorted / duplicate),
 * groups consecutive runs and returns range label strings.
 *
 * [4,5,6,7,8,9]   → ["4X9"]
 * [1,2,3, 6,7,8]  → ["1X3", "6X8"]
 * [7]             → ["7"]
 */
const buildSizeRanges = (sizes) => {
  if (!sizes || sizes.length === 0) return [];
  const sorted = [...new Set(sizes.map(Number))].sort((a, b) => a - b);
  const runs = [];
  let run = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      run.push(sorted[i]);
    } else {
      runs.push(run);
      run = [sorted[i]];
    }
  }
  runs.push(run);

  return runs.map((r) =>
    r.length === 1 ? String(r[0]) : `${r[0]}X${r[r.length - 1]}`
  );
};

// ── SizeRangeSelector ───────────────────────────────────────────────────────
const SizeRangeSelector = ({ sizes = [], selected = "", onChange }) => {
  const ranges = useMemo(() => buildSizeRanges(sizes), [sizes]);

  if (ranges.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic bg-gray-100 p-3 rounded-lg border border-gray-200">
        No sizes available in inventory
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ranges.map((label) => {
        const isActive = selected === label;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(isActive ? "" : label)}
            className={`
              min-w-[4rem] px-4 py-2.5 rounded-xl border-2 text-sm font-bold
              transition-all duration-200 shadow-sm select-none
              ${
                isActive
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-indigo-200 shadow-md scale-105 ring-2 ring-indigo-300 ring-offset-1"
                  : "bg-white border-gray-200 text-gray-700 hover:border-indigo-400 hover:text-indigo-600 hover:shadow"
              }
            `}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

// ── OrderModal ──────────────────────────────────────────────────────────────
const OrderModal = ({ setPlaceOrderModal, selectedProductDetails, clearSearch }) => {
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizeRange, setSelectedSizeRange] = useState(""); // single range string e.g. "4X9"
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch  = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  // Inventory state
  const [inventoryData, setInventoryData]       = useState(null);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [inventoryError, setInventoryError]     = useState(null);

  // Fetch inventory
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
            articleId:   data.articleId,
            articleName: data.articleName,
            colors: (data.colors || []).filter(
              (c) => c && c !== "N/A" && c.toLowerCase() !== "unknown"
            ),
            sizes:     (data.sizes || []).filter((s) => s && s !== 0),
            sizeRange: data.sizeRange || "N/A",
            inStock:   data.colors?.length > 0 && data.sizes?.length > 0,
          };
          setInventoryData(transformedData);
        } else {
          setInventoryError("No inventory found for this article");
        }
      } catch (error) {
        if (error.response?.status === 404) {
          setInventoryError("This article is not yet added to inventory");
        } else {
          setInventoryError(
            error.response?.data?.message || "Failed to load inventory data"
          );
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

  const handleAddToCart = () => {
    if (selectedColors.length === 0) {
      Swal.fire({ icon: "warning", title: "Select Colors", text: "Please select at least one color" });
      return;
    }
    if (!selectedSizeRange) {
      Swal.fire({ icon: "warning", title: "Select Size Range", text: "Please select a size range" });
      return;
    }
    if (!quantity || quantity <= 0) {
      Swal.fire({ icon: "warning", title: "Enter Quantity", text: "Please enter a valid quantity (minimum 1 carton)" });
      return;
    }

    try {
      setLoading(true);

      const cartItem = {
        productid:    selectedProductDetails.product._id,
        articlename:  selectedProductDetails.product.name,
        variant:      selectedProductDetails.variant,
        segment:      selectedProductDetails.segment,
        productImg:   selectedProductDetails.product.images?.[0] || null,
        quantity:     Number(quantity),
        colors:       selectedColors,
        sizes:        selectedSizeRange,          // already formatted e.g. "4X9"
        availableSizes:   inventoryData.sizes,
        availableColors:  inventoryData.colors,
        allColorsAvailable: false,
      };

      dispatch(addItem(cartItem));

      // Build preview cart
      const updatedCart = [...cartItems];
      const existingIndex = updatedCart.findIndex(
        (item) =>
          item.productid === cartItem.productid &&
          item.variant   === cartItem.variant &&
          item.segment   === cartItem.segment &&
          item.sizes     === cartItem.sizes &&
          JSON.stringify([...item.colors].sort()) ===
            JSON.stringify([...cartItem.colors].sort())
      );

      if (existingIndex !== -1) {
        updatedCart[existingIndex].quantity += cartItem.quantity;
      } else {
        updatedCart.push(cartItem);
      }

      const cartHTML = updatedCart
        .map(
          (item) => `
          <div style="
            background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;
            padding:12px;margin-bottom:10px;text-align:left;
          ">
            <div style="display:flex;align-items:center;gap:12px;">
              <img src="${item.productImg}" alt="${item.articlename}"
                style="width:50px;height:50px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb;" />
              <div style="flex:1;">
                <p style="margin:0;font-weight:600;color:#1f2937;font-size:14px;text-transform:capitalize;">
                  ${item.articlename}
                </p>
                <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">
                  <span style="font-weight:500;">Qty:</span> ${item.quantity} cartons
                </p>
                <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">
                  <span style="font-weight:500;">Size:</span> ${item.sizes}
                </p>
                <p style="margin:2px 0 0;font-size:12px;color:#6b7280;text-transform:capitalize;">
                  <span style="font-weight:500;">Colors:</span> ${item.colors.join(", ")}
                </p>
              </div>
            </div>
          </div>
        `
        )
        .join("");

      Swal.fire({
        icon: "success",
        title: "✅ Added to Cart!",
        html: `
          <div style="text-align:left;max-height:400px;overflow-y:auto;margin-top:20px;">
            <p style="margin:0 0 16px;font-weight:600;color:#4b5563;font-size:14px;">
              🛒 Your Cart (${updatedCart.length} ${updatedCart.length === 1 ? "item" : "items"}):
            </p>
            ${cartHTML}
          </div>
        `,
        confirmButtonText: "OK",
        confirmButtonColor: "#4f46e5",
        customClass: { popup: "swal-wide", htmlContainer: "swal-cart-container" },
        didOpen: () => {
          const style = document.createElement("style");
          style.innerHTML = `
            .swal-wide { width:600px !important; max-width:90% !important; }
            .swal-cart-container { padding:0 10px; }
            .swal-cart-container::-webkit-scrollbar { width:6px; }
            .swal-cart-container::-webkit-scrollbar-track { background:#f1f1f1; border-radius:10px; }
            .swal-cart-container::-webkit-scrollbar-thumb { background:#888; border-radius:10px; }
          `;
          document.head.appendChild(style);
        },
      }).then((result) => {
        if (result.isConfirmed) {
          setSelectedColors([]);
          setSelectedSizeRange("");
          setQuantity("");
          setPlaceOrderModal(false);
          if (clearSearch) clearSearch();
        }
      });
    } catch {
      Swal.fire({ icon: "error", title: "Failed to Add", text: "Please try again" });
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
                {selectedProductDetails?.product?.name} •{" "}
                {selectedProductDetails?.segment}
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
        <div className="p-4 md:p-6 space-y-5 md:space-y-6">
          {/* ── Loading ── */}
          {loadingInventory ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
              <p className="text-gray-600 text-sm md:text-base">Loading inventory data...</p>
            </div>

          /* ── Error ── */
          ) : inventoryError ? (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 font-semibold text-sm md:text-base">
                This Article Is Not In Stock
              </p>
            </div>

          /* ── No stock ── */
          ) : !inventoryData?.inStock ? (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-yellow-700 font-semibold text-sm md:text-base">
                No Colors or Sizes Available
              </p>
              <p className="text-yellow-600 text-xs md:text-sm mt-2">
                This article needs inventory configuration
              </p>
            </div>

          /* ── Main form ── */
          ) : (
            <>
              {/* Info banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-blue-800 font-semibold text-sm">Available Options</p>
                  <p className="text-blue-600 text-xs">
                    {inventoryData.colors.length} colors • size range {inventoryData.sizeRange}
                  </p>
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="block text-sm md:text-base font-semibold text-gray-800 mb-2">
                  Select Colors
                  <span className="text-xs font-normal text-gray-400 ml-2">
                    ({selectedColors.length} selected)
                  </span>
                </label>
                {inventoryData.colors.length === 0 ? (
                  <p className="text-sm text-gray-500 italic bg-gray-100 p-3 rounded-lg border border-gray-200">
                    No colors available in inventory
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {inventoryData.colors.map((color) => (
                      <button
                        key={color}
                        type="button"
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

              {/* Size Range — replaces individual size buttons */}
              <div>
                <label className="block text-sm md:text-base font-semibold text-gray-800 mb-1">
                  Select Size Range
                  {selectedSizeRange && (
                    <span className="ml-2 text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {selectedSizeRange} selected
                    </span>
                  )}
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  Each box represents a consecutive size run. Tap to select.
                </p>
                <SizeRangeSelector
                  sizes={inventoryData.sizes}
                  selected={selectedSizeRange}
                  onChange={setSelectedSizeRange}
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm md:text-base font-semibold text-gray-800 mb-2">
                  Quantity (Cartons)
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  placeholder="Enter number of cartons"
                  className="w-full px-3 md:px-4 py-2 md:py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none text-sm md:text-base text-gray-900 placeholder-gray-400 transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Enter any quantity — no limit
                </p>
              </div>

              {/* Add to cart */}
              <button
                onClick={handleAddToCart}
                disabled={
                  loading ||
                  !inventoryData.inStock ||
                  inventoryData.colors.length === 0 ||
                  inventoryData.sizes.length === 0
                }
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 md:py-4 rounded-xl font-bold text-sm md:text-base shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 disabled:from-gray-400 disabled:to-gray-400"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
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