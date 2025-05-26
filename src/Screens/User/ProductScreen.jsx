import { useEffect, useState } from "react";
import ProductCard from "../../Components/UserComponents/ProductCard";
import axios from "axios";
import OrderModal from "../../Components/UserComponents/OrderModal";
import { useSelector } from "react-redux";
import Carousel from "./Carousel";

const ProductScreen = () => {
      const [products, setProducts] = useState(null); // filtered products
      const [allProducts, setAllProducts] = useState(null); // all products fetched
      const [openDropdown, setOpenDropdown] = useState(null);
      const [selectedFilters, setSelectedFilters] = useState({
        Price: [],
        Category: []
      });
      const [placeOrderModal, setPlaceOrderModal] = useState(false);
      const [selectedProductDetails, setSelectedProductDetails] = useState(null);
      const [filters, setFilters] = useState(null); // dynamic filters from backend
      // "page" now is used for client-side slicing (6 products per page)
      const [page, setPage] = useState(1);
      const [totalPages, setTotalPages] = useState(0) 
      const [articleDetails, setArticleDetails] = useState([])
      const [dealsImages, setDealsImages] = useState(null)
      const [selectedArticle, setSelectedArticle] = useState('')

      // Hardcoded price filter remains unchanged.
      const priceOptions = ["Under ₹500", "₹500 - ₹1000", "₹1000 - ₹2000", "Above ₹2000"];
      const categories = ["Gents", "Ladies", "Kids"]

      let sideMenuOpen = useSelector((Store)=> Store.nav.isOpen)
      let searchQuery = useSelector((Store)=> Store?.nav?.searchQuery)

      // Fetch all products (assuming backend returns complete or paginated data)
      // We call this only on mount.
      const getProducts = async () => {
        try {
          // Remove page dependency here if API doesn't support server-side pagination.
          let response = await axios.get(`https://footwear-site-distributor-backend-3.onrender.com/api/v1/distributor/products/get?page=${page}&limit=10&search=${searchQuery}`);
          setAllProducts(response.data.data);
          setTotalPages(response.data.totalPages)
        } catch (error) {
          console.error(error.response?.data);
        }
      };
    
      // Fetch dynamic filters from backend.
      const getFilters = async () => {
        try {
          let response = await axios.get("https://footwear-site-distributor-backend-3.onrender.com/api/v1/distributor/products/filters/get");
          setFilters(response.data.data);
        } catch (error) {
          console.error(error.response?.data);
        }
      };

      const getDealsImages = async () => {
        try {
          let response = await axios.get("https://footwear-site-distributor-backend-3.onrender.com/api/v1/distributor/deals/getimages")
          setDealsImages(response.data.data)
        } catch (error) {
          console.error(error.response?.data);
        }
      }

      const getArticleDetails = async () => {
        try {
          let response = await axios.get(`https://footwear-site-distributor-backend-3.onrender.com/api/v1/distributor/products/details/get?articleName=${selectedArticle}`)
          setArticleDetails(response.data.data)
        } catch (error) {
          console.error(error.response.data.data)
        }
      }
    
      // Toggle the dropdown for a given filter category.
      const toggleDropdown = (category) => {
        setOpenDropdown(openDropdown === category ? null : category);
      };
    
      // Update selected filters when a user clicks an option.
      const handleFilterChange = (category, option) => {       
        setSelectedFilters((prev) => {
          if (category === "Category") {
            return {
              ...prev,
              Category: prev.Category === option ? null : option,
              // Use dynamic sizes coming from backend if available.
              Size: prev.Category === option ? [] : filters?.sizes?.[option] || [],
            };
          } else {
            return {
              ...prev,
              [category]: prev[category]?.includes(option)
                ? prev[category].filter((item) => item !== option)
                : [...(prev[category] || []), option],
            };
          }
        });

      };      
    
      // Call products and filters only once.
      useEffect(() => {
        getFilters();
        getDealsImages();
        getArticleDetails()
      }, []);

      useEffect(()=>{
        getArticleDetails()
      }, [selectedArticle])

      useEffect(() => {
        getProducts()
      }, [page, searchQuery])
      
    
      // Filter products based on selected filters whenever the filters or full products list changes.
      useEffect(() => {
        let filtered = allProducts?.filter((product) => {
          return (
            (!selectedFilters?.Variant?.length ||
              selectedFilters?.Variant?.some((name) =>
                product?.variants?.some((item) => item.toLowerCase() === name.toLowerCase())
              )
            ) &&
            (!selectedFilters?.Articlename?.length ||
              selectedFilters?.Articlename?.some((name)=> product.articleName.toLowerCase().includes(name.toLowerCase()))
            )&&
            (!selectedFilters?.colors?.length ||
              selectedFilters?.colors?.some((color) =>
                product.colors?.map((c) => c.toLowerCase()).includes(color.toLowerCase())
              )) &&
            (!selectedFilters?.types?.length ||
              selectedFilters?.types?.some((val) =>
                product.type.toLowerCase().includes(val.toLowerCase())
              )) &&
            (!selectedFilters?.Category?.length || 
              selectedFilters?.Category.toLowerCase() == product.category.toLowerCase()
            ) &&
            (!selectedFilters?.Price?.length ||
              selectedFilters?.Price.some((priceRange) => {
                if (priceRange === "Under ₹500") return product.price < 500;
                if (priceRange === "₹500 - ₹1000") return product.price >= 500 && product.price <= 1000;
                if (priceRange === "₹1000 - ₹2000") return product.price >= 1000 && product.price <= 2000;
                if (priceRange === "Above ₹2000") return product.price > 2000;
                return false;
              })) &&
            (!selectedFilters?.sizes?.length ||
              selectedFilters?.sizes?.some((size) =>
                product.sizes.map((s) => s.toLowerCase()).includes(size.toLowerCase())
            ))          
          );
        });
        setProducts(filtered);
      }, [selectedFilters, allProducts]);
    

  return (
    <div className="w-full flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:block w-1/5 bg-gray-200 border-r border-gray-300 min-h-screen shadow-md p-4">
          <div className="text-xl font-semibold mb-3 flex items-center justify-between">
            Filters{" "}
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M21 4V6H20L15 13.5V22H9V13.5L4 6H3V4H21ZM6.4037 6L11 12.8944V20H13V12.8944L17.5963 6H6.4037Z"></path>
              </svg>
            </span>
          </div>
          <div className="border-b mb-3"></div>

          {/* Price Filter as Dropdown */}
          <div className="mb-3">
            <p
              className="flex items-center justify-between text-lg cursor-pointer font-medium px-2 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
              onClick={() => toggleDropdown("Price")}
            >
              Price
              <span>
                {openDropdown === "Price" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 8.3685L3.03212 13.1162L3.9679 14.8838L12 10.6315L20.0321 14.8838L20.9679 13.1162L12 8.3685Z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 15.6315L20.9679 10.8838L20.0321 9.11619L12 13.3685L3.9679 9.11619L3.03212 10.8838L12 15.6315Z"></path>
                  </svg>
                )}
              </span>
            </p>
            {openDropdown === "Price" && (
              <div className="bg-gray-100 p-2 rounded-lg border">
                {priceOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2 py-1" onClick={() => handleFilterChange("Price", option)}>
                    <input
                      type="checkbox"
                      className="form-checkbox text-indigo-600"
                      checked={selectedFilters.Price.includes(option)}
                      onChange={() => handleFilterChange("Price", option)}
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Filters (for Color, Type, Category) */}
          {filters &&
            Object.keys(filters)
              .filter((key) => key !== "sizes") // Exclude sizes object from main listing
              .map((category) => (
                <div key={category} className="mb-3">
                  <p
                    className="flex items-center justify-between text-lg cursor-pointer font-medium px-2 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                    onClick={() => toggleDropdown(category)}
                  >
                    <span className="capitalize">{category}</span>
                    <span>
                      {openDropdown === category ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                          <path d="M12 8.3685L3.03212 13.1162L3.9679 14.8838L12 10.6315L20.0321 14.8838L20.9679 13.1162L12 8.3685Z"></path>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                          <path d="M12 15.6315L20.9679 10.8838L20.0321 9.11619L12 13.3685L3.9679 9.11619L3.03212 10.8838L12 15.6315Z"></path>
                        </svg>
                      )}
                    </span>
                  </p>
                  {openDropdown === category && (
                    <div className="bg-gray-100 p-2 rounded-lg border">
                      {filters[category].map((option) => (
                        <label key={option} className="flex items-center gap-2 py-1" onClick={() => handleFilterChange(category, option)}>
                        <input
                          type="checkbox"
                          name={`${category}`}
                          className="form-checkbox text-indigo-600"
                          checked={selectedFilters[category]?.some(item => item == option) || false}
                          onChange={() => handleFilterChange(category, option)}
                        />
                        <span className="capitalize">{option}</span>
                      </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          <button
            className="bg-gray-700 w-4/5 mt-2 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-all duration-300 shadow-md"
            onClick={() => setSelectedFilters({ Price: []})}
          >
            Reset Filters
          </button>
        </aside>

        {sideMenuOpen ? (
  <div
    className={`w-1/2 h-screen fixed bg-gray-200 shadow-lg z-10 p-5 transition-transform duration-300 ease-in-out ${
      sideMenuOpen ? "translate-x-0" : "-translate-x-full"
    }`}
    onClick={(e) => {
      e.stopPropagation();
      e.preventDefault();
    }}
  >

     <aside className="lg:hidden block w-full bg-gray-200 border-r z-20 border-gray-300 min-h-screen shadow-md p-4 absolute top-0 left-0">
      <div className="text-xl font-semibold mb-3 flex items-center justify-between">
        Filters{" "}
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="currentColor"
          >
            <path d="M21 4V6H20L15 13.5V22H9V13.5L4 6H3V4H21ZM6.4037 6L11 12.8944V20H13V12.8944L17.5963 6H6.4037Z" />
          </svg>
        </span>
      </div>
      <div className="border-b mb-3"></div>

      {/* Price Filter as a Dropdown */}
      <div className="mb-3">
        <p
          className="flex items-center justify-between text-lg cursor-pointer font-medium px-2 py-1 rounded-lg bg-gray-200 hover:bg-gray-300"
          onClick={() => toggleDropdown("Price")}
        >
          Price
          <span>
            {openDropdown === "Price" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
              >
                <path d="M12 8.3685L3.03212 13.1162L3.9679 14.8838L12 10.6315L20.0321 14.8838L20.9679 13.1162L12 8.3685Z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
              >
                <path d="M12 15.6315L20.9679 10.8838L20.0321 9.11619L12 13.3685L3.9679 9.11619L3.03212 10.8838L12 15.6315Z" />
              </svg>
            )}
          </span>
        </p>
        {openDropdown === "Price" && (
          <div className="bg-gray-100 p-2 rounded-lg border">
            {priceOptions.map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 py-1"
                onClick={() => handleFilterChange("Price", option)}
              >
                <input
                  type="checkbox"
                  className="form-checkbox text-indigo-600"
                  checked={selectedFilters.Price.includes(option)}
                  onChange={() => handleFilterChange("Price", option)}
                />
                <span className="capitalize">{option}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Filters for Other Categories */}
      {filters &&
        Object.keys(filters)
          .filter((key) => key !== "sizes" && key !== "Price") // Exclude sizes and Price is handled above.
          .map((category) => (
            <div key={category} className="mb-3">
              <p
                className="flex items-center justify-between text-lg cursor-pointer font-medium px-2 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 capitalize"
                onClick={() => toggleDropdown(category)}
              >
                <span className="capitalize">{category}</span>
                <span>
                  {openDropdown === category ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="currentColor"
                    >
                      <path d="M12 8.3685L3.03212 13.1162L3.9679 14.8838L12 10.6315L20.0321 14.8838L20.9679 13.1162L12 8.3685Z" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="currentColor"
                    >
                    <path d="M12 15.6315L20.9679 10.8838L20.0321 9.11619L12 13.3685L3.9679 9.11619L3.03212 10.8838L12 15.6315Z" />
                    </svg>
                  )}
                </span>
              </p>
              {openDropdown === category && (
                <div className="bg-gray-100 p-2 rounded-lg border">
                  {filters[category].map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 py-1"
                      onClick={() => handleFilterChange(category, option)}
                    >
                      <input
                        type="checkbox"
                        className="form-checkbox text-indigo-600"
                        checked={selectedFilters[category]?.some(item => item == option) || false}
                        onChange={() => handleFilterChange(category, option)}
                      />
                      <span className="capitalize">{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
      <button
        className="bg-gray-700 text-white w-full p-2 rounded-xl md:hidden mt-2"
        onClick={() => setSelectedFilters({ Price: []})}
      >
        Reset Filters
      </button>
    </aside>
   
  </div>
) : (
  ""
)}

        {/* Products Display with Infinite Scroll */}
        <main className="lg:w-4/5 w-full mx-auto p-6">
          {placeOrderModal ? (
            <OrderModal
              setPlaceOrderModal={setPlaceOrderModal}
              selectedProductDetails={selectedProductDetails}
              getProducts={getProducts}
            />
          ) : (
            ""
          )}
          <div className="md:w-11/12 w-full mx-auto flex items-center justify-between gap-x-2">
  <div className="w-2/5 md:w-2/6 relative">
  <p
    className="flex items-center justify-between md:text-lg text-sm cursor-pointer font-medium px-2 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
    onClick={() => toggleDropdown("Articlename")}
  >
    Article Name
    <span>
      {openDropdown === "Articlename" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M12 8.3685L3.03212 13.1162L3.9679 14.8838L12 10.6315L20.0321 14.8838L20.9679 13.1162L12 8.3685Z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="currentColor"
        >
          <path d="M12 15.6315L20.9679 10.8838L20.0321 9.11619L12 13.3685L3.9679 9.11619L3.03212 10.8838L12 15.6315Z" />
        </svg>
      )}
    </span>
  </p>
  {openDropdown === "Articlename" && (
    <div className="bg-gray-100 p-2 rounded-lg border absolute z-10 lg:w-2/3 w-full">
      {articleDetails?.allArticles?.map((option) => (
        <label
          key={option}
          className="flex items-center gap-2 py-1 cursor-pointer"
          onClick={()=> {handleFilterChange("Articlename", option)}}
        >
          <input
            type="checkbox"
            className="form-checkbox text-indigo-600"
            checked={selectedArticle === option}
            onChange={() => {
              if (selectedArticle === option) {
                // If already selected, uncheck it
                setSelectedArticle('');
                setSelectedFilters({Price: []})
              } else {
                setSelectedArticle(option);
                setSelectedFilters({Price: []})
                handleFilterChange("Articlename", option);
              }
            }}
          />
          <span className="capitalize">{option}</span>
        </label>
      ))}
    </div>
  )}
</div>
          <div className="w-1/4 md:w-2/6 relative">
                <p
          className="flex items-center justify-between md:text-lg text-sm cursor-pointer font-medium px-2 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          onClick={() => toggleDropdown("Variant")}
          >
          Variants
          <span>
            {openDropdown === "Variant" ? (
              <svg
              xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
              >
                <path d="M12 8.3685L3.03212 13.1162L3.9679 14.8838L12 10.6315L20.0321 14.8838L20.9679 13.1162L12 8.3685Z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
                >
                <path d="M12 15.6315L20.9679 10.8838L20.0321 9.11619L12 13.3685L3.9679 9.11619L3.03212 10.8838L12 15.6315Z" />
              </svg>
            )}
          </span>
        </p>
        {openDropdown === "Variant" && (
          <div className="bg-gray-100 p-2 rounded-lg border absolute z-10 lg:w-2/3 w-full">
            { articleDetails?.variants.length <=0 ? <p>No Variants For This Article</p> :articleDetails?.variants?.map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 py-1 cursor-pointer"
                onClick={()=> handleFilterChange("Variant", option)}
              >
                <input
                  type="checkbox"
                  className="form-checkbox text-indigo-600"
                  checked={selectedFilters?.Variant?.includes(option)}
                  onChange={() => {handleFilterChange("Variant", option)}}
                />
                <span className="capitalize">{option}</span>
              </label>
            ))}
          </div>
        )}
          </div>
          <div className="w-1/4 md:w-2/6 relative">
                <p
          className="flex items-center justify-between md:text-lg text-sm cursor-pointer font-medium px-2 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          onClick={() => toggleDropdown("Gender")}
          >
          Gender
          <span>
            {openDropdown === "Gender" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
              >
                <path d="M12 8.3685L3.03212 13.1162L3.9679 14.8838L12 10.6315L20.0321 14.8838L20.9679 13.1162L12 8.3685Z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
              >
                <path d="M12 15.6315L20.9679 10.8838L20.0321 9.11619L12 13.3685L3.9679 9.11619L3.03212 10.8838L12 15.6315Z" />
              </svg>
            )}
          </span>
        </p>
          {openDropdown === "Gender" && (
              <div className="bg-gray-100 p-2 rounded-lg border absolute z-10 lg:w-2/3  w-full">
                {categories?.map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 py-1"
                    onClick={() => handleFilterChange("Category", option)}
                  >
                    <input
                      type="checkbox"
                      className="form-checkbox text-indigo-600"
                      checked={selectedFilters?.Category?.includes(option)}
                      onChange={() => handleFilterChange("Category", option)}
                    />
                    <span className="capitalize">{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          </div>
          {
            dealsImages && <Carousel dealsImages={dealsImages}/>
          }
          {!allProducts ? (
            <div className="flex w-full h-4/5 items-center justify-center">
              <span className="loading loading-bars loading-lg"></span>
            </div>
          ) : products?.length ? (
              <div>
              <div className="flex flex-wrap justify-around">
                {products?.map((product) => (
                  <ProductCard
                  key={product?._id}
                  product={product}
                  setSelectedProductDetails={setSelectedProductDetails}
                  setPlaceOrderModal={setPlaceOrderModal}
                  />
                ))}
              </div>
              <div className="w-1/2 mx-auto flex justify-center items-center gap-2 mt-3">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setPage(index + 1)}
                  className={`px-4 py-2 border rounded cursor-pointer ${page === index + 1 ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
              </div>
          ) : (
            <p className="text-center text-gray-600">No products match the selected filters.</p>
          )}
        </main>
      </div>
  )
}

export default ProductScreen
