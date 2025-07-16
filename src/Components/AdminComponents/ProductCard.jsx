import { FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import axios from "axios";
import { baseURL } from "../../Utils/URLS";

const ProductCard = ({ product, setIsDeleted, setIsUpdated }) => {
  const handleDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!"
    });

    if (!isConfirmed) return;

    try {
      const res = await axios.delete(
        `${baseURL}/api/v1/admin/products/deleteproduct/${id}`,
        { withCredentials: true }
      );
      if (res.data.result) {
        setIsDeleted((p) => !p);
        Swal.fire("Deleted!", "Your product has been deleted.", "success");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Unable to delete. Try again later.", "error");
    }
  };

  return (
    <div
      key={product._id}
      className="grid grid-cols-4 px-2 py-4 items-center hover:bg-gray-50 transition-colors"
    >
      {/* 1) Segment with thumbnail */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="text-sm text-gray-900 font-medium truncate capitalize">
          {product.segment}
        </div>
      </div>

      {/* 2) Category (variant name) */}
      <div className="text-sm text-gray-900 font-medium truncate capitalize">
        {product.variantName}
      </div>

      {/* 3) Article Name */}
      <div className="text-sm text-gray-900 font-medium truncate capitalize">
        {product.name}
      </div>

      {/* 4) Actions */}
      <div className="flex justify-center">
        <button
          onClick={() => handleDelete(product._id)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
};

export default ProductCard;