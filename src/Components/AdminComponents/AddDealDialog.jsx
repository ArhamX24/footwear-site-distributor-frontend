import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useFormik } from "formik";
import axios from "axios";
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";
import { baseURL } from "../../Utils/URLS";
import { FaBoxOpen, FaLayerGroup } from "react-icons/fa";

const AddDealDialog = ({ setIsAdded }) => {
  const [open, setOpen] = useState(false);
  const [dealType, setDealType] = useState("article"); // 'article' or 'segment'
  const [segments, setSegments] = useState([]);
  const [articles, setArticles] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  // Fetch segments and articles on mount
  useEffect(() => {
    if (open) {
      fetchSegments();
      fetchArticles();
    }
  }, [open]);

  // Fetch only articles
const fetchArticles = async () => {
  try {
    const response = await axios.get(
      `${baseURL}/api/v1/admin/products/getproducts?format=articles`,
      { withCredentials: true }
    );
    if (response.data.result) {
      setArticles(response.data.data);
    }
  } catch (error) {
    console.error("Error fetching articles:", error);
  }
};

// Fetch only segments
const fetchSegments = async () => {
  try {
    const response = await axios.get(
      `${baseURL}/api/v1/admin/products/getproducts?format=segments`,
      { withCredentials: true }
    );
    if (response.data.result) {
      setSegments(response.data.data);
    }
  } catch (error) {
    console.error("Error fetching segments:", error);
  }
};


  // Filter items based on search
  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    
    if (dealType === 'segment') {
      if (!term) return segments;
      return segments.filter(seg => seg.toLowerCase().includes(term));
    } else {
      if (!term) return articles;
      return articles.filter(article => 
        article.name.toLowerCase().includes(term) ||
        article.variantName.toLowerCase().includes(term)
      );
    }
  }, [searchTerm, dealType, segments, articles]);

  const handleSelectItem = useCallback((item) => {
    if (dealType === 'segment') {
      setSelectedSegment(item);
      setSelectedArticle(null);
    } else {
      setSelectedArticle(item);
      setSelectedSegment(null);
    }
    setDropdownOpen(false);
    setSearchTerm("");
  }, [dealType]);

  const formik = useFormik({
    initialValues: {
      startDate: "",
      endDate: "",
      noOfPurchase: "",
      reward: "",
      images: [],
    },
    onSubmit: async (values, action) => {
      if (dealType === 'segment' && !selectedSegment) {
        Swal.fire("Select a segment first", "", "warning");
        return;
      }
      
      if (dealType === 'article' && !selectedArticle) {
        Swal.fire("Select an article first", "", "warning");
        return;
      }

      try {
        setLoading(true);
        const formData = new FormData();
        
        formData.append("dealType", dealType);
        
        if (dealType === 'segment') {
          formData.append("segmentName", selectedSegment);
          formData.append("articleName", `All ${selectedSegment} products`);
        } else {
          formData.append("articleId", selectedArticle._id);
          formData.append("articleName", selectedArticle.name);
          formData.append("variantName", selectedArticle.variantName);
        }
        
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

        Swal.fire("Success!", response.data.message, "success");
        action.resetForm();
        setSelectedSegment(null);
        setSelectedArticle(null);
        setDealType("article");
        setOpen(false);
        setIsAdded(true);
      } catch (err) {
        Swal.fire("Error", err.response?.data?.message || err.message || "Something went wrong", "error");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-gray-600 text-white px-4 py-2 hover:bg-gray-700 rounded-full border transition duration-200 w-full text-sm font-medium"
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
              <h2 className="text-xl font-bold">Add New Deal</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-lg font-bold px-2 py rounded-full border"
              >
                ×
              </button>
            </div>

            <form onSubmit={formik.handleSubmit} className="space-y-4">
              {/* Deal Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Deal Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDealType("article");
                      setSelectedSegment(null);
                      setSelectedArticle(null);
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition ${
                      dealType === "article"
                        ? "border-gray-600 bg-gray-50 text-gray-900"
                        : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    <FaBoxOpen />
                    <span className="font-medium">Single Article</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDealType("segment");
                      setSelectedSegment(null);
                      setSelectedArticle(null);
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition ${
                      dealType === "segment"
                        ? "border-gray-600 bg-gray-50 text-gray-900"
                        : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    <FaLayerGroup />
                    <span className="font-medium">Whole Segment</span>
                  </button>
                </div>
              </div>

              {/* Selection Dropdown */}
              <div className="relative w-full">
                <label className="block text-sm font-medium mb-1">
                  {dealType === 'segment' ? 'Select Segment' : 'Select Article'}
                </label>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 flex items-center justify-between hover:border-gray-400"
                >
                  <span className="truncate">
                    {dealType === 'segment' 
                      ? (selectedSegment || "Choose a segment")
                      : (selectedArticle 
                          ? `${selectedArticle.name} (${selectedArticle.variantName})`
                          : "Choose an article")
                    }
                  </span>
                  <span className="ml-2">&#x25BC;</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute mt-2 w-full bg-white shadow-lg rounded-md border border-gray-200 z-10 max-h-64 overflow-hidden">
                    <div className="p-2 border-b">
                      <input
                        type="text"
                        placeholder={`Search ${dealType}...`}
                        className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="overflow-y-auto max-h-48">
                      {filteredItems.length > 0 ? (
                        dealType === 'segment' ? (
                          filteredItems.map((segment, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleSelectItem(segment)}
                              className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                            >
                              <div className="flex items-center gap-2">
                                <FaLayerGroup className="text-gray-600" />
                                <span className="capitalize font-medium">{segment}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          filteredItems.map((article, idx) => (
                            <div
                              key={`${article._id}-${idx}`}
                              onClick={() => handleSelectItem(article)}
                              className="flex items-center p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                            >
                              <img
                                src={article.images?.[0]}
                                alt={article.name}
                                className="w-12 h-12 object-cover rounded-md mr-3"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/50';
                                }}
                              />
                              <div>
                                <p className="font-medium capitalize">{article.name}</p>
                                <p className="text-xs text-gray-500">
                                  {article.variantName} • {article.segmentName}
                                </p>
                              </div>
                            </div>
                          ))
                        )
                      ) : (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No {dealType}s found.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    min={today}
                    onChange={formik.handleChange}
                    value={formik.values.startDate}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    min={formik.values.startDate || today}
                    onChange={formik.handleChange}
                    value={formik.values.endDate}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
              </div>

              {/* Number of Cartons */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Number of Cartons Required
                </label>
                <input
                  type="number"
                  name="noOfPurchase"
                  placeholder="e.g., 5"
                  onChange={formik.handleChange}
                  value={formik.values.noOfPurchase}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  min="1"
                  required
                />
              </div>

              {/* Reward */}
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
                  required
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Upload Deal Image
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
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="bg-gray-700 text-white px-4 py-3 rounded-xl hover:bg-gray-600 transition duration-200 w-full font-medium"
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Add Deal"
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
