import axios from "axios";
import Swal from "sweetalert2";
import { FaTrash, FaEdit, FaSave, FaTimes, FaPhone, FaUser, FaTruck, FaFileInvoice, FaEye, FaLock, FaMapMarkerAlt, FaUserTie } from "react-icons/fa";
import { useState } from "react";
import { useFormik } from "formik";
import { baseURL } from "../../Utils/URLS";

const DistributorCard = ({ distributor, setIsDeleted, setIsUpdated }) => {
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [distributorDetails, setDistributorDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleViewDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${baseURL}/api/v1/admin/users/details/${distributor?._id}`,
        { withCredentials: true }
      );
      
      if (response.data.result) {
        console.log(response.data.data);
        
        setDistributorDetails(response.data.data);
        setViewModalOpen(true);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to fetch details",
        background: "#1F2937",
        color: "#F9FAFB",
        confirmButtonColor: "#4B5563",
      });
    } finally {
      setLoading(false);
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
            <h3 className="text-lg font-bold truncate capitalize">
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
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleViewDetails}
            disabled={loading}
            className="flex items-center justify-center gap-1 px-2 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all duration-200 text-xs font-medium shadow-sm disabled:bg-gray-400"
          >
            <FaEye className="text-xs" />
            {loading ? "..." : "View"}
          </button>
          <button
            onClick={() => setUpdateModalOpen(true)}
            className="flex items-center justify-center gap-1 px-2 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 text-xs font-medium shadow-sm"
          >
            <FaEdit className="text-xs" />
            Update
          </button>
          <button
            onClick={() => handleDelete(distributor?._id)}
            className="flex items-center justify-center gap-1 px-2 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 text-xs font-medium shadow-sm"
          >
            <FaTrash className="text-xs" />
            Delete
          </button>
        </div>
      </div>

      {/* View Details Modal */}
      {viewModalOpen && distributorDetails && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 text-white sticky top-0 z-10">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FaEye />
                Distributor Full Details
              </h2>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Info Grid */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 font-medium capitalize">Party Name</label>
                  <p className="text-gray-900 font-semibold mt-1 capitalize">{distributorDetails.partyName || "N/A"}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 font-medium">Phone No</label>
                  <p className="text-gray-900 font-semibold mt-1">{distributorDetails.phoneNo || "N/A"}</p>
                </div>

                {/* ✅ PASSWORD - DARK GRAY THEME */}
                <div className="bg-gray-700 p-4 rounded-lg border-2 border-gray-600">
                  <label className="text-xs text-gray-300 font-medium flex items-center gap-1">
                    <FaLock className="text-xs" />
                    Password
                  </label>
                  <p className="text-white font-bold text-lg mt-2 font-mono tracking-wider break-all">
                    {distributorDetails.password || "Not available"}
                  </p>
                </div>

                {/* ✅ SALESMAN NAME */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 font-medium flex items-center gap-1">
                    <FaUserTie className="text-xs" />
                    Salesman Name
                  </label>
                  <p className="text-gray-900 font-semibold mt-1 capitalize">{distributorDetails.salesmanName || "N/A"}</p>
                </div>

                {/* ✅ CITY NAME */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 font-medium flex items-center gap-1">
                    <FaMapMarkerAlt className="text-xs" />
                    City
                  </label>
                  <p className="text-gray-900 font-semibold mt-1">{distributorDetails.cityName || "N/A"}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 font-medium">Transport</label>
                  <p className="text-gray-900 font-semibold mt-1">{distributorDetails.transport || "N/A"}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 font-medium">Total Purchases</label>
                  <p className="text-gray-900 font-semibold mt-1">{distributorDetails.totalPurchases || 0}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 font-medium">Total Shipments</label>
                  <p className="text-gray-900 font-semibold mt-1">{distributorDetails.totalShipments || 0}</p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setViewModalOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all font-medium"
              >
                <FaTimes />
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal (unchanged) */}
      {updateModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-4 text-white">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FaEdit />
                Update Distributor
              </h2>
            </div>

            <div className="p-6">
              <form onSubmit={formik.handleSubmit} className="space-y-4">
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
