import { useState } from "react";
import { useFormik } from "formik";
import axios from "axios";
import CircularProgress from "@mui/material/CircularProgress";
import Swal from "sweetalert2";
import { baseURL } from "../../Utils/URLS";
import ImageUploader from "./ImageUploader";

const AddDialog = ({ getProducts }) => {
  const [open, setOpen]       = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState([]);

  // Color chip input state
  const [colorInput, setColorInput] = useState("");

  const handleOpen = () => setOpen(!open);

  // ── Add a color chip ────────────────────────────────────────────────────
  const addColor = (raw) => {
    const color = raw.trim().toLowerCase();
    if (!color) return;
    const current = formik.values.colors || [];
    if (!current.includes(color)) {
      formik.setFieldValue("colors", [...current, color]);
    }
    setColorInput("");
  };

  const removeColor = (color) => {
    formik.setFieldValue(
      "colors",
      formik.values.colors.filter((c) => c !== color)
    );
  };

  const handleColorKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addColor(colorInput);
    } else if (e.key === "Backspace" && !colorInput) {
      // Remove last chip on backspace
      const current = formik.values.colors || [];
      if (current.length > 0) {
        formik.setFieldValue("colors", current.slice(0, -1));
      }
    }
  };

  const formik = useFormik({
    initialValues: {
      segment:         "",
      segmentKeywords: "",
      variant:         "",
      variantKeywords: "",
      articleName:     "",
      articleKeywords: "",
      gender:          [],
      colors:          [],   // ← now an array of chips
      sizes:           "",
      images:          [],
    },
    validate: (values) => {
      const errors = {};
      if (!values.segment)     errors.segment     = "Segment is required";
      if (!values.articleName) errors.articleName = "Article name is required";
      if (!values.gender || values.gender.length === 0)
        errors.gender = "Please select at least one gender";
      return errors;
    },
    onSubmit: async (values, action) => {
      try {
        setLoading(true);
        setError("");

        const formData = new FormData();

        const sizeArr = values.sizes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        const segKw = values.segmentKeywords
          .split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
        const varKw = values.variantKeywords
          .split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
        const artKw = values.articleKeywords
          .split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);

        formData.append("segment",    values.segment);
        formData.append("variant",    values.variant);
        formData.append("articleName",values.articleName);

        values.gender.forEach((g)  => formData.append("gender", g));
        // ← send each color chip individually
        values.colors.forEach((c)  => formData.append("colors", c));
        sizeArr.forEach((s)        => formData.append("sizes",  s));

        formData.append("segmentKeywords", segKw.join(","));
        formData.append("variantKeywords", varKw.join(","));
        formData.append("articleKeywords", artKw.join(","));

        values.images.forEach((img) => formData.append("images", img));

        const response = await axios.post(
          `${baseURL}/api/v1/admin/products/addproduct`,
          formData,
          { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
        );

        if (!response.data.result) {
          setError(response.data.message);
          setLoading(false);
          return;
        }

        setLoading(false);
        Swal.fire({
          title:             "Success!",
          text:              "Product Added Successfully!",
          icon:              "success",
          timer:             2000,
          showConfirmButton: false,
        });

        action.resetForm();
        setColorInput("");
        setOpen(false);
        setPreview([]);
        getProducts();
      } catch (error) {
        setLoading(false);
        Swal.fire({
          icon:  "error",
          title: "Oops...",
          text:  error.response?.data?.message || "Please Check All Details..!",
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

      {/* Modal */}
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

              {/* Segment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Segment *
                </label>
                <input
                  type="text"
                  name="segment"
                  placeholder="e.g., Hawaii, EVA"
                  {...formik.getFieldProps("segment")}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    formik.errors.segment && formik.touched.segment
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                />
                {formik.errors.segment && formik.touched.segment && (
                  <p className="text-red-500 text-xs mt-1">{formik.errors.segment}</p>
                )}
              </div>

              {/* Segment Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Segment Keywords <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="segmentKeywords"
                  placeholder="e.g., hawai, havai, havayi"
                  {...formik.getFieldProps("segmentKeywords")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated</p>
              </div>

              {/* Category / Variant */}
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

              {/* Variant Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Keywords <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="variantKeywords"
                  placeholder="e.g., shuz, shoz, footwear"
                  {...formik.getFieldProps("variantKeywords")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated</p>
              </div>

              {/* Article Name */}
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
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                />
                {formik.errors.articleName && formik.touched.articleName && (
                  <p className="text-red-500 text-xs mt-1">{formik.errors.articleName}</p>
                )}
              </div>

              {/* Article Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Article Keywords <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="articleKeywords"
                  placeholder="e.g., croxy, crocy, krocci"
                  {...formik.getFieldProps("articleKeywords")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated</p>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender *
                </label>
                <div className="flex gap-2">
                  {["gents", "ladies", "kids"].map((g) => {
                    const selected = Array.isArray(formik.values.gender)
                      ? formik.values.gender.includes(g)
                      : false;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          const current = Array.isArray(formik.values.gender)
                            ? formik.values.gender
                            : [];
                          formik.setFieldValue(
                            "gender",
                            current.includes(g)
                              ? current.filter((x) => x !== g)
                              : [...current, g]
                          );
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium capitalize transition-all duration-200 ${
                          selected
                            ? "bg-gray-700 border-gray-700 text-white shadow-md"
                            : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
                {formik.errors.gender && formik.touched.gender && (
                  <p className="text-red-500 text-xs mt-1">{formik.errors.gender}</p>
                )}
              </div>

              {/* ── Colors chip input ───────────────────────────────────────── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Colors <span className="text-gray-400 text-xs">(Optional)</span>
                </label>

                {/* Chip list + inline input */}
                <div
                  className="flex flex-wrap gap-1.5 min-h-[42px] w-full border border-gray-300 rounded-md px-2 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-colors cursor-text"
                  onClick={() => document.getElementById("color-chip-input").focus()}
                >
                  {(formik.values.colors || []).map((color) => (
                    <span
                      key={color}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-medium text-gray-700 capitalize"
                    >
                      {/* Color dot */}
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      {color}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeColor(color); }}
                        className="ml-0.5 text-gray-400 hover:text-gray-700 leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    id="color-chip-input"
                    type="text"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    onKeyDown={handleColorKeyDown}
                    onBlur={() => { if (colorInput.trim()) addColor(colorInput); }}
                    placeholder={
                      (formik.values.colors || []).length === 0
                        ? "Type color and press Enter or comma…"
                        : ""
                    }
                    className="flex-1 min-w-[120px] outline-none bg-transparent text-sm text-gray-700 placeholder-gray-400 py-0.5"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> to add or
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Backspace </kbd> to remove last
                </p>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images
                </label>
                <ImageUploader formik={formik} setPreview={setPreview} />
              </div>

              {/* Preview */}
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

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Buttons */}
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
                  disabled={loading}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-xl hover:bg-gray-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
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