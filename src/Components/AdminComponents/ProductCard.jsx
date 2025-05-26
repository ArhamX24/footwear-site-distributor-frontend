import {useState} from "react";
import { FaTrash, FaEdit, FaSave, FaTimes } from "react-icons/fa"; 
import axios from "axios";
import { useFormik } from "formik";
import Swal from "sweetalert2";

const ProductCard = ({product, setIsDeleted, setIsUpdated}) => {

  const handleDelete = async (id) => {
        await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
          }).then((result) => {
            if (result.isConfirmed) {
                const response = axios.delete(`http://localhost:8080/api/v1/admin/products/deleteproduct/${id}`, {withCredentials: true})
                Swal.fire({
                title: "Deleted!",
                text: "Your file has been deleted.",
                icon: "success"
              });
              setIsDeleted(true)
            }
          });
    }

    const formik = useFormik({

    })

    const handleUpdate = async (id) => {
      try {
        let response = await axios.patch("")
      } catch (error) {
        
      }
    }

  return (
    <div className="w-full h-fit lg:w-64 bg-gray-100 p-4 rounded-2xl shadow-lg flex flex-col justify-between my-3">
      {/* Image Container */}
      <div className="relative flex justify-center">
        <img
          src={product?.images[0]}
          alt={product?.name || "Product Image"}
          className="w-4/5 h-32 object-cover rounded-2xl"
        />
      </div>

      {/* Product Details */}
      <div className="mt-3 text-center">
        <h3 className="text-lg font-bold text-gray-900">{product?.articleName || "No Name"}</h3>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center items-center mt-3 space-x-3">
        <button
          onClick={() => handleUpdate(product?._id)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
        >
          <FaEdit /> Update
        </button>
        <button
          onClick={() => handleDelete(product?._id)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
        >
          <FaTrash /> Delete
        </button>
      </div>
    </div>
  );
};

export default ProductCard;



