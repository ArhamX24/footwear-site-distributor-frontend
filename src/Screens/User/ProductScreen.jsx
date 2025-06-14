import { useEffect, useState } from "react";
import ProductCard from "../../Components/UserComponents/ProductCard";
import axios from "axios";
import OrderModal from "../../Components/UserComponents/OrderModal";
import { useSelector } from "react-redux";
import Carousel from "./Carousel";
import { baseURL } from "../../Utils/URLS";

const ProductScreen = () => {
      const [allProducts, setAllProducts] = useState(null); // all products fetched
      const [openDropdown, setOpenDropdown] = useState(null);
      const [selectedFilters, setSelectedFilters] = useState({
        filterNames: [],
        filterOptions: [],
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
      const [loading, setLoading] = useState(false)
      const [festivalImages, setFestivalImages] = useState(null)
      const [variantDropDown, setVariantDropDown] = useState(false)

      // Hardcoded price filter remains unchanged.
      const priceOptions = ["Under ₹100", "₹100 - ₹200", "₹200 - ₹300", "Above ₹300"];
      const categories = ["Gents", "Ladies", "Kids"]

      let sideMenuOpen = useSelector((Store)=> Store.nav.isOpen)
      let searchQuery = useSelector((Store)=> Store?.nav?.searchQuery)

     const getProducts = async () => {
  try {
    setLoading(true)
    // Build query parameters and serialize filters as JSON strings
    const queryParams = new URLSearchParams({
      page,
      limit: 12,
      search: searchQuery || "",
      filterName: JSON.stringify(selectedFilters.filterNames),
      filterOption: JSON.stringify(selectedFilters.filterOptions),
    });


    // Send GET request with the query string carrying the JSON-serialized filters
    let response = await axios.get(
      `${baseURL}/api/v1/distributor/products/get?${queryParams.toString()}`
    );

    // Update state based on API response
    if(response.data.result){
      setLoading(false)
      setAllProducts(response.data.data);
      setTotalPages(response.data.totalPages);
    }else{
      setLoading(false)
      setAllProducts(null);
      setTotalPages(0);
    }
  } catch (error) {
    console.error("Error fetching products:", error.response?.data);
  } finally {
    setLoading(false)
  }
};
            // Fetch dynamic filters from backend.
      const getFilters = async () => {
        try {
          let response = await axios.get(`${baseURL}/api/v1/distributor/products/filters/get`);
          if(response.data.result){
            setFilters(response.data.data);
          }
        } catch (error) {
          console.error(error.response?.data);
        }
      };

      const getFestivalImages = async () => {
        try {
          let response = await axios.get(`${baseURL}/api/v1/distributor/festival/get`);
          if(response.data.result){
            setFestivalImages(response.data.imageUrls);
          }
        } catch (error) {
          console.error(error)
        }
      }

      const getDealsImages = async () => {
        try {
          let response = await axios.get(`${baseURL}/api/v1/distributor/deals/getimages`);
          if(response.data.result){
            setDealsImages(response.data.data)
          }
        } catch (error) {
          console.error(error.response?.data);
        }
      }

      const getArticleDetails = async () => {
        try {
          let response = await axios.get(`${baseURL}/api/v1/distributor/products/details/get?articleName=${selectedArticle}`)
          if(response.data.result){
            setArticleDetails(response.data.data.variants)
          }
        } catch (error) {
          console.error(error.response.data.data)
        }
      }
    
      // Toggle the dropdown for a given filter category.
      const toggleDropdown = (category) => {
        setOpenDropdown(openDropdown === category ? null : category);
      };
    
      // Update selected filters when a user clicks an option.
const handleFilterChange = (filterName, selectedOption, isChecked) => {
  setSelectedFilters((prev) => {
    let updatedFilterNames = [...prev.filterNames];
    let updatedFilterOptions = [...prev.filterOptions];
    const filterIndex = prev.filterNames.indexOf(filterName);

    // 🔹 Special handling for price (single-value selection)
    if (filterName === "price") {
      if (isChecked) {
        if (filterIndex !== -1) {
          updatedFilterOptions[filterIndex] = [selectedOption];
        } else {
          updatedFilterNames.push(filterName);
          updatedFilterOptions.push([selectedOption]);
        }
      } else if (filterIndex !== -1) {
        updatedFilterNames.splice(filterIndex, 1);
        updatedFilterOptions.splice(filterIndex, 1);
      }
      return { filterNames: updatedFilterNames, filterOptions: updatedFilterOptions };
    }

    // 🔹 Special handling for articleName (single selection only)
    if (filterName === "articleName") {
      // Always remove any existing articleName filter first
      const oldIndex = updatedFilterNames.indexOf("articleName");
      if (oldIndex !== -1) {
        updatedFilterNames.splice(oldIndex, 1);
        updatedFilterOptions.splice(oldIndex, 1);
      }

      if (isChecked) {
        updatedFilterNames.push("articleName");
        updatedFilterOptions.push([selectedOption]);
        setSelectedArticle(selectedOption);
      } else {
        setSelectedArticle('');
        setVariantDropDown(false)
      }

      return { filterNames: updatedFilterNames, filterOptions: updatedFilterOptions };
    }

    // 🔹 Default multi-select logic
    if (isChecked) {
      if (filterIndex !== -1) {
        updatedFilterOptions[filterIndex] = [
          ...new Set([...updatedFilterOptions[filterIndex], selectedOption]),
        ];
      } else {
        updatedFilterNames.push(filterName);
        updatedFilterOptions.push([selectedOption]);
      }
    } else if (filterIndex !== -1) {
      updatedFilterOptions[filterIndex] = updatedFilterOptions[filterIndex].filter(
        (opt) => opt !== selectedOption
      );

      if (updatedFilterOptions[filterIndex].length === 0) {
        updatedFilterNames.splice(filterIndex, 1);
        updatedFilterOptions.splice(filterIndex, 1);

      }
    }


    return { filterNames: updatedFilterNames, filterOptions: updatedFilterOptions };
  });
};

      
      
    
      // Call products and filters only once.
      useEffect(() => {
        getFilters();
        getDealsImages();
        getFestivalImages();
      }, []);

      useEffect(()=>{
        getArticleDetails()
      }, [selectedArticle])

      useEffect(() => {
        getProducts()
      }, [page, searchQuery, selectedFilters])
      
    
      // Filter products based on selected filters whenever the filters or full products list changes.

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
      {priceOptions.map((option) => {
        const priceIndex = selectedFilters.filterNames.indexOf("price");
        const isChecked =
          priceIndex !== -1 &&
          selectedFilters.filterOptions[priceIndex].includes(option);
        return (
          <label key={option} className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              className="form-checkbox text-indigo-600"
              checked={isChecked}
              onChange={(e) => handleFilterChange("price", option, e.target.checked)}
            />
            <span className="capitalize">{option}</span>
          </label>
        );
      })}
    </div>
  )}
</div>

          {/* Dynamic Filters (for Color, Type, Category) */}
          {filters &&
            Object.keys(filters)
              .filter((key) => key !== "articles" && key !== "sizes") // Exclude sizes object from main listing
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
                        <label key={option} className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          name={`${category}`}
                          className="form-checkbox text-indigo-600"
                          checked={selectedFilters.filterNames.includes(category) && selectedFilters.filterOptions[selectedFilters.filterNames.indexOf(category)].includes(option)}
                          onChange={(e) => handleFilterChange(category, option, e.target.checked)}
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
            onClick={() => setSelectedFilters({filterNames: [],
        filterOptions: [],})}
          >
            Reset Filters
          </button>
        </aside>

        {sideMenuOpen ? (
  <div
    className={`w-2/3 h-screen fixed bg-gray-200 shadow-lg z-10 p-5 transition-transform duration-300 ease-in-out ${
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

  {/* Price Filter as Dropdown */}
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
        {priceOptions.map((option) => {
          // Use consistent key "price" in state.
          const priceIndex = selectedFilters.filterNames.indexOf("price");
          const isChecked =
            priceIndex !== -1 &&
            selectedFilters.filterOptions[priceIndex].includes(option);
          return (
            <label key={option} className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                className="form-checkbox text-indigo-600"
                checked={isChecked}
                onChange={(e) =>
                  handleFilterChange("price", option, e.target.checked)
                }
              />
              <span className="capitalize">{option}</span>
            </label>
          );
        })}
      </div>
    )}
  </div>

  {/* Dynamic Filters for Other Categories */}
  {filters &&
    Object.keys(filters)
      .filter((key) => key !== "articles" && key !== "sizes") // Exclude articles and sizes.
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
                <label key={option} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    name={category}
                    className="form-checkbox text-indigo-600"
                    checked={
                      selectedFilters.filterNames.includes(category) &&
                      selectedFilters.filterOptions[
                        selectedFilters.filterNames.indexOf(category)
                      ].includes(option)
                    }
                    onChange={(e) =>
                      handleFilterChange(category, option, e.target.checked)
                    }
                  />
                  <span className="capitalize">{option}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}

  <button
    className="bg-gray-700 w-full mt-2 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-all duration-300 shadow-md"
    onClick={() =>
      setSelectedFilters({ filterNames: [], filterOptions: [] })
    }
  >
    Reset Filters
  </button>
</aside>
   
  </div>
) : (
  ""
)}

        {/* Products Display with Infinite Scroll */}
        <main className="lg:w-4/5 w-full mx-auto lg:p-6 p-3">
          <div>
            {
              festivalImages && <FestivalGallery festivalImages={festivalImages}/>
            }
          </div>
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
    {filters?.articles?.map((option) => {
      const filterValue = option.toLowerCase();
      const articleIndex = selectedFilters.filterNames.indexOf("articleName");
      const isChecked = filterValue === selectedArticle.toLowerCase()
      return (
        <label
          key={option}
          className="flex items-center gap-2 py-1 cursor-pointer text-sm md:text-lg"
        >
          <input
            type="checkbox"
            className="form-checkbox text-indigo-600"
            checked={isChecked}
            onChange={(e) => {
              handleFilterChange("articleName", filterValue, e.target.checked)
              setSelectedArticle(filterValue)
              setVariantDropDown(true)
            }
            }
          />
          <span className="capitalize">{option}</span>
        </label>
      );
    })}
  </div>
)}
</div>
          <div className="w-1/4 md:w-2/6 relative">
                <p
          className="flex items-center justify-between md:text-lg text-sm cursor-pointer font-medium px-2 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          onClick={() => setVariantDropDown(false)}
          >
          Variants
          <span>
            {variantDropDown ? (
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
        {variantDropDown && (
  <div className="bg-gray-100 p-2 rounded-lg border absolute z-10 lg:w-2/3 w-full">
    {articleDetails?.length <= 0 ? (
      <p className="text-sm w-full">No Variants For This Article</p>
    ) : (
      articleDetails?.map((option) => {
        const filterValue = option.toLowerCase();
        const variantIndex = selectedFilters.filterNames.indexOf("variants");
        const isChecked = variantIndex !== -1 && selectedFilters.filterOptions?.[variantIndex]?.includes(filterValue)
        return (
          <label
            key={option}
            className="flex items-center gap-2 py-1 cursor-pointer text-sm md:text-lg"
          >
            <input
              type="checkbox"
              className="form-checkbox text-indigo-600"
              checked={isChecked}
              onChange={(e) => {
                handleFilterChange("variants", filterValue, e.target.checked)
              }}
            />
            <span className="capitalize">{option}</span>
          </label>
        );
      })
    )}
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
  <div className="bg-gray-100 p-2 rounded-lg border absolute z-10 lg:w-2/3 w-full">
    {categories?.map((option) => {
      const filterValue = option.toLowerCase();
      const genderIndex = selectedFilters.filterNames.indexOf("gender");
      const isChecked =
        genderIndex !== -1 &&
        selectedFilters.filterOptions[genderIndex].includes(filterValue);

      return (
        <label key={option} className="flex items-center gap-2 py-1 text-sm md:text-lg">
          <input
            type="checkbox"
            className="form-checkbox text-indigo-600"
            checked={isChecked}
            onChange={(e) =>
              handleFilterChange("gender", filterValue, e.target.checked)
            }
          />
          <span className="capitalize">{option}</span>
        </label>
      );
    })}
  </div>
)}
          </div>
          </div>
          {
            dealsImages && <Carousel dealsImages={dealsImages}/>
          }
          {loading ? (
            <div className="flex w-full h-4/5 items-center justify-center">
              <span className="loading loading-bars loading-lg"></span>
            </div>
          ) : allProducts?.length ? (
              <div>
              <div className="flex flex-wrap justify-around w-full">
                {allProducts?.map((product) => (
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
