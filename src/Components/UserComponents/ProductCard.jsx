import { useState } from "react";

const ProductCard = ({ product, setPlaceOrderModal, setSelectedProductDetails }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false); // State for modal visibility

  // Handlers for Next & Previous
  const handlePrev = () => {
    if (!product.images || product.images.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const handleNext = () => {
    if (!product.images || product.images.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };

  // Handler for Opening Zoomed Modal
  const handleImageClick = () => {
    setIsZoomed(true);
  };

  // Handler for Closing Zoomed Modal
  const handleCloseZoom = () => {
    setIsZoomed(false);
  };

  return (
    <div className="lg:w-72 w-40 md:w-60 mx-auto h-fit bg-white rounded-lg shadow-md overflow-hidden mt-4 relative min-h-[400px]">
      {/* Main Image Display */}
      <div className="relative lg:h-72 h-56">
        <img
          src={product.images[currentImageIndex]}
          alt={product.name}
          className="h-3/4 w-full object-cover bg-center border-b border-gray-400 rounded cursor-pointer"
          onClick={handleImageClick} // Opens zoomed view on click
        />

        {/* Arrow Buttons */}
        {product.images?.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute top-5/12 left-2 transform -translate-y-1/2 bg-gray-200 p-2 rounded-full cursor-pointer text-gray-800 hover:bg-gray-200 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Right Arrow Button */}
            <button
              onClick={handleNext}
              className="absolute top-5/12 right-2 transform -translate-y-1/2 bg-gray-200 p-2 rounded-full cursor-pointer text-gray-800 hover:bg-gray-200 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Thumbnail Image Selector */}
        {product.images?.length > 1 && (
          <div className="flex mt-2 justify-center space-x-2 h-1/4 overflow-x-auto">
            {product.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt="thumbnail"
                className={`w-12 h-12 object-cover cursor-pointer border-2 ${currentImageIndex === index ? "border-blue-500" : "border-transparent"}`}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-2">
        <h5 className="text-gray-800">{product?.articleName}</h5>
        {product?.discount ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-500 line-through">₹ {product.price}</span>
            <span className="text-lg font-bold text-gray-800">
              ₹ {product.price - product.price * (product.discount / 100)}
            </span>
          </div>
        ) : (
          <h5 className="text-lg my-1 font-bold text-gray-800">₹ {product?.price}</h5>
        )}
      </div>

      {/* Add to Cart Button */}
      <div className="p-4 pt-0">
        <button
          onClick={() => {
            setPlaceOrderModal(true);
            setSelectedProductDetails(product);
          }}
          className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition-transform duration-200 hover:scale-105 active:scale-100"
        >
          Add To Cart
        </button>
      </div>

      {/* Zoomed Image Modal */}
{isZoomed && (
  <div
    id="zoom-overlay"
    className="fixed inset-0 bg-gray-800/50 bg-opacity-60 flex justify-center items-center z-50"
    onClick={handleCloseZoom}
  >
    <div className="relative bg-white p-2 rounded-lg shadow-lg flex items-center" onClick={(e)=> {e.stopPropagation()}}>
      {/* Left Arrow Button */}
      <button
        onClick={handlePrev}
        className="absolute left-2 bg-gray-200 p-2 rounded-full cursor-pointer text-gray-800 hover:bg-gray-300 focus:outline-none"
      >
        ❮
      </button>

      {/* Zoomed Image */}
      <img
        src={product.images[currentImageIndex]}
        alt="Zoomed View"
        className="w-60 h-auto object-contain rounded-md"
      />

      {/* Right Arrow Button */}
      <button
        onClick={handleNext}
        className="absolute right-2 bg-gray-200 p-2 rounded-full cursor-pointer text-gray-800 hover:bg-gray-300 focus:outline-none"
      >
        ❯
      </button>

      {/* Close Button */}
      <button
        id="close-btn"
        className="absolute top-2 right-2 bg-gray-300 p-2 rounded-full text-gray-800 hover:bg-gray-400 focus:outline-none"
        onClick={handleCloseZoom}
      >
        ✕
      </button>
    </div>
  </div>
)}

    </div>
  );
};

export default ProductCard;