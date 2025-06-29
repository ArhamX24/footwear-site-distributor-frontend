import { useState} from "react";
import { useFormik } from "formik";
import Swal from "sweetalert2";
import { FaChevronDown, FaChevronUp } from "react-icons/fa"; // ✅ Import icons
import { useDispatch } from "react-redux";
import { addItem, dealGrasped } from "../../Slice/CartSlice";

const OrderModal = ({ setPlaceOrderModal, selectedProductDetails }) => {
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [selectedColors, setSelectedColors] = useState([]);
    const [showDropdown, setShowDropdown] = useState(""); // ✅ Tracks which dropdown is open

    const dispatch = useDispatch();

    let minCartonsForDeal = null;
    let reward = null

    if(selectedProductDetails?.indeal){
        minCartonsForDeal = selectedProductDetails?.deal?.minQuantity
        reward = selectedProductDetails?.deal?.reward;
    }
    
    const formik = useFormik({
        initialValues: {
            quantity: "",
        },
        onSubmit: (values, action) => {
        let sortedSizesArr = selectedSizes.sort((a, b) => a - b);
        let finalSizes = sortedSizesArr[0] + "X" + sortedSizesArr[sortedSizesArr.length - 1];
        let finalPrice = selectedProductDetails?.price * values.quantity;

        const isDealClaimed =
            selectedProductDetails?.indeal &&
            selectedProductDetails?.deal &&
            values.quantity >= selectedProductDetails.deal.minQuantity;

        const data = {
            productid: selectedProductDetails?._id,
            articlename: selectedProductDetails?.articleName,
            productImg: selectedProductDetails?.images[0],
            quantity: values.quantity,
            colors: selectedColors,
            sizes: finalSizes,
            price: finalPrice,
            singlePrice: selectedProductDetails?.price,
            indeal: selectedProductDetails?.indeal,
            variants: selectedProductDetails?.variants,
            ...(isDealClaimed && {
            dealReward: selectedProductDetails.deal.reward,
            dealClaimed: true
            })
        };

        dispatch(addItem(data));

        if (isDealClaimed) {
            dispatch(dealGrasped(selectedProductDetails._id));
        }

        Swal.fire({
            title: "Success!",
            text: "Product Added To Cart Successfully!",
            icon: "success"
        });

        action.resetForm();
        setSelectedColors([]);
        setSelectedSizes([]);
        setPlaceOrderModal(false);
        }
    });

    return (
        <>
            <div className="fixed inset-0 flex items-center justify-center bg-gray-800/50 z-50">
                <div className="bg-gray-100 w-full max-w-md p-6 rounded-lg shadow-lg">
                    <h2 className="text-lg font-semibold mb-2">Place Your Order</h2>

                    {/* Quantity Input */}
                    <form onSubmit={formik.handleSubmit}>
                        <label className="block">
                            <span className="font-medium">Cartons:</span>
                            <input
                                type="number"
                                min="1"
                                name="quantity"
                                onChange={formik.handleChange}
                                value={formik.values.quantity}
                                placeholder="Enter no. of cartons"
                                className="w-full mt-1 p-2 border rounded outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </label>

                        {minCartonsForDeal && (
                            <p className="text-sm mt-2 font-medium capitalize">
                                {formik.values.quantity >= minCartonsForDeal ? (
                                    <span className="text-green-600">🎉 You will get *{reward}* on your purchase!</span>
                                ) : (
                                    <span className="text-blue-600 capitalize">
                                        📢 Add *{minCartonsForDeal - formik.values.quantity}* more cartons for a free *{reward}!*
                                    </span>
                                )}
                            </p>
                        )}
                        {/* Size Multi-Select Dropdown */}
                        <label className="block mt-4 relative">
                            <span className="font-medium">Sizes:</span>
                            <div
                                className="w-full mt-1 p-2 border rounded outline-none cursor-pointer flex items-center justify-between bg-white focus:ring-2 focus:ring-indigo-500"
                                onClick={() => setShowDropdown(showDropdown === "sizes" ? "" : "sizes")}
                            >
                                {selectedSizes.length > 0 ? selectedSizes.join(", ") : "Select sizes"}
                                {showDropdown === "sizes" ? <FaChevronUp /> : <FaChevronDown />}  {/* ✅ Icon changes */}
                            </div>
                            {showDropdown === "sizes" && (
                                <div className="absolute left-0 right-0 mt-1 bg-white shadow-lg rounded border max-h-40 overflow-y-auto z-50">
                                    {selectedProductDetails.sizes.map((size, index) => (
                                        <div
                                            key={index}
                                            className={`p-2 cursor-pointer hover:bg-gray-200 ${selectedSizes.includes(size) ? "bg-indigo-200" : ""}`}
                                            onClick={() => {
                                                setSelectedSizes(prev =>
                                                    prev.includes(size)
                                                        ? prev.filter(s => s !== size)
                                                        : [...prev, size]
                                                );
                                            }}
                                        >
                                            {size}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </label>

                        {/* Color Multi-Select Dropdown */}
                        <label className="block mt-4 relative">
                            <span className="font-medium">Colors:</span>
                            <div
                                className="w-full mt-1 p-2 border rounded outline-none cursor-pointer flex items-center justify-between bg-white focus:ring-2 focus:ring-indigo-500"
                                onClick={() => setShowDropdown(showDropdown === "colors" ? "" : "colors")}
                            >
                                {selectedColors.length > 0 ? selectedColors.join(", ") : "Select colors"}
                                {showDropdown === "colors" ? <FaChevronUp /> : <FaChevronDown />}  {/* ✅ Icon changes */}
                            </div>
                            {showDropdown === "colors" && (
                                <div className="absolute left-0 right-0 mt-1 bg-white shadow-lg rounded border max-h-40 overflow-y-auto z-50 capitalize">
                                    {selectedProductDetails.colors.map((color, index) => (
                                        <div
                                            key={index}
                                            className={`p-2 cursor-pointer hover:bg-gray-200 ${selectedColors.includes(color) ? "bg-indigo-200" : ""}`}
                                            onClick={() => {
                                                setSelectedColors(prev =>
                                                    prev.includes(color)
                                                        ? prev.filter(c => c !== color)
                                                        : [...prev, color]
                                                );
                                            }}
                                        >
                                            {color}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </label>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setPlaceOrderModal(false)}
                                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-all duration-300"
                            >
                                Cancel
                            </button>
                            <button type="submit" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300">
                            Add to Cart
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default OrderModal;

