import React, { useState, useCallback } from "react";
import { useFormik } from "formik";
import axios from "axios";
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";
import { baseURL } from "../../Utils/URLS";

const AddDealDialog = ({ products }) => {
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState([]); // Image preview

  const today = new Date().toISOString().split("T")[0];

  const handleOpen = useCallback(() => setOpen((prev) => !prev), []);
  const handleSelectProduct = useCallback((product) => {
    setSelectedProduct(product);
    setDropdownOpen(false);
    setProductSearch(""); // Reset search when product is chosen
  }, []);

  const formik = useFormik({
    initialValues: {
      startDate: "",
      endDate: "",
      noOfPurchase: "",
      reward: "",
      images: [], // Added images field
    },
    onSubmit: async (values, action) => {
      try {
        setLoading(true);
        setError("");

        if (!selectedProduct) {
          setError("Please select a product");
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("articleId", selectedProduct?._id || "No ID");
        formData.append("articleName", selectedProduct?.articleName || "No Name");
        formData.append("start", values.startDate || "");
        formData.append("end", values.endDate || "");
        formData.append("noOfPurchase", values.noOfPurchase || ""); // ✅ No. of cartons required
        formData.append("reward", values.reward || ""); // ✅ Reward field

        values.images.forEach((image) => {
          formData.append("images", image);
        });

        const response = await axios.post(
          `https://${baseURL}/api/v1/admin/deal/add`,
          formData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        if (!response.data.result) {
          setError(response.data.message);
          setLoading(false);
          return;
        }

        setLoading(false);
        Swal.fire({
          title: "Success!",
          text: "Deal Added Successfully!",
          icon: "success",
        });

        action.resetForm();
        setOpen(false);
        setSelectedProduct(null);
        setPreview([]);
      } catch (error) {
        setLoading(false);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: error?.response?.data?.message,
        });

        setError(error.response?.data?.message || "Something went wrong.");
      }
    },
  });

  // Filter products based on search term
  const filteredProducts = products?.filter((product) =>
    product.articleName.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <>
      <button
        onClick={handleOpen}
        className="bg-gray-700 text-white px-4 py-2 rounded-xl hover:bg-gray-800 ease-in-out duration-200"
      >
        Add New Deal
      </button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900/50 z-10" onClick={() => setOpen(false)}>
          <div className="bg-white p-6 rounded-lg shadow-lg w-96" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Add Deal</h2>

            <form onSubmit={formik.handleSubmit} className="space-y-4">
              {/* Product Selection Dropdown */}
              <div className="relative w-full">
                <label className="block text-sm font-medium">Select Product</label>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 flex items-center justify-between"
                >
                  {selectedProduct ? selectedProduct.articleName : "Choose a product"}
                  <span className="ml-2">&#x25BC;</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute mt-2 w-full bg-white shadow-lg rounded-md overflow-y-scroll h-48">
                    <div className="p-2 border-b">
                      <input
                        type="text"
                        placeholder="Search product..."
                        className="w-full border border-gray-300 rounded-md px-2 py-1"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                      />
                    </div>
                    {filteredProducts && filteredProducts.length > 0 ? (
                      filteredProducts.map((product, index) => (
                        <div
                          key={index}
                          onClick={() => handleSelectProduct(product)}
                          className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                        >
                          <img src={product?.images[0]} alt={product.articleName} className="w-10 h-10 object-cover rounded-md mr-3" />
                          <span>{product.articleName}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-gray-500">No products found.</div>
                    )}
                  </div>
                )}
              </div>

              {/* Start & End Date Inputs */}
              <div className="flex gap-4">
                <input type="date" name="startDate" min={today} onChange={formik.handleChange} value={formik.values.startDate}
                  className="w-1/2 border border-gray-300 rounded-md px-3 py-2" />

                <input type="date" name="endDate" min={formik.values.startDate || today} onChange={formik.handleChange}
                  value={formik.values.endDate} className="w-1/2 border border-gray-300 rounded-md px-3 py-2" />
              </div>

              {/* No. of Cartons Required */}
              <div>
                <label className="block text-sm font-medium mb-1">Number of Cartons Required For Reward</label>
                <input type="number" name="noOfPurchase" placeholder="e.g. 3" onChange={formik.handleChange} value={formik.values.noOfPurchase}
                  className="w-full border border-gray-300 rounded-md px-3 py-2" min="1" />
              </div>

              {/* Reward */}
              <div>
                <label className="block text-sm font-medium mb-1">Reward</label>
                <input type="text" name="reward" placeholder="e.g., Free Fridge" onChange={formik.handleChange} value={formik.values.reward}
                  className="w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-1">Upload Image Of Deal</label>
                <input type="file" name="images" accept="image/*" className="w-full border px-3 py-2 rounded-md"
                  onChange={(event) => {
                    const files = Array.from(event.target.files);
                    formik.setFieldValue("images", files);
                    setPreview(files.map((file) => URL.createObjectURL(file)));
                  }} />
              </div>

              {/* Submit Button */}
              <button type="submit" className="bg-gray-700 text-white px-4 py-2 rounded-xl hover:bg-gray-600 transition duration-200 w-full"
                disabled={loading}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "Add Deal"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddDealDialog;