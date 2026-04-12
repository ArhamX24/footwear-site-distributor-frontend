import { FaTrash, FaEdit, FaEye, FaImage, FaTimes, FaTag, FaBox, FaInfoCircle, FaImages, FaCalendarAlt, FaUser } from "react-icons/fa";
import { Package, Tag, Grid3X3, X, Calendar, User, MapPin, Palette, Upload, Save } from "lucide-react";
import Swal from "sweetalert2";
import axios from "axios";
import { useState } from "react";
import { baseURL } from "../../Utils/URLS";

const GENDER_OPTIONS = ["gents", "ladies", "kids"];

const ProductCard = ({ product, setIsDeleted, setisUpdated }) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [editForm, setEditForm] = useState({
    name: product.name,
    segment: product.segment,
    gender: Array.isArray(product.gender)
      ? product.gender
      : product.gender
      ? [product.gender]
      : [],
    variantName: product.variantName,
    existingImages: product.images || [],
    newImages: [],
    segmentKeywords: (product.segmentKeywords || []).join(", "),
    variantKeywords: (product.variantKeywords || []).join(", "),
    articleKeywords: (product.articleKeywords || []).join(", "),
  });
  const [editLoading, setEditLoading] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);

  // ✅ Toggle gender selection
  const toggleGender = (gender, formSetter) => {
    formSetter((prev) => {
      const current = prev.gender || [];
      if (current.includes(gender)) {
        return { ...prev, gender: current.filter((g) => g !== gender) };
      } else {
        return { ...prev, gender: [...current, gender] };
      }
    });
  };

  const handleDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      confirmButtonColor: "#4B5563",
      cancelButtonColor: "#EF4444",
      background: "#1F2937",
      color: "#F9FAFB",
    });

    if (!isConfirmed) return;

    try {
      setLoading(true);
      const res = await axios.delete(
        `${baseURL}/api/v1/admin/products/deleteproduct/${id}`,
        { withCredentials: true }
      );
      if (res.data.result) {
        setIsDeleted((p) => !p);
        Swal.fire({
          title: "Deleted!",
          text: "Your product has been deleted.",
          icon: "success",
          background: "#1F2937",
          color: "#F9FAFB",
          confirmButtonColor: "#4B5563",
        });
      }
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: "Unable to delete. Try again later.",
        icon: "error",
        background: "#1F2937",
        color: "#F9FAFB",
        confirmButtonColor: "#4B5563",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = () => setImageError(true);
  const openModal = () => { setShowModal(true); setCurrentImageIndex(0); };
  const closeModal = () => { setShowModal(false); setCurrentImageIndex(0); };

  const openEditModal = () => {
    setEditForm({
      name: product.name,
      segment: product.segment,
      gender: Array.isArray(product.gender)
        ? product.gender
        : product.gender
        ? [product.gender]
        : [],
      variantName: product.variantName,
      existingImages: product.images || [],
      newImages: [],
      segmentKeywords: (product.segmentKeywords || []).join(", "),
      variantKeywords: (product.variantKeywords || []).join(", "),
      articleKeywords: (product.articleKeywords || []).join(", "),
    });
    setPreviewImages([]);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setPreviewImages([]);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + editForm.existingImages.length + editForm.newImages.length > 10) {
      Swal.fire({ title: "Too Many Images", text: "Maximum 10 images total.", icon: "warning", confirmButtonColor: "#4B5563" });
      return;
    }
    setEditForm((prev) => ({ ...prev, newImages: [...prev.newImages, ...files] }));
    setPreviewImages((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeExistingImage = (index) => {
    setEditForm((prev) => ({ ...prev, existingImages: prev.existingImages.filter((_, i) => i !== index) }));
  };

  const removeNewImage = (index) => {
    setEditForm((prev) => ({ ...prev, newImages: prev.newImages.filter((_, i) => i !== index) }));
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (editForm.existingImages.length + editForm.newImages.length === 0) {
      Swal.fire({ title: "No Images", text: "Please add at least one image.", icon: "warning", confirmButtonColor: "#4B5563" });
      return;
    }

    if (!editForm.gender || editForm.gender.length === 0) {
      Swal.fire({ title: "No Gender Selected", text: "Please select at least one gender.", icon: "warning", confirmButtonColor: "#4B5563" });
      return;
    }

    try {
      setEditLoading(true);
      const formData = new FormData();

      // ✅ FIX: Use correct ID field
      formData.append("articleId", product._id || product.id);

      formData.append("name", editForm.name.trim());
      formData.append("segment", editForm.segment.trim());
      formData.append("variantName", editForm.variantName.trim());
      formData.append("existingImages", JSON.stringify(editForm.existingImages));

      // ✅ FIX: Send gender as array
      editForm.gender.forEach((g) => formData.append("gender", g));

      // ✅ FIX: Split keywords into array before sending
      const segKw = editForm.segmentKeywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
      const varKw = editForm.variantKeywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
      const artKw = editForm.articleKeywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);

      formData.append("segmentKeywords", segKw.join(","));
      formData.append("variantKeywords", varKw.join(","));
      formData.append("articleKeywords", artKw.join(","));

      editForm.newImages.forEach((file) => formData.append("images", file));

      const res = await axios.put(
        `${baseURL}/api/v1/admin/products/updateproduct`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" }, withCredentials: true }
      );

      if (res.data.result) {
        Swal.fire({ title: "Success!", text: "Product updated successfully.", icon: "success", confirmButtonColor: "#4B5563" });
        setisUpdated((prev) => !prev);
        closeEditModal();
      }
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.response?.data?.message || "Unable to update product.",
        icon: "error",
        confirmButtonColor: "#4B5563",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const nextImage = () => {
    if (product.images?.length > 1) setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };
  const prevImage = () => {
    if (product.images?.length > 1) setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-4 hover:bg-gray-50 transition-all duration-200 border-b border-gray-100 last:border-b-0">
        {/* Mobile Layout */}
        <div className="md:hidden space-y-4">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
              {!imageError && product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" onError={handleImageError} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                  <FaImage className="text-gray-500 text-lg" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate capitalize text-lg">{product.name}</h4>
              <p className="text-sm text-gray-600 capitalize">{product.segment}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Tag className="text-gray-500" size={14} />
              <span className="text-sm text-gray-700 capitalize font-medium">{product.variantName}</span>
            </div>
            <div className="flex space-x-2">
              <button onClick={openModal} className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all text-sm font-medium shadow-sm">
                <FaEye className="text-xs" /> View
              </button>
              <button onClick={openEditModal} className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium shadow-sm">
                <FaEdit className="text-xs" /> Edit
              </button>
              <button onClick={() => handleDelete(product._id)} disabled={loading} className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-medium shadow-sm disabled:opacity-50">
                <FaTrash className="text-xs" /> {loading ? "..." : "Delete"}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:contents">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-200">
              {!imageError && product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" onError={handleImageError} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                  <FaImage className="text-gray-500 text-sm" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <Package className="text-gray-500 flex-shrink-0" size={16} />
                <span className="text-sm text-gray-900 font-semibold truncate capitalize">{product.segment}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Product Segment</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Tag className="text-gray-600" size={16} />
            </div>
            <div>
              <span className="text-sm text-gray-900 font-semibold capitalize">{product.variantName}</span>
              <p className="text-xs text-gray-500 mt-1">Category</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Grid3X3 className="text-gray-600" size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm text-gray-900 font-semibold truncate capitalize block">{product.name}</span>
              <p className="text-xs text-gray-500 mt-1">Article Name</p>
            </div>
          </div>

          <div className="flex justify-center items-center space-x-2">
            <button onClick={openModal} className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all text-sm font-medium shadow-sm">
              <FaEye className="text-xs" /> View
            </button>
            <button onClick={openEditModal} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium shadow-sm">
              <FaEdit className="text-xs" /> Edit
            </button>
            <button onClick={() => handleDelete(product._id || product.id)} disabled={loading} className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              <FaTrash className="text-xs" /> {loading ? "..." : "Delete"}
            </button>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-6 text-white relative">
              <button onClick={closeModal} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-all">
                <X size={20} />
              </button>
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-xl"><Package className="text-2xl" size={24} /></div>
                <div>
                  <h2 className="text-2xl font-bold capitalize">{product.name}</h2>
                  <p className="text-gray-200 capitalize">{product.segment} • {product.variantName}</p>
                </div>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FaImages className="text-gray-600" /> Product Images
                  </h3>
                  {product.images?.length > 0 ? (
                    <div className="space-y-4">
                      <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-square">
                        <img src={product.images[currentImageIndex]} alt={`${product.name} - Image ${currentImageIndex + 1}`} className="w-full h-full object-contain" />
                        {product.images.length > 1 && (
                          <>
                            <button onClick={prevImage} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70">←</button>
                            <button onClick={nextImage} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70">→</button>
                          </>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">{currentImageIndex + 1} / {product.images.length}</div>
                      </div>
                      {product.images.length > 1 && (
                        <div className="flex space-x-2 overflow-x-auto pb-2">
                          {product.images.map((image, index) => (
                            <button key={index} onClick={() => setCurrentImageIndex(index)} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex ? "border-gray-600" : "border-gray-200"}`}>
                              <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-100 rounded-xl p-8 text-center aspect-square flex items-center justify-center">
                      <div className="text-gray-500"><FaImage className="text-4xl mb-2 mx-auto" /><p>No images available</p></div>
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FaInfoCircle className="text-gray-600" /> Product Details
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Article Name</span>
                      <span className="text-sm font-semibold text-gray-900 capitalize">{product.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Segment</span>
                      <span className="text-sm font-semibold text-gray-900 capitalize">{product.segment}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Gender</span>
                      <span className="text-sm font-semibold text-gray-900 capitalize">
                        {Array.isArray(product.gender) ? product.gender.join(", ") : product.gender}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Category</span>
                      <span className="text-sm font-semibold text-gray-900 capitalize">{product.variantName}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-6 text-white relative">
              <button onClick={closeEditModal} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-all">
                <X size={20} />
              </button>
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-xl"><FaEdit className="text-2xl" size={24} /></div>
                <div>
                  <h2 className="text-2xl font-bold">Edit Product</h2>
                  <p className="text-gray-100">Update product information</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Article Name <span className="text-red-500">*</span></label>
                    <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent" required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Segment <span className="text-red-500">*</span></label>
                    <input type="text" value={editForm.segment} onChange={(e) => setEditForm({ ...editForm, segment: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent" required />
                  </div>

                  {/* ✅ Gender Multi-Select Toggle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      {GENDER_OPTIONS.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => toggleGender(g, setEditForm)}
                          className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium capitalize transition-all duration-200 ${
                            editForm.gender.includes(g)
                              ? "bg-gray-700 border-gray-700 text-white shadow-md"
                              : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                    {editForm.gender.length === 0 && (
                      <p className="text-red-500 text-xs mt-1">Please select at least one gender</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category Name <span className="text-red-500">*</span></label>
                    <input type="text" value={editForm.variantName} onChange={(e) => setEditForm({ ...editForm, variantName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent" required />
                  </div>
                </div>

                {/* Keywords */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Search Keywords (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Segment Keywords</label>
                      <input type="text" value={editForm.segmentKeywords}
                        onChange={(e) => setEditForm({ ...editForm, segmentKeywords: e.target.value })}
                        placeholder="e.g., hawai, havai, eba"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Category Keywords</label>
                      <input type="text" value={editForm.variantKeywords}
                        onChange={(e) => setEditForm({ ...editForm, variantKeywords: e.target.value })}
                        placeholder="e.g., 5-stud, heera"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Article Keywords</label>
                      <input type="text" value={editForm.articleKeywords}
                        onChange={(e) => setEditForm({ ...editForm, articleKeywords: e.target.value })}
                        placeholder="e.g., croxy, krocci"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Comma-separated. Keywords are saved per article only.</p>
                </div>

                {/* Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Images <span className="text-red-500">*</span></label>
                  {editForm.existingImages.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Existing Images</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {editForm.existingImages.map((img, index) => (
                          <div key={`existing-${index}`} className="relative group">
                            <img src={img} alt={`Existing ${index + 1}`} className="w-full h-24 object-cover rounded-lg border-2 border-gray-200" />
                            <button type="button" onClick={() => removeExistingImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {previewImages.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">New Images</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {previewImages.map((preview, index) => (
                          <div key={`new-${index}`} className="relative group">
                            <img src={preview} alt={`New ${index + 1}`} className="w-full h-24 object-cover rounded-lg border-2 border-blue-400" />
                            <button type="button" onClick={() => removeNewImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
                    <input type="file" id="image-upload" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center space-y-2">
                      <Upload className="text-gray-400" size={32} />
                      <span className="text-sm text-gray-600">Click to upload new images</span>
                      <span className="text-xs text-gray-500">Maximum 10 images total (Current: {editForm.existingImages.length + editForm.newImages.length})</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button type="button" onClick={closeEditModal} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium">Cancel</button>
                  <button type="submit" disabled={editLoading} className="flex items-center gap-2 px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                    <Save size={18} />
                    {editLoading ? "Updating..." : "Update Product"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;