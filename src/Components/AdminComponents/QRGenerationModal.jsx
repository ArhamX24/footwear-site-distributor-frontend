import { useDispatch } from "react-redux";
import { setIsOpen } from "../../Slice/QrSlice";

const QRGenerationModal = () => {

    const dispatch = useDispatch();

  return (
    <>
      <button
        onClick={() => dispatch(setIsOpen(true))}
        className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors duration-200 transform hover:scale-105"
      >
        Generate Now
      </button>

    </>
  );
};

export default QRGenerationModal;
