import axios from "axios";
import Swal from "sweetalert2";
import { FaTrash, FaEdit, FaSave, FaTimes } from "react-icons/fa";
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
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      }).then(async (result) => {
        if (result.isConfirmed) {
          const response = await axios.delete(
            `http://${baseURL}/api/v1/admin/distributor/delete/${id}`,
            { withCredentials: true }
          );
          if (response.data.result) {
            Swal.fire({
              title: "Deleted!",
              text: "Distributor has been deleted.",
              icon: "success",
            });
            setIsDeleted(true);
          }
        }
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: `${error.response?.data?.message || "Something went wrong!"}`,
      });
    }
  };

  const formik = useFormik({
    initialValues: {
      billNo: distributor?.billNo || "",
      partyName: distributor?.partyName || "",
      transport: distributor?.transport || "",
    },
    enableReinitialize: true, // ✅ Ensures data updates when modal opens
    onSubmit: async (values) => {
      try {
        const response = await axios.patch(
          `http://localhost:8080/api/v1/admin/distributor/update/${distributor?._id}`,
          values,
          { withCredentials: true }
        );

        if (response.data.result) {
          Swal.fire({
            title: "Updated!",
            text: "Distributor has been updated!",
            icon: "success",
          });
          setIsUpdated(true);
          setUpdateModalOpen(false);
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: `${error.response?.data?.message || "Something went wrong!"}`,
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
            <h2 className="text-lg font-semibold mb-4">Update Distributor</h2>
            <form onSubmit={formik.handleSubmit}>
              {/* Bill No */}
              <label className="block mb-3">
                <span className="font-medium">Bill No:</span>
                <input
                  type="text"
                  name="billNo"
                  value={formik.values.billNo}
                  onChange={formik.handleChange}
                  className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-indigo-500"
                />
              </label>

              {/* Party Name */}
              <label className="block mb-3">
                <span className="font-medium">Party Name:</span>
                <input
                  type="text"
                  name="partyName"
                  value={formik.values.partyName}
                  onChange={formik.handleChange}
                  className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-indigo-500"
                />
              </label>

              {/* Transport */}
              <label className="block mb-4">
                <span className="font-medium">Transport:</span>
                <input
                  type="text"
                  name="transport"
                  value={formik.values.transport}
                  onChange={formik.handleChange}
                  className="w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-indigo-500"
                />
              </label>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setUpdateModalOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                >
                <FaTimes />  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                >
                <FaSave />  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Distributor Info */}
      <div className="text-center mt-2">
        <h3 className="text-lg font-bold text-gray-900">{distributor?.partyName || "No Name"}</h3>
        <p className="text-sm text-gray-700">Phone No: {distributor?.phoneNo || "N/A"}</p>
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
          onClick={() => handleDelete(distributor?._id)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
        >
          <FaTrash /> Delete
        </button>
      </div>
    </div>
  );
};

export default DistributorCard;