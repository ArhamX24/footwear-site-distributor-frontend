import axios from "axios";
import Swal from "sweetalert2";
import { FaTrash, FaEdit, FaSave, FaTimes, FaPhone, FaUser, FaTruck, FaFileInvoice } from "react-icons/fa";
import { useState } from "react";
import { useFormik } from "formik";
import { baseURL } from "../../Utils/URLS";

const DistributorCard = ({ distributor, setIsDeleted, setIsUpdated }) => {
  const [updateModalOpen, setUpdateModalOpen] = useState(false);

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
          const response = await axios.delete(
            `${baseURL}/api/v1/admin/distributor/delete/${id}`,
            { withCredentials: true }
          );
          if (response.data.result) {
            Swal.fire({
              title: "Deleted!",
              text: "Distributor has been deleted.",
              icon: "success",
              background: "#1F2937",
              color: "#F9FAFB",
              confirmButtonColor: "#4B5563",
            });
            setIsDeleted((prev) => !prev); 
          }
        }
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: `${error.response?.data?.message || "Something went wrong!"}`,
        background: "#1F2937",
        color: "#F9FAFB",
        confirmButtonColor: "#4B5563",
      });
    }
  };

  const formik = useFormik({
    initialValues: {
      billNo: distributor?.billNo || "",
      partyName: distributor?.partyName || "",
      transport: distributor?.transport || "",
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const response = await axios.patch(
          `${baseURL}/api/v1/admin/distributor/update/${distributor?._id}`,
          values,
          { withCredentials: true }
        );

        if (response.data.result) {
          Swal.fire({
            title: "Updated!",
            text: "Distributor has been updated!",
            icon: "success",
            background: "#1F2937",
            color: "#F9FAFB",
            confirmButtonColor: "#4B5563",
          });
          setIsUpdated(true);
          setUpdateModalOpen(false);
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: `${error.response?.data?.message || "Something went wrong!"}`,
          background: "#1F2937",
          color: "#F9FAFB",
          confirmButtonColor: "#4B5563",
        });
      }
    },
  });

  return (
    <div className="group relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-300 overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FaUser className="text-gray-200" />
            <h3 className="text-lg font-bold truncate">
              {distributor?.partyName || "No Name"}
            </h3>
          </div>
          <div className="opacity-70 group-hover:opacity-100 transition-opacity">
            <FaFileInvoice />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Phone Number */}
        <div className="flex items-center space-x-3 text-gray-700">
          <FaPhone className="text-gray-500 text-sm" />
          <span className="text-sm font-medium">
            {distributor?.phoneNo || "N/A"}
          </span>
        </div>

        {/* Bill Number */}
        {distributor?.billNo && (
          <div className="flex items-center space-x-3 text-gray-700">
            <FaFileInvoice className="text-gray-500 text-sm" />
            <span className="text-sm">Bill: {distributor.billNo}</span>
          </div>
        )}

        {/* Transport */}
        {distributor?.transport && (
          <div className="flex items-center space-x-3 text-gray-700">
            <FaTruck className="text-gray-500 text-sm" />
            <span className="text-sm">Transport: {distributor.transport}</span>
          </div>
        )}
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
            onClick={() => handleDelete(distributor?._id)}
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
                Update Distributor
              </h2>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <form onSubmit={formik.handleSubmit} className="space-y-4">
                {/* Bill No */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FaFileInvoice className="text-gray-500" />
                    Bill No:
                  </label>
                  <input
                    type="text"
                    name="billNo"
                    value={formik.values.billNo}
                    onChange={formik.handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                    placeholder="Enter bill number"
                  />
                </div>

                {/* Party Name */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FaUser className="text-gray-500" />
                    Party Name:
                  </label>
                  <input
                    type="text"
                    name="partyName"
                    value={formik.values.partyName}
                    onChange={formik.handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                    placeholder="Enter party name"
                  />
                </div>

                {/* Transport */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FaTruck className="text-gray-500" />
                    Transport:
                  </label>
                  <input
                    type="text"
                    name="transport"
                    value={formik.values.transport}
                    onChange={formik.handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                    placeholder="Enter transport details"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setUpdateModalOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all font-medium"
                  >
                    <FaTimes />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-medium"
                  >
                    <FaSave />
                    Save Changes
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

export default DistributorCard;