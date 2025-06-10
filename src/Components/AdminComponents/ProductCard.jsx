import {useState} from "react";
import { FaTrash, FaEdit, FaSave, FaTimes } from "react-icons/fa"; 
import axios from "axios";
import { useFormik } from "formik";
import Swal from "sweetalert2";
import { baseURL } from "../../Utils/URLS";

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
                const response = axios.delete(`http://${baseURL}/api/v1/admin/products/deleteproduct/${id}`, {withCredentials: true})
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
    <>
     
    <div className="w-full bg-white rounded-lg shadow-sm">

      {/* Table Body */}
      <div className="divide-y divide-gray-100">
          <div 
            key={product._id} 
            className={`grid grid-cols-3 px-2 py-4 items-center hover:bg-gray-50 transition-colors`}
            >
            {/* Product */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={product.images[0]} 
                  alt={product.articleName}
                  className="w-full h-full object-cover"
                  />
              </div>
              <div className="text-sm text-gray-900 font-medium truncate">
                {product.articleName}
              </div>
            </div>


            {/* Price */}
            <div className="text-sm text-gray-900 font-medium">
              {product.price}
            </div>




            <div className="flex justify-center items-center mt-3 space-x-3">
        <button
          onClick={() => handleUpdate(product?._id)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
          >
          <FaEdit />
        </button>
        <button
          onClick={() => handleDelete(product?._id)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
          >
          <FaTrash />
        </button>
      </div>
          </div>
      </div>
    </div>
          </>
  );
};

export default ProductCard;


