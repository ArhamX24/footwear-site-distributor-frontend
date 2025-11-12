import { FaTrash, FaEdit, FaEye, FaImage, FaTimes, FaTag, FaBox, FaInfoCircle, FaImages, FaCalendarAlt, FaUser } from "react-icons/fa";
import { Package, Tag, Grid3X3, X, Calendar, User, MapPin, Palette } from "lucide-react";
import Swal from "sweetalert2";
import axios from "axios";
import { useState } from "react";
import { baseURL } from "../../Utils/URLS";

const ProductCard = ({ product, setIsDeleted, setIsUpdated }) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const handleImageError = () => {
    setImageError(true);
  };

  const openModal = () => {
    setShowModal(true);
    setCurrentImageIndex(0);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (product.images && product.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product.images && product.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-4 hover:bg-gray-50 transition-all duration-200 border-b border-gray-100 last:border-b-0">
        {/* Mobile Layout - Stacked */}
        <div className="md:hidden space-y-4">
          {/* Product Image and Basic Info */}
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
              {!imageError && product.images && product.images[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                  <FaImage className="text-gray-500 text-lg" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate capitalize text-lg">
                {product.name}
              </h4>
              <p className="text-sm text-gray-600 capitalize">{product.segment}</p>
            </div>
          </div>

          {/* Category and Actions */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Tag className="text-gray-500" size={14} />
                <span className="text-sm text-gray-700 capitalize font-medium">
                  {product.variantName}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={openModal}
                className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all text-sm font-medium shadow-sm"
              >
                <FaEye className="text-xs" />
                View
              </button>
              <button
                onClick={() => handleDelete(product._id)}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-medium shadow-sm disabled:opacity-50"
              >
                <FaTrash className="text-xs" />
                {loading ? "..." : "Delete"}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Layout - Grid */}
        <div className="hidden md:contents">
          {/* Segment with thumbnail */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-200">
              {!imageError && product.images && product.images[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                  <FaImage className="text-gray-500 text-sm" />
                </div>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <Package className="text-gray-500 flex-shrink-0" size={16} />
                <span className="text-sm text-gray-900 font-semibold truncate capitalize">
                  {product.segment}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Product Segment</p>
            </div>
          </div>

          {/* Category (variant name) */}
          <div className="flex items-center space-x-3">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Tag className="text-gray-600" size={16} />
            </div>
            <div>
              <span className="text-sm text-gray-900 font-semibold truncate capitalize">
                {product.variantName}
              </span>
              <p className="text-xs text-gray-500 mt-1">Category</p>
            </div>
          </div>

          {/* Article Name */}
          <div className="flex items-center space-x-3">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Grid3X3 className="text-gray-600" size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm text-gray-900 font-semibold truncate capitalize block">
                {product.name}
              </span>
              <p className="text-xs text-gray-500 mt-1">Article Name</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center items-center space-x-2">
            <button
              onClick={openModal}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all text-sm font-medium shadow-sm"
              title="View Details"
            >
              <FaEye className="text-xs" />
              View
            </button>
            
            <button
              onClick={() => handleDelete(product._id)}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete Product"
            >
              <FaTrash className="text-xs" />
              {loading ? "..." : "Delete"}
            </button>
          </div>
        </div>
      </div>

      {/* Article Details Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-6 text-white relative">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-all"
              >
                <X size={20} />
              </button>
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Package className="text-2xl" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold capitalize">{product.name}</h2>
                  <p className="text-gray-200 capitalize">{product.segment} • {product.variantName}</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Image Gallery */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FaImages className="text-gray-600" />
                    Product Images
                  </h3>
                  
                  {product.images && product.images.length > 0 ? (
                    <div className="space-y-4">
                      {/* Main Image */}
                      <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-square">
                        <img
                          src={product.images[currentImageIndex]}
                          alt={`${product.name} - Image ${currentImageIndex + 1}`}
                          className="w-full h-full bg-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center" style={{display: 'none'}}>
                          <FaImage className="text-4xl text-white opacity-50" />
                        </div>
                        
                        {/* Navigation Arrows */}
                        {product.images.length > 1 && (
                          <>
                            <button
                              onClick={prevImage}
                              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all"
                            >
                              ←
                            </button>
                            <button
                              onClick={nextImage}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all"
                            >
                              →
                            </button>
                          </>
                        )}
                        
                        {/* Image Counter */}
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                          {currentImageIndex + 1} / {product.images.length}
                        </div>
                      </div>
                      
                      {/* Thumbnail Strip */}
                      {product.images.length > 1 && (
                        <div className="flex space-x-2 overflow-x-auto pb-2">
                          {product.images.map((image, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                index === currentImageIndex ? 'border-gray-600' : 'border-gray-200'
                              }`}
                            >
                              <img
                                src={image}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-100 rounded-xl p-8 text-center aspect-square flex items-center justify-center">
                      <div className="text-gray-500">
                        <FaImage className="text-4xl mb-2 mx-auto" />
                        <p>No images available</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FaInfoCircle className="text-gray-600" />
                    Product Details
                  </h3>

                  <div className="space-y-4">
                    {/* Basic Info */}
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
                        <span className="text-sm font-medium text-gray-600">Category</span>
                        <span className="text-sm font-semibold text-gray-900 capitalize">{product.variantName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;