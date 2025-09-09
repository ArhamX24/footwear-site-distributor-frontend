import React, { useState } from "react";
import { useFormik } from "formik";
import axios from "axios";
import CircularProgress from "@mui/material/CircularProgress";
import Swal from "sweetalert2";
import { baseURL } from "../../Utils/URLS";
import ImageUploader from "./ImageUploader";

const AddDialog = ({ getProducts }) => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState([]);
  const [isVariant, setIsVariant] = useState(false);
  const [allColorsAvailable, setAllColorsAvailable] = useState(false);

  const handleOpen = () => setOpen(!open);

  const formik = useFormik({
    initialValues: {
      segment: "",
      variant: "",
      articleName: "",
      gender: "",
      colors: "",
      sizes: "",
      images: [],
    },
    validate: (values) => {
      const errors = {};
      if (!values.segment) errors.segment = "Segment is required";
      if (!values.articleName) errors.articleName = "Article name is required";
      if (!values.gender) errors.gender = "Gender is required";
      return errors;
    },
    onSubmit: async (values, action) => {
      try {
        setLoading(true);
        setError("");

        const formData = new FormData();

        const colorsArr = values.colors
          .split(",")
          .map((color) => color.trim())
          .filter(Boolean);
        const sizeArr = values.sizes
          .split(",")
          .map((size) => size.trim())
          .filter(Boolean);

        formData.append("segment", values.segment);
        formData.append("gender", values.gender);
        formData.append("articleName", values.articleName);
        colorsArr.forEach((color) => formData.append("colors", color));
        sizeArr.forEach((size) => formData.append("sizes", size));
        formData.append("variant", values.variant);

        if (isVariant) {
          formData.append("variantName", values.variantName);
        }

        values.images.forEach((image) => {
          formData.append("images", image);
        });

        const response = await axios.post(
          `${baseURL}/api/v1/admin/products/addproduct`,
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
          text: "Product Added Successfully!",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });

        action.resetForm();
        setOpen(false);
        setPreview([]);
        getProducts(); // Refresh products list in parent component
        setIsVariant(false);
        setAllColorsAvailable(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: error.response?.data?.message || "Something went wrong!",
        });
        setError(error.response?.data?.message);
      }
    },
  });

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        className="bg-gray-600 text-white px-4 py-2 hover:bg-gray-700 rounded-full border transition duration-200 w-full text-sm font-medium"
      >
        + Add New Article
      </button>

      {/* Modal Overlay */}
      {open && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Add New Article</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              {/* Segment Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Segment *
                </label>
                <input
                  type="text"
                  name="segment"
                  placeholder="e.g., Hawaii, EVA"
                  {...formik.getFieldProps('segment')}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    formik.errors.segment && formik.touched.segment
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                />
                {formik.errors.segment && formik.touched.segment && (
                  <p className="text-red-500 text-xs mt-1">{formik.errors.segment}</p>
                )}
              </div>

              {/* Category Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  name="variant"
                  placeholder="e.g., 5-stud, Printed"
                  {...formik.getFieldProps("variant")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>

              {/* Article Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Article Name *
                </label>
                <input
                  type="text"
                  name="articleName"
                  placeholder="e.g., Raja-01"
                  {...formik.getFieldProps("articleName")}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    formik.errors.articleName && formik.touched.articleName
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                />
                {formik.errors.articleName && formik.touched.articleName && (
                  <p className="text-red-500 text-xs mt-1">{formik.errors.articleName}</p>
                )}
              </div>

              {/* Gender Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender *
                </label>
                <select
                  name="gender"
                  {...formik.getFieldProps("gender")}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    formik.errors.gender && formik.touched.gender
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Gender</option>
                  <option value="gents">Gents</option>
                  <option value="ladies">Ladies</option>
                  <option value="kids">Kids</option>
                </select>
                {formik.errors.gender && formik.touched.gender && (
                  <p className="text-red-500 text-xs mt-1">{formik.errors.gender}</p>
                )}
              </div>

              {/* Colors Input
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Colors
                </label>
                <input
                  type="text"
                  name="colors"
                  placeholder="e.g., Red, Blue, Black"
                  value={allColorsAvailable ? "All Colors" : formik.values.colors}
                  disabled={allColorsAvailable}
                  onChange={(e) => {
                    formik.setFieldValue("colors", e.target.value.replace(/\s/g, ","));
                  }}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    allColorsAvailable ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
                <label className="inline-flex items-center mt-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allColorsAvailable}
                    onChange={(e) => {
                      setAllColorsAvailable(e.target.checked);
                      const presetValue = e.target.checked ? "All Colors" : "";
                      formik.setFieldValue("colors", presetValue);
                    }}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  All Colors Available
                </label>
              </div> */}

              {/* Sizes Input */}
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sizes
                </label>
                <input
                  type="text"
                  name="sizes"
                  placeholder="e.g., UK-6,7,8"
                  value={formik.values.sizes}
                  onChange={(e) => {
                    formik.setFieldValue("sizes", e.target.value.replace(/\s/g, ","));
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div> */}

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images
                </label>
                <ImageUploader formik={formik} setPreview={setPreview} />
              </div>

              {/* Image Preview */}
              {preview.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <div className="flex flex-wrap gap-2">
                    {preview.map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt={`Preview ${idx + 1}`}
                        className="w-16 h-16 object-cover rounded-md border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-xl hover:bg-gray-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <CircularProgress size={20} color="inherit" className="mr-2" />
                      Adding...
                    </div>
                  ) : (
                    "Add Article"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddDialog;
