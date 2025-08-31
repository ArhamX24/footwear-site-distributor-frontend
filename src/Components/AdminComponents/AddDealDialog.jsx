import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useFormik } from "formik";
import axios from "axios";
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";
import { baseURL } from "../../Utils/URLS";

const AddDealDialog = () => {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [articleSearch, setArticleSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [products, setProducts] = useState(null)

  const handleOpen = useCallback(() => setOpen((o) => !o), []);
  const handleSelectArticle = useCallback((article) => {
    setSelectedArticle(article);
    setDropdownOpen(false);
    setArticleSearch("");
  }, []);

  const getAllProducts = async () => {
    try {
      let response = await axios.get(
        `${baseURL}/api/v1/admin/products/getproducts`
      );
      setProducts(response.data.data);
    } catch (error) {
      console.error(error.response?.data);
    }
  }
  
  useEffect(() => {
    getAllProducts()
  }, [])
  
 // 1) Now use `products` directly
  const flattenedArticles = Array.isArray(products) ? products : [];

  // 2) Filter that flat list by search term
  const filteredArticles = useMemo(() => {
    const term = articleSearch.trim().toLowerCase();
    if (!term) return flattenedArticles;
    return flattenedArticles.filter((a) =>
      // adjust this to the actual field name your controller returns:
      (a.name || a.articleName || "")
        .toLowerCase()
        .includes(term)
    );
  }, [articleSearch, flattenedArticles]);

  const formik = useFormik({
    initialValues: {
      startDate: "",
      endDate: "",
      noOfPurchase: "",
      reward: "",
      images: [],
    },
    onSubmit: async (values, action) => {
      if (!selectedArticle) {
        Swal.fire("Select an article first", "", "warning");
        return;
      }

      try {
        setLoading(true);
        const formData = new FormData();
        formData.append("articleId", selectedArticle._id);
        formData.append("articleName", selectedArticle.name);
        formData.append("variant", selectedArticle.variantName);
        formData.append("start", values.startDate);
        formData.append("end", values.endDate);
        formData.append("noOfPurchase", values.noOfPurchase);
        formData.append("reward", values.reward);
        values.images.forEach((img) => formData.append("images", img));

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

        Swal.fire("Success!", "Deal Added Successfully!", "success");
        action.resetForm();
        setSelectedArticle(null);
        setOpen(false);
      } catch (err) {
        Swal.fire("Error", err.message || "Something went wrong", "error");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <>
      <button
        onClick={handleOpen}
        className="bg-gray-600 text-white px-4 py-2 hover:bg-gray-700 rounded-full border transition duration-200 w-full text-sm font-medium
        "
      >
       + Add New Deal
      </button>

      {open && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-gray-900/50 z-10"
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-96"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Add Deal</h2>
                    <button
                      onClick={ ()=> setOpen(false)}
                      className="text-gray-500 hover:text-gray-700 text-lg font-bold px-2 py rounded-full border"
                    >
                      ×
                    </button>
                  </div>
            
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              {/* Article Selection Dropdown */}
              <div className="relative w-full">
                <label className="block text-sm font-medium">
                  Select Article
                </label>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 flex items-center justify-between"
                >
                  {selectedArticle
                    ? `${selectedArticle.name} (${selectedArticle.variantName})`
                    : "Choose an article"}
                  <span className="ml-2">&#x25BC;</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute mt-2 w-full bg-white shadow-lg rounded-md overflow-y-scroll h-48">
                    <div className="p-2 border-b">
                      <input
                        type="text"
                        placeholder="Search article..."
                        className="w-full border border-gray-300 rounded-md px-2 py-1"
                        value={articleSearch}
                        onChange={(e) => setArticleSearch(e.target.value)}
                      />
                    </div>
                    {filteredArticles.length > 0 ? (
                      filteredArticles.map((article, idx) => (
                        <div
                          key={`${article._id}-${idx}`}
                          onClick={() => handleSelectArticle(article)}
                          className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                        >
                          <img
                            src={article.image || article.images?.[0]}
                            alt={article.name}
                            className="w-10 h-10 object-cover rounded-md mr-3"
                          />
                          <span className="capitalize">
                            {article.name}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-gray-500">
                        No articles found.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dates, Purchases, Reward, Image Upload */}
              <div className="flex gap-4">
                <input
                  type="date"
                  name="startDate"
                  min={today}
                  onChange={formik.handleChange}
                  value={formik.values.startDate}
                  className="w-1/2 border border-gray-300 rounded-md px-3 py-2"
                />
                <input
                  type="date"
                  name="endDate"
                  min={formik.values.startDate || today}
                  onChange={formik.handleChange}
                  value={formik.values.endDate}
                  className="w-1/2 border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Number of Cartons Required For Reward
                </label>
                <input
                  type="number"
                  name="noOfPurchase"
                  placeholder="e.g. 3"
                  onChange={formik.handleChange}
                  value={formik.values.noOfPurchase}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Reward
                </label>
                <input
                  type="text"
                  name="reward"
                  placeholder="e.g., Free Fridge"
                  onChange={formik.handleChange}
                  value={formik.values.reward}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Upload Image Of Deal
                </label>
                <input
                  type="file"
                  name="images"
                  accept="image/*"
                  className="w-full border px-3 py-2 rounded-md"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    formik.setFieldValue("images", files);
                  }}
                />
              </div>

              <button
                type="submit"
                className="bg-gray-700 text-white px-4 py-2 rounded-xl hover:bg-gray-600 transition duration-200 w-full"
                disabled={loading}
              >
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