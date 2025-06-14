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
      <button onClick={handleOpen} className="bg-gray-700 text-white px-4 py-2 mt-2 md:mt-0 rounded-xl hover:bg-gray-800 duration-200">
        Add Festival Image
      </button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900/50 z-10" onClick={() => setOpen(false)}>
          <div className="bg-white p-6 rounded-lg shadow-lg w-96" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Upload Festival Image</h2>

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
                <input
                    type="file"
                    name="images" // ✅ Use singular name to match Multer's `single("image")`
                    accept="image/*"
                    onChange={(event) => {
                        const file = event.target.files[0]; // ✅ Get only the first file
                        if (file) {
                        formik.setFieldValue("images", file); // ✅ Store single image instead of array
                        setPreview(URL.createObjectURL(file)); // ✅ Preview only one image
                        }
                    }}
                    />
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