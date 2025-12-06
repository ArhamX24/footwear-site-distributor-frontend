import { useState } from "react"; 
 
const ProductCard = ({ product, setPlaceOrderModal, setSelectedProductDetails, variant}) => { 
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
    <div className="w-full bg-white rounded-xl shadow-md overflow-hidden relative flex flex-col h-full hover:shadow-xl transition-all duration-300 border border-gray-100"> 
      {/* Main Image Display */} 
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-100"> 
        <img 
          src={product.images[currentImageIndex]} 
          alt={product.name} 
          className="w-full h-full object-cover object-top cursor-pointer transition-transform duration-500 hover:scale-110" 
          onClick={handleImageClick} // Opens zoomed view on click 
        /> 
 
        {/* Thumbnail Image Selector */} 
        {product.images?.length > 1 && ( 
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1.5 p-1 bg-white/30 backdrop-blur-md rounded-full max-w-[90%] overflow-x-auto no-scrollbar"> 
            {product.images.map((image, index) => ( 
              <div 
                key={index}
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden cursor-pointer border-2 transition-all ${currentImageIndex === index ? "border-indigo-600 scale-110" : "border-transparent opacity-70 hover:opacity-100"}`}
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
              >
                  <img src={image} alt="thumbnail" className="w-full h-full object-cover" />
              </div>
            ))} 
          </div> 
        )} 
      </div> 
 
      {/* Product Details */} 
      <div className="p-3 flex flex-col flex-grow justify-between"> 
        <div>
            <h5 className="text-gray-900 font-bold capitalize text-center text-sm md:text-lg mb-1 leading-tight">{variant.name}</h5> 
            <div className="flex flex-col gap-0.5 text-center mb-2">
                <h5 className="text-gray-600 text-xs md:text-sm font-medium capitalize truncate">{product?.name}</h5> 
                <h5 className="text-gray-400 capitalize text-xs">{product?.gender}</h5> 
            </div>
        </div>
 
        {/* Add to Cart Button */} 
        <button 
          onClick={() => { 
            setPlaceOrderModal(true); 
            setSelectedProductDetails(product); 
          }} 
          className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-xs md:text-sm font-semibold tracking-wide shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all duration-200 active:scale-95" 
        > 
          Add To Cart 
        </button> 
      </div> 
 
      {/* Zoomed Image Modal */} 
      {isZoomed && ( 
        <div 
            id="zoom-overlay" 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" 
            onClick={handleCloseZoom} 
        > 
            <div className="relative w-full max-w-3xl h-full max-h-[90vh] flex items-center justify-center" onClick={(e)=> {e.stopPropagation()}}> 
            {/* Left Arrow Button */} 
            <button 
                onClick={handlePrev} 
                className="absolute left-2 md:-left-12 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full cursor-pointer transition-colors backdrop-blur-md z-10" 
            > 
                ❮ 
            </button> 
        
            {/* Zoomed Image */} 
            <img 
                src={product.images[currentImageIndex]} 
                alt="Zoomed View" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
            /> 
        
            {/* Right Arrow Button */} 
            <button 
                onClick={handleNext} 
                className="absolute right-2 md:-right-12 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full cursor-pointer transition-colors backdrop-blur-md z-10" 
            > 
                ❯ 
            </button> 
        
            {/* Close Button */} 
            <button 
                id="close-btn" 
                className="absolute top-2 right-2 md:-top-10 md:-right-10 bg-white/20 hover:bg-red-500 text-white p-2 rounded-full transition-colors backdrop-blur-md" 
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