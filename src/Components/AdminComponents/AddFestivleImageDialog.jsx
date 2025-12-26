import React, { useState } from "react";
import { useFormik } from "formik";
import axios from "axios";
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";
import { baseURL } from "../../Utils/URLS";

const AddFestivleImageDialog = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null); // Image preview

  const today = new Date().toISOString().split("T")[0];

  const handleOpen = () => setOpen((prev) => !prev);

  const formik = useFormik({
    initialValues: {
      startDate: "",
      endDate: "",
      images: '',
    },
    onSubmit: async (values, action) => {
      try {
        setLoading(true);
        setError("");

        const formData = new FormData();

        formData.append("startDate", values.startDate);
        formData.append("endDate", values.endDate);
        formData.append("images", values.images);

        const response = await axios.post(`${baseURL}/api/v1/admin/festival/upload`, formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (!response.data.result) {
          setError(response.data.message);
          setLoading(false);
          return;
        }

        setLoading(false);
        Swal.fire({
          title: "Success!",
          text: "Festival Image Added Successfully!",
          icon: "success",
        });

        action.resetForm();
        setOpen(false);
        setPreview(null);
      } catch (error) {
        console.error(error)
        setLoading(false);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: error?.response?.data?.message || "Something went wrong.",
        });
        setError(error.response?.data?.message || "Something went wrong.");
      }
    },
  });

  return (
    <>
      <button onClick={handleOpen} className="bg-gray-600 text-white px-4 py-2 hover:bg-gray-700 rounded-full border transition duration-200 w-full text-sm font-medium">
       + Add Festival Image
      </button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900/50 z-10">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Upload Any Festival Image</h2>
                    <button
                      onClick={ ()=> setOpen(false)}
                      className="text-gray-500 hover:text-gray-700 text-lg font-bold px-2 py rounded-full border"
                    >
                      ×
                    </button>
                  </div>

            <form onSubmit={formik.handleSubmit} className="space-y-4">
              {/* Start & End Date Inputs */}
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

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-1">Upload Festival Image</label>
                <div className="mt-2">
                  <label className="block w-full h-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:border-gray-400 hover:bg-gray-100 flex items-center justify-center cursor-pointer transition-all text-lg font-semibold text-gray-700">
                    <input
                      type="file"
                      name="images"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files[0];
                        if (file) {
                          formik.setFieldValue("images", file);
                          setPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="hidden" // ✅ Hidden but covers entire label
                    />
                    Choose Image
                  </label>
                </div>

                </div>

              {/* Image Preview */}
              {preview && (
                <div className="mt-3">
                  <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-md" />
                </div>
              )}

              {/* Submit Button */}
              <button type="submit" className="bg-gray-700 text-white px-4 py-2 rounded-xl hover:bg-gray-600 transition duration-200 w-full" disabled={loading}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "Upload Image"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddFestivleImageDialog;