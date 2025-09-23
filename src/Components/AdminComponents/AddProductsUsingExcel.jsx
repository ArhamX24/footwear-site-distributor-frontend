import React, { useState } from "react";
import { FiUpload } from "react-icons/fi";
import axios from "axios";
import Swal from "sweetalert2";
import { baseURL } from "../../Utils/URLS";

const AddProductsUsingExcel = () => {
  const [loading, setLoading] = useState(false);

  const handleExcelUpload = () => {
    document.getElementById("excel-upload-input").click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("excel", file);

      const response = await axios.post(
        `${baseURL}/api/v1/admin/products/import-excel`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.result) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Products Imported Successfully!",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Upload Failed",
          text: response.data.message || "Something went wrong.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: error.response?.data?.message || "Something went wrong!",
      });
    } finally {
      setLoading(false);
      e.target.value = null; // Reset input
    }
  };

  return (
    <div className="flex flex-col items-center w-[180px]">
      <input
        type="file"
        id="excel-upload-input"
        accept=".xlsx"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        onClick={handleExcelUpload}
        disabled={loading}
        className={`bg-gray-600 text-white px-4 py-2 hover:bg-gray-700 rounded-full border transition duration-200 w-full text-sm font-medium flex items-center ${
          loading ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-800"
        }`}
      >
        <span className="mr-2"><FiUpload size={18} /></span>
        {loading ? "Uploading..." : "Upload via Excel"}
      </button>

      

    </div>
  );
};

export default AddProductsUsingExcel;
