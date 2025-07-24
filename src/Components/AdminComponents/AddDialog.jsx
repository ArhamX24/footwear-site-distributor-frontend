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
  // Use a boolean for the variant checkbox state:
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
    return errors;
  },
    onSubmit: async (values, action) => {
      try {
        setLoading(true);
        setError("");

        const formData = new FormData();

        // Process colors and sizes as comma-separated values:
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
        formData.append("articleName", values.articleName)
        colorsArr.forEach((color) => formData.append("colors", color));
        sizeArr.forEach((size) => formData.append("sizes", size));
        formData.append("variant", values.variant);

        // If the product has a variant, append the variant name.
        if (isVariant) {
          formData.append("variantName", values.variantName);
        }

        // Append images.
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
        });

        action.resetForm();
        setOpen(false);
        setPreview([]);
        getProducts();
        setIsVariant(false)
      } catch (error) {
        console.error(error)
        setLoading(false);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong!",
        });
        setError(error.response?.data?.message);
      }
    },
  });

  // Helper function to handle comma insertion on space key
  const handleInputChange = (e, field) => {
    let value = e.target.value;
    if (e.key === " ") {
      e.preventDefault(); // Prevent default space behavior
      value = value.trim() + ", "; // Append a comma when space is pressed
      formik.setFieldValue(field, value);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="bg-gray-700 text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition duration-200"
      >
        Add New Article
      </button>

      {open && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-gray-900/50 z-10 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Add Article
            </h2>

            <form onSubmit={formik.handleSubmit} className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Segment
                </label>
                <input
                  type="text"
                  name="segment"
                  placeholder="eg. Hawaii, EVA"
                  {...formik.getFieldProps('segment')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-gray-900"
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <input
                    type="text"
                    name="variant"
                    placeholder="eg. 5-stud, Printed"
                    {...formik.getFieldProps("variant")}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-gray-900"
                  />
                </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Article Name
                  </label>
                  <input
                    type="text"
                    name="articleName"
                    placeholder="eg. Raja-01"
                    {...formik.getFieldProps("articleName")}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-gray-900"
                  />
                </div>

              {/* Gender Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <select
                  name="gender"
                  {...formik.getFieldProps("gender")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-gray-900"
                >
                  <option value="">Select</option>
                  <option value="gents">Gents</option>
                  <option value="ladies">Ladies</option>
                  <option value="kids">Kids</option>
                </select>
              </div>

              {/* Colors Input with "All Colors Available" checkbox */}
<div>
  <label className="block text-sm font-medium text-gray-700">
    Colors
  </label>

        {/* Input Box */}
        <input
          type="text"
          name="colors"
          placeholder="eg. Red, Blue, Black"
          value={allColorsAvailable ? "All Colors" : formik.values.colors}
          disabled={allColorsAvailable}
          onChange={(e) => {
            formik.setFieldValue("colors", e.target.value.replace(/\s/g, ","));
          }}
          className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:border-gray-900 ${
            allColorsAvailable ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
        />

        {/* Checkbox */}
        <label className="inline-flex items-center mt-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={allColorsAvailable}
            onChange={(e) => {
              setAllColorsAvailable(e.target.checked);
              const presetValue = e.target.checked ? "All Colors" : "";
              formik.setFieldValue("colors", presetValue);
            }}
            className="mr-2"
          />
          All Colors Available
        </label>
      </div>


              {/* Sizes Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Size</label>
                <input
                type="text"
                name="sizes"
                placeholder="eg. UK-6,7,8"
                value={formik.values.sizes} // Ensure state is properly linked
                onChange={(e) => {
                  formik.setFieldValue("sizes", e.target.value.replace(/\s/g, ",")); // Replace spaces with commas
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-gray-900"
              />
              </div>

              {/* Image Upload */}
              <div className="flex flex-col items-center justify-center w-full">
                
                <ImageUploader formik={formik} setPreview={setPreview}/>
              </div>

              {/* Image Preview */}
              {preview.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-2">
                  {preview.map((src, idx) => (
                    <img
                      key={idx}
                      src={src}
                      alt="uploaded"
                      className="w-20 h-20 object-cover rounded-md"
                    />
                  ))}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <p className="text-sm text-center text-red-400">{error}</p>
              )}


              {/* Submit Button */}
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="bg-gray-700 text-white px-4 py-2 rounded-xl hover:bg-gray-600 transition duration-200 w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Add Product"
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