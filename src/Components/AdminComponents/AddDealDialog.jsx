import React, { useState } from "react";
import { useFormik } from "formik";
import axios from "axios";
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";
import { baseURL } from "../../Utils/URLS";
import { FaImage, FaTag } from "react-icons/fa";

const AddDealDialog = ({ setIsAdded, isEmptyState }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const today = new Date().toISOString().split("T")[0];

  const formik = useFormik({
    initialValues: {
      dealName: "",
      startDate: "",
      endDate: "",
      image: null,
    },
    onSubmit: async (values, action) => {
      if (!values.dealName.trim()) {
        Swal.fire("Please enter a deal name", "", "warning");
        return;
      }

      if (!values.image) {
        Swal.fire("Please upload an offer image", "", "warning");
        return;
      }

      try {
        setLoading(true);
        const formData = new FormData();
        
        formData.append("dealName", values.dealName.trim());
        formData.append("start", values.startDate);
        formData.append("end", values.endDate);
        formData.append("images", values.image);

        const response = await axios.post(
          `${baseURL}/api/v1/admin/deal/add`,
          formData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        if (!response.data.result) {
          throw new Error(response.data.message);
        }

        Swal.fire("Success!", response.data.message, "success");
        action.resetForm();
        setImagePreview(null);
        setOpen(false);
        setIsAdded(true);
      } catch (err) {
        Swal.fire("Error", err.response?.data?.message || err.message || "Something went wrong", "error");
      } finally {
        setLoading(false);
      }
    },
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      formik.setFieldValue("image", file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`bg-gray-600 text-white px-4 py-2 hover:bg-gray-700 rounded-full border transition duration-200 text-sm font-medium ${
          isEmptyState ? 'px-6 py-3 text-base' : 'w-full'
        }`}
      >
        + Add New Deal
      </button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900/50 z-50 p-4">
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Offer</h2>
              <button
                onClick={() => {
                  setOpen(false);
                  setImagePreview(null);
                  formik.resetForm();
                }}
                className="text-gray-500 hover:text-gray-700 text-lg font-bold px-2 py-1 rounded-full border"
              >
                ×
              </button>
            </div>

            <form onSubmit={formik.handleSubmit} className="space-y-4">
              {/* Deal Name */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  <div className="flex items-center gap-2">
                    <FaTag className="text-gray-600" />
                    Deal Name <span className="text-red-500">*</span>
                  </div>
                </label>
                <input
                  type="text"
                  name="dealName"
                  placeholder="e.g., Summer Sale 2025, Diwali Offer, etc."
                  onChange={formik.handleChange}
                  value={formik.values.dealName}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This name is for your reference only (not shown to customers)
                </p>
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    min={today}
                    onChange={formik.handleChange}
                    value={formik.values.startDate}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    min={formik.values.startDate || today}
                    onChange={formik.handleChange}
                    value={formik.values.endDate}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    required
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Upload Offer Image <span className="text-red-500">*</span>
                </label>
                
                {/* Image Preview */}
                {imagePreview ? (
                  <div className="mb-3">
                    <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          formik.setFieldValue("image", null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition">
                    <FaImage className="mx-auto text-4xl text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Image Preview</p>
                  </div>
                )}
                
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  className="w-full border px-3 py-2 rounded-md mt-2 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  onChange={handleImageChange}
                  required
                />
              </div>

              {/* Duration Display */}
              {formik.values.startDate && formik.values.endDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Duration:</span> {
                      Math.ceil((new Date(formik.values.endDate) - new Date(formik.values.startDate)) / (1000 * 60 * 60 * 24))
                    } days
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="bg-gray-700 text-white px-4 py-3 rounded-xl hover:bg-gray-600 transition duration-200 w-full font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <CircularProgress size={20} color="inherit" />
                    Uploading...
                  </span>
                ) : (
                  "Add Offer"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddDealDialog;
