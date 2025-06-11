import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaTrash, FaEdit, FaSave, FaTimes } from "react-icons/fa";
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
    const remainingDays = Math.ceil(differenceInTime / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
    return remainingDays > 0 ? remainingDays : 0; // Ensure non-negative output
  };

  const handleDelete = async (id) => {
    try {
      await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      }).then(async (result) => {
        if (result.isConfirmed) {
          await axios.delete(`https://${baseURL}/api/v1/admin/deal/delete/${id}`, {
            withCredentials: true,
          });
          Swal.fire({
            title: "Deleted!",
            text: "Deal has been deleted.",
            icon: "success",
          });
          setIsDeleted(true);
        }
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.response?.data?.message || "Something went wrong!",
      });
    }
  };

  const formik = useFormik({
    initialValues: {
      startDate: deal?.startDate || "",
      endDate: deal?.endDate || "",
    },
    enableReinitialize: true, // Ensures existing deal dates are pre-filled
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const response = await axios.patch(
          `https://${baseURL}/api/v1/admin/deal/update/${deal?._id}`,
          values,
          { withCredentials: true }
        );

        if (response.data.result) {
          setLoading(false);
          Swal.fire({
            title: "Updated!",
            text: "Deal has been successfully updated.",
            icon: "success",
          });
          setUpdateModalOpen(false);
          setIsUpdated(true);
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: error.response?.data?.message || "Something went wrong!",
        });
      }
    },
  });

  return (
    <div className="w-full h-fit lg:w-64 bg-gray-100 p-4 rounded-2xl shadow-lg flex flex-col justify-between my-3">
      {/* Update Modal */}
      {updateModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800/50 z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaEdit /> Update Deal
            </h2>

            <form onSubmit={formik.handleSubmit}>
              {/* Start Date */}
              <label className="block mb-3">
                <span className="font-medium">Start Date:</span>
                <input
                  type="date"
                  name="startDate"
                  value={formik.values.startDate}
                  onChange={formik.handleChange}
                  min={new Date().toISOString().split("T")[0]} // Prevents past date selection
                  className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-indigo-500"
                />
              </label>

              {/* End Date */}
              <label className="block mb-3">
                <span className="font-medium">End Date:</span>
                <input
                  type="date"
                  name="endDate"
                  value={formik.values.endDate}
                  onChange={formik.handleChange}
                  min={formik.values.startDate || new Date().toISOString().split("T")[0]} // Prevents earlier than start date selection
                  className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-indigo-500"
                />
              </label>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setUpdateModalOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                >
                  <FaTimes /> Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                >
                  {loading ? <CircularProgress /> : <> <FaSave /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Container */}
      <div className="flex justify-center">
        <img
          src={deal?.image}
          alt={deal?.productName || "Product Image"}
          className="w-4/5 h-32 rounded-2xl object-cover"
        />
      </div>

      {/* Product Details */}
      <div className="text-center mt-2">
        <h3 className="text-lg font-bold text-gray-900">{deal?.articleName || "No Name"}</h3>
        <p className="text-sm text-gray-700">
          {calculateRemainingDays()} days remaining of deal
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center items-center mt-3 space-x-3">
        <button
          onClick={() => setUpdateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
        >
          <FaEdit /> Update
        </button>
        <button
          onClick={() => handleDelete(deal?._id)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
        >
          <FaTrash /> Delete
        </button>
      </div>
    </div>
  );
};

export default DealsCard;