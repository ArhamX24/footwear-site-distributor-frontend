import { useState } from "react"; 

const ProductCard = ({ product, setPlaceOrderModal, setSelectedProductDetails, variant}) => { 
  const [currentImageIndex, setCurrentImageIndex] = useState(0); 
  const [isZoomed, setIsZoomed] = useState(false);

  const handlePrev = () => { 
    if (!product.images || product.images.length === 0) return; 
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length); 
  }; 

  const handleNext = () => { 
    if (!product.images || product.images.length === 0) return; 
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length); 
  }; 

  const handleImageClick = () => { 
    setIsZoomed(true); 
  }; 

  const handleCloseZoom = () => { 
    setIsZoomed(false); 
  }; 

  return ( 
    <div className="w-full bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md overflow-hidden relative flex flex-col h-full hover:shadow-lg md:hover:shadow-xl transition-all duration-300 border border-gray-100"> 
      {/* Main Image Display - Mobile Optimized */} 
      <div className="relative w-fit aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-gray-100/90"> 
        <img 
          src={product.images[currentImageIndex]} 
          alt={product.name} 
          className="w-fit object-cover object-top cursor-pointer transition-transform duration-500 hover:scale-105 md:hover:scale-110" 
          onClick={handleImageClick}
        /> 

        {/* Thumbnail Image Selector - Mobile Optimized */} 
        {product.images?.length > 1 && ( 
          <div className="absolute bottom-1 md:bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 md:space-x-1.5 p-0.5 md:p-1 bg-white/30 backdrop-blur-md rounded-full max-w-[90%] overflow-x-auto no-scrollbar"> 
            {product.images.map((image, index) => ( 
              <div 
                key={index}
                className={`w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-full overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 ${currentImageIndex === index ? "border-indigo-600 scale-110" : "border-transparent opacity-70 hover:opacity-100"}`}
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
              >
                  <img src={image} alt="thumbnail" className="w-full h-full object-cover" />
              </div>
            ))} 
          </div> 
        )} 
      </div> 

      {/* Product Details - Mobile Optimized */} 
      <div className="p-2 md:p-3 flex flex-col flex-grow justify-between"> 
        <div>
            <h5 className="text-gray-900 font-bold capitalize text-center text-xs md:text-sm lg:text-base mb-0.5 md:mb-1 leading-tight line-clamp-1">{variant.name}</h5> 
            <div className="flex flex-col gap-0 md:gap-0.5 text-center mb-1.5 md:mb-2">
                <h5 className="text-gray-600 text-[10px] md:text-xs lg:text-sm font-medium capitalize line-clamp-1">{product?.name}</h5> 
                <h5 className="text-gray-400 capitalize text-[9px] md:text-xs">{product?.gender}</h5> 
            </div>
        </div>

        {/* Add to Cart Button - Mobile Optimized */} 
        <button 
          onClick={() => { 
            setPlaceOrderModal(true); 
            setSelectedProductDetails(product); 
          }} 
          className="w-full bg-indigo-600 text-white px-2 md:px-4 py-1.5 md:py-2.5 rounded-md md:rounded-lg text-[10px] md:text-xs lg:text-sm font-semibold tracking-wide shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all duration-200 active:scale-95" 
        > 
          Add To Cart 
        </button> 
      </div> 

      {/* Zoomed Image Modal - Mobile Optimized with White Background */} 
      {isZoomed && ( 
        <div 
            id="zoom-overlay" 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-2 md:p-4" 
            onClick={handleCloseZoom} 
        > 
            <div className="relative w-full max-w-md h-auto bg-white rounded-lg p-4 shadow-2xl" onClick={(e)=> {e.stopPropagation()}}> 
            {/* Left Arrow Button */} 
            <button 
                onClick={handlePrev} 
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white p-2 md:p-3 rounded-full cursor-pointer transition-colors z-10 text-sm md:text-base" 
            > 
                ❮ 
            </button> 
        
            {/* Zoomed Image - Fixed Size */} 
            <img 
                src={product.images[currentImageIndex]} 
                alt="Zoomed View" 
                className="w-full h-auto max-h-[70vh] object-contain rounded-md" 
            /> 
        
            {/* Right Arrow Button */} 
            <button 
                onClick={handleNext} 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white p-2 md:p-3 rounded-full cursor-pointer transition-colors z-10 text-sm md:text-base" 
            > 
                ❯ 
            </button> 
        
            {/* Close Button */} 
            <button 
                id="close-btn" 
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors text-sm md:text-base" 
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
