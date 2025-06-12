import React, { useState } from "react";
import { useFormik } from "formik";
import axios from "axios";
import CircularProgress from "@mui/material/CircularProgress";
import Swal from "sweetalert2";
import { baseURL } from "../../Utils/URLS";

const AddDialog = ({ getProducts }) => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState([]);
  // Use a boolean for the variant checkbox state:
  const [isVariant, setIsVariant] = useState(false);

  const handleOpen = () => setOpen(!open);

  const formik = useFormik({
    initialValues: {
      name: "",
      price: "",
      category: "",
      type: "",
      variantName: "",
      colors: "",
      sizes: "",
      images: [],
    },
    validate: (values) => {
      const errors = {};
      if (!values.name) errors.name = "Name is required";
      if (!values.category) errors.category = "Category is required";
      if (!values.price || values.price <= 0)
        errors.price = "Enter a valid price";
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

        formData.append("name", values.name);
        formData.append("price", values.price);
        formData.append("category", values.category);
        formData.append("type", values.type);
        colorsArr.forEach((color) => formData.append("colors", color));
        sizeArr.forEach((size) => formData.append("sizes", size));
        formData.append("variant", values.variantName);

        // If the product has a variant, append the variant name.
        if (isVariant) {
          formData.append("variantName", values.variantName);
        }

        // Append images.
        values.images.forEach((image) => {
          formData.append("images", image);
        });

        const response = await axios.post(
          `https://${baseURL}/api/v1/admin/products/addproduct`,
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
        Add New Product
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
              Add Product
            </h2>

            <form onSubmit={formik.handleSubmit} className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Article Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="eg. Eva, PU"
                  {...formik.getFieldProps("name")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-gray-900"
                />
              </div>

              {/* Category Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  name="category"
                  {...formik.getFieldProps("category")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-gray-900"
                >
                  <option value="">Select</option>
                  <option value="gents">Gents</option>
                  <option value="ladies">Ladies</option>
                  <option value="kids">Kids</option>
                </select>
              </div>

              {/* Price Input with updated placeholder */}
              <div>
                <input
                  type="number"
                  name="price"
                  placeholder="Price per Carton"
                  {...formik.getFieldProps("price")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-gray-900"
                  min="1"
                />
              </div>

              {/* Colors Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Colors
                </label>
                <input
                  type="text"
                  name="colors"
                  placeholder="eg. Red, Blue, Black"
                  {...formik.getFieldProps("colors")}
                  onKeyDown={(e) => {
                    if (e.key === " ") handleInputChange(e, "colors");
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-gray-900"
                />
              </div>

              {/* Product Type Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Product Type
                </label>
                <input
                  type="text"
                  name="type"
                  placeholder="eg. Shoes, Slippers, Sandals"
                  {...formik.getFieldProps("type")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-gray-900"
                />
              </div>

              {/* Variant Checkbox Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Does it have a variant?
                </label>
                <label className="inline-flex items-center mt-1">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-indigo-600"
                    checked={isVariant}
                    onChange={(e) => setIsVariant(e.target.checked)}
                  />
                  <span className="ml-2">Yes</span>
                </label>
              </div>

              {/* Variant Input - Shown only if the checkbox is checked */}
              {isVariant && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Variant Name
                  </label>
                  <input
                    type="text"
                    name="variantName"
                    placeholder="eg. Hawaiii, 5-stud, Heel"
                    {...formik.getFieldProps("variantName")}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-gray-900"
                  />
                </div>
              )}

              {/* Sizes Input */}
              <div>
                <input
                  type="text"
                  name="sizes"
                  placeholder="eg. UK-6,7,8"
                  {...formik.getFieldProps("sizes")}
                  onKeyDown={(e) => {
                    if (e.key === " ") handleInputChange(e, "sizes");
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-gray-900"
                />
              </div>

              {/* Image Upload */}
              <div className="flex flex-col items-center justify-center w-full">
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-36 border-2 border-gray-800 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <input
                    id="dropzone-file"
                    type="file"
                    name="images"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const files = Array.from(event.target.files);
                      formik.setFieldValue("images", files);
                      setPreview(files.map((file) => URL.createObjectURL(file)));
                    }}
                  />
                  <p className="text-sm text-black">
                    <span className="font-semibold">Click to upload</span> or drag
                    and drop
                  </p>
                  <p className="text-xs text-black">SVG, PNG, JPG or GIF</p>
                </label>
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