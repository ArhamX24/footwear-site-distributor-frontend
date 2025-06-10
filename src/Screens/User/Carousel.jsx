import { useState } from "react";

const Carousel = ({ dealsImages }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === dealsImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? dealsImages.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="carousel w-full my-4 relative">
  <div className="carousel-item w-full lg:h-80 min-h-40 lg:min-h-80 flex justify-center items-center">
    <img
      src={dealsImages[currentIndex]}
      className="w-full h-full max-h-80 object-cover rounded-md"
      alt={`Deal ${currentIndex + 1}`}
    />
  </div>

  {/* Navigation Buttons */}
  <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
    <button onClick={prevSlide} className="btn btn-circle">❮</button>
    <button onClick={nextSlide} className="btn btn-circle">❯</button>
  </div>
</div>
  );
};

export default Carousel;