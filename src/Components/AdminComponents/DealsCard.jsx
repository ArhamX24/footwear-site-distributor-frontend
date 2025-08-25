import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaTrash, FaEdit, FaSave, FaTimes, FaClock, FaCalendarAlt, FaTag, FaImage } from "react-icons/fa";
import { useFormik } from "formik";
import { CircularProgress } from "@mui/material";
import { baseURL } from "../../Utils/URLS";

const DealsCard = ({ deal, setIsDeleted, setIsUpdated }) => {
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Function to calculate remaining days
  const calculateRemainingDays = () => {
    const endDate = new Date(deal?.endDate);
    const today = new Date();
    const differenceInTime = endDate - today;
    const remainingDays = Math.ceil(differenceInTime / (1000 * 60 * 60 * 24));
    return remainingDays > 0 ? remainingDays : 0;
  };

  // Function to get deal status color and text
  const getDealStatus = () => {
    const remainingDays = calculateRemainingDays();
    if (remainingDays === 0) {
      return { color: "text-red-600 bg-red-50", text: "Expired" };
    } else if (remainingDays <= 3) {
      return { color: "text-orange-600 bg-orange-50", text: "Ending Soon" };
    } else if (remainingDays <= 7) {
      return { color: "text-yellow-600 bg-yellow-50", text: "Active" };
    } else {
      return { color: "text-green-600 bg-green-50", text: "Active" };
    }
  };

  const handleDelete = async (id) => {
    try {
      await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#4B5563",
        cancelButtonColor: "#EF4444",
        confirmButtonText: "Yes, delete it!",
        background: "#1F2937",
        color: "#F9FAFB",
      }).then(async (result) => {
        if (result.isConfirmed) {
          await axios.delete(`${baseURL}/api/v1/admin/deal/delete/${id}`, {
            withCredentials: true,
          });
          Swal.fire({
            title: "Deleted!",
            text: "Deal has been deleted.",
            icon: "success",
            background: "#1F2937",
            color: "#F9FAFB",
            confirmButtonColor: "#4B5563",
          });
          setIsDeleted((prev) => !prev);
        }
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.response?.data?.message || "Something went wrong!",
        background: "#1F2937",
        color: "#F9FAFB",
        confirmButtonColor: "#4B5563",
      });
    }
  };

  const formik = useFormik({
    initialValues: {
      startDate: deal?.startDate ? new Date(deal.startDate).toISOString().split("T")[0] : "",
      endDate: deal?.endDate ? new Date(deal.endDate).toISOString().split("T")[0] : "",
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const response = await axios.patch(
          `${baseURL}/api/v1/admin/deal/update/${deal?._id}`,
          values,
          { withCredentials: true }
        );

        if (response.data.result) {
          setLoading(false);
          Swal.fire({
            title: "Updated!",
            text: "Deal has been successfully updated.",
            icon: "success",
            background: "#1F2937",
            color: "#F9FAFB",
            confirmButtonColor: "#4B5563",
          });
          setUpdateModalOpen(false);
          setIsUpdated(true);
        }
      } catch (error) {
        setLoading(false);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: error.response?.data?.message || "Something went wrong!",
          background: "#1F2937",
          color: "#F9FAFB",
          confirmButtonColor: "#4B5563",
        });
      }
    },
  });

  const status = getDealStatus();
  const remainingDays = calculateRemainingDays();

  return (
    <div className="group relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-300 overflow-hidden">
      {/* Status Badge */}
      <div className="absolute top-3 right-3 z-10">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color} border`}>
          {status.text}
        </span>
      </div>

      {/* Image Container with Gradient Overlay */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={deal?.image}
          alt={deal?.articleName || "Product Image"}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        {/* Fallback for missing image */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center" style={{display: 'none'}}>
          <FaImage className="text-4xl text-white opacity-50" />
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Article Name */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-1 capitalize">
            {deal?.articleName || "No Name"}
          </h3>
        </div>

        {/* Deal Info */}
        <div className="space-y-2">
          {/* Remaining Days */}
          <div className="flex items-center space-x-2 text-gray-600">
            <FaClock className="text-sm text-gray-500" />
            <span className="text-sm font-medium">
              {remainingDays === 0 ? "Deal Expired" : `${remainingDays} days remaining`}
            </span>
          </div>

          {/* Date Range (if available) */}
          {deal?.startDate && deal?.endDate && (
            <div className="flex items-center space-x-2 text-gray-500">
              <FaCalendarAlt className="text-xs" />
              <span className="text-xs">
                {new Date(deal.startDate).toLocaleDateString()} - {new Date(deal.endDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Deal Progress</span>
            <span>{remainingDays === 0 ? "100%" : `${Math.max(0, 100 - (remainingDays * 10))}%`}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                remainingDays === 0 ? 'bg-red-500' : 
                remainingDays <= 3 ? 'bg-orange-500' : 
                remainingDays <= 7 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ 
                width: remainingDays === 0 ? '100%' : `${Math.min(100, Math.max(10, 100 - (remainingDays * 5)))}%` 
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setUpdateModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 text-sm font-medium shadow-sm"
          >
            <FaEdit className="text-xs" />
            Update
          </button>
          <button
            onClick={() => handleDelete(deal?._id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 text-sm font-medium shadow-sm"
          >
            <FaTrash className="text-xs" />
            Delete
          </button>
        </div>
      </div>

      {/* Update Modal */}
      {updateModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-4 text-white">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FaEdit />
                Update Deal
              </h2>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <form onSubmit={formik.handleSubmit} className="space-y-4">
                {/* Start Date */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FaCalendarAlt className="text-gray-500" />
                    Start Date:
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formik.values.startDate}
                    onChange={formik.handleChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FaCalendarAlt className="text-gray-500" />
                    End Date:
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formik.values.endDate}
                    onChange={formik.handleChange}
                    min={formik.values.startDate || new Date().toISOString().split("T")[0]}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setUpdateModalOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all font-medium"
                    disabled={loading}
                  >
                    <FaTimes />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-medium"
                    disabled={loading}
                  >
                    {loading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <>
                        <FaSave />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealsCard;