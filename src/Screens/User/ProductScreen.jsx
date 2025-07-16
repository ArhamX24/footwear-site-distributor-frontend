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
      const [variantDropDown, setVariantDropDown] = useState(false)

      const categories = ["Gents", "Ladies", "Kids"]

      // let sideMenuOpen = useSelector((Store)=> Store.nav.isOpen)
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

      const getDealsImages = async () => {
        try {
          let response = await axios.get(`${baseURL}/api/v1/distributor/deals/get`);
          if(response.data.result){
            setDealsImages(response.data.images)
          }
        } catch (error) {
          console.error(error.response?.data);
        }
      }

      const getArticleDetails = async () => {
        try {
          let response = await axios.get(`${baseURL}/api/v1/distributor/products/details/get?segment=${selectedArticle}`)
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

    // // 🔹 Special handling for price (single-value selection)
    // if (filterName === "price") {
    //   if (isChecked) {
    //     if (filterIndex !== -1) {
    //       updatedFilterOptions[filterIndex] = [selectedOption];
    //     } else {
    //       updatedFilterNames.push(filterName);
    //       updatedFilterOptions.push([selectedOption]);
    //     }
    //   } else if (filterIndex !== -1) {
    //     updatedFilterNames.splice(filterIndex, 1);
    //     updatedFilterOptions.splice(filterIndex, 1);
    //   }
    //   return { filterNames: updatedFilterNames, filterOptions: updatedFilterOptions };
    // }

    // 🔹 Special handling for articleName (single selection only)

    if (filterName === "segment") {

      const oldIndex = updatedFilterNames.indexOf("segment");
      if (oldIndex !== -1) {
        updatedFilterNames.splice(oldIndex, 1);
        updatedFilterOptions.splice(oldIndex, 1);
      }

      if (isChecked) {
        updatedFilterNames.push("segment");
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
      }, []);

      useEffect(()=>{
        getArticleDetails()
      }, [selectedArticle])

      useEffect(() => {
        getProducts()
      }, [page, searchQuery, selectedFilters])
      
    

  return (
    <div className="w-full flex min-h-screen">
        <main className="w-full mx-auto lg:p-6 p-3">
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
  <div className="w-1/3 md:w-2/6 relative">
  <p
    className="flex items-center justify-between md:text-lg text-sm cursor-pointer font-medium px-2 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
    onClick={() => toggleDropdown("Segment")}
  >
    Segment
    <span>
      {openDropdown === "Segment" ? (
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
  {openDropdown === "Segment" && (
  <div className="bg-gray-100 p-2 rounded-lg border absolute z-10 lg:w-2/3 w-full">
    {filters?.segments?.map((option) => {
      const filterValue = option.toLowerCase();
      const articleIndex = selectedFilters.filterNames.indexOf("segment");
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
              handleFilterChange("segment", filterValue, e.target.checked)
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
          <div className="w-1/3 md:w-2/6 relative">
                <p
          className="flex items-center justify-between md:text-lg text-sm cursor-pointer font-medium px-2 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          onClick={() => setVariantDropDown(false)}
          >
          Category
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
        const variantIndex = selectedFilters.filterNames.indexOf("variant");
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
                handleFilterChange("variant", filterValue, e.target.checked)
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
          <div className="w-1/3 md:w-2/6 relative">
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
                {allProducts?.map((product) =>
                  product.variants?.map((variant) =>
                    variant.articles?.map((article) => (
                      <ProductCard
                        key={article._id}
                        variant={variant}
                        product={article}
                        setSelectedProductDetails={() =>
                          setSelectedProductDetails({
                            product: article,
                            variant: variant.name,
                            segment: product.segment,
                          })
                        }
                        setPlaceOrderModal={setPlaceOrderModal}
/>
                    ))
                  )
                )}
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
