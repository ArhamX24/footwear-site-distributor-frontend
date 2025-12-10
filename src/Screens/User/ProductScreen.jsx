import { useEffect, useState, useRef, useCallback } from "react"; 
import ProductCard from "../../Components/UserComponents/ProductCard"; 
import axios from "axios"; 
import OrderModal from "../../Components/UserComponents/OrderModal"; 
import { baseURL } from "../../Utils/URLS"; 

const useOutsideAlerter = (ref, callback) => { 
    useEffect(() => { 
        function handleClickOutside(event) { 
            if (ref.current && !ref.current.contains(event.target)) { 
                callback(); 
            } 
        } 
        document.addEventListener("mousedown", handleClickOutside); 
        return () => { 
            document.removeEventListener("mousedown", handleClickOutside); 
        }; 
    }, [ref, callback]); 
}; 

const ProductScreen = () => { 
    const [allProducts, setAllProducts] = useState([]); 
    const [openDropdown, setOpenDropdown] = useState(null); 
    const [selectedFilters, setSelectedFilters] = useState({ 
        filterNames: [], 
        filterOptions: [], 
    }); 
    const [placeOrderModal, setPlaceOrderModal] = useState(false); 
    const [selectedProductDetails, setSelectedProductDetails] = useState(null); 
    const [filters, setFilters] = useState(null); 
    const [page, setPage] = useState(1); 
    const [hasMore, setHasMore] = useState(true);
    const [articleDetails, setArticleDetails] = useState([]); 
    const [selectedArticle, setSelectedArticle] = useState(''); 
    const [loading, setLoading] = useState(false); 
    const [searchInput, setSearchInput] = useState("");
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    
    const dropdownRef = useRef(null); 
    const observerRef = useRef(null);

    useOutsideAlerter(dropdownRef, () => setOpenDropdown(null)); 

    // Fetch products function (with filters)
    const getProducts = async (pageNum = 1, isLoadMore = false) => { 
        try { 
            if (pageNum === 1) {
                setLoading(true);
            } else {
                setIsFetchingMore(true);
            }

            const queryParams = new URLSearchParams({ 
                page: pageNum, 
                limit: 12, 
                filterName: JSON.stringify(selectedFilters.filterNames), 
                filterOption: JSON.stringify(selectedFilters.filterOptions), 
            }); 

            const response = await axios.get( 
                `${baseURL}/api/v1/distributor/products/get?${queryParams.toString()}` 
            ); 

            if (response.data.result) { 
                const newProducts = response.data.data;
                
                if (isLoadMore) {
                    setAllProducts(prev => [...prev, ...newProducts]);
                } else {
                    setAllProducts(newProducts);
                }
                
                setHasMore(newProducts.length === 12);
            } else { 
                if (!isLoadMore) {
                    setAllProducts([]); 
                }
                setHasMore(false);
            } 
        } catch (error) { 
            console.error("Error fetching products:", error.response?.data); 
            setHasMore(false);
        } finally { 
            setLoading(false);
            setIsFetchingMore(false);
        } 
    };

    // NEW: Search products function (when search is active)
    const searchProducts = async (pageNum = 1, isLoadMore = false) => {
        try {
            if (pageNum === 1) {
                setLoading(true);
            } else {
                setIsFetchingMore(true);
            }

            const queryParams = new URLSearchParams({
                page: pageNum,
                limit: 12,
                search: searchInput.trim()
            });

            const response = await axios.get(
                `${baseURL}/api/v1/distributor/products/search?${queryParams.toString()}`
            );

            if (response.data.result) {
                const newProducts = response.data.data;

                if (isLoadMore) {
                    setAllProducts(prev => [...prev, ...newProducts]);
                } else {
                    setAllProducts(newProducts);
                }

                setHasMore(newProducts.length === 12);
            } else {
                if (!isLoadMore) {
                    setAllProducts([]);
                }
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error searching products:", error.response?.data);
            setHasMore(false);
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    };

    // Fetch filters
    const getFilters = async () => { 
        try { 
            const response = await axios.get(`${baseURL}/api/v1/distributor/products/filters/get`); 
            if (response.data.result) { 
                setFilters(response.data.data); 
            } 
        } catch (error) { 
            console.error(error.response?.data); 
        } 
    }; 

    // Fetch article details (variants) based on selected segment
    const getArticleDetails = async () => { 
        if (!selectedArticle) { 
            setArticleDetails([]); 
            return; 
        } 
        try { 
            const response = await axios.get(`${baseURL}/api/v1/distributor/products/details/get?segment=${selectedArticle}`); 
            if (response.data.result) { 
                const uniqueVariants = [...new Set(response.data.data.variants.map(v => v.name))]; 
                setArticleDetails(uniqueVariants); 
            } 
        } catch (error) { 
            console.error(error.response?.data); 
        } 
    }; 

    // Toggle dropdown
    const toggleDropdown = (category) => { 
        if (category === "Variant" && !selectedArticle) {
            return;
        }
        setOpenDropdown(openDropdown === category ? null : category); 
    }; 

    // Handle filter changes
    const handleFilterChange = (filterName, selectedOption, isChecked) => { 
        setSelectedFilters((prev) => { 
            let updatedFilterNames = [...prev.filterNames]; 
            let updatedFilterOptions = [...prev.filterOptions]; 
            const filterIndex = prev.filterNames.indexOf(filterName); 

            if (filterName === "segment") { 
                const oldIndex = updatedFilterNames.indexOf("segment"); 
                if (oldIndex !== -1) { 
                    updatedFilterNames.splice(oldIndex, 1); 
                    updatedFilterOptions.splice(oldIndex, 1); 
                } 
                 
                const variantIndex = updatedFilterNames.indexOf("variant"); 
                if (variantIndex !== -1) { 
                    updatedFilterNames.splice(variantIndex, 1); 
                    updatedFilterOptions.splice(variantIndex, 1); 
                } 
                 
                if (isChecked) { 
                    updatedFilterNames.push("segment"); 
                    updatedFilterOptions.push([selectedOption]); 
                    setSelectedArticle(selectedOption); 
                     
                    setTimeout(() => { 
                        setOpenDropdown("Variant"); 
                    }, 100); 
                } else { 
                    setSelectedArticle(''); 
                    setArticleDetails([]);
                } 
                return { filterNames: updatedFilterNames, filterOptions: updatedFilterOptions }; 
            } 

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

    // Handle search input change
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchInput(value);
    };

    // Clear search
    const clearSearch = () => {
        setSearchInput("");
    };

    // Infinite scroll observer
    const lastProductRef = useCallback((node) => {
        if (loading || isFetchingMore) return;
        if (observerRef.current) observerRef.current.disconnect();
        
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1);
            }
        });
        
        if (node) observerRef.current.observe(node);
    }, [loading, isFetchingMore, hasMore]);

    // Initial load
    useEffect(() => { 
        getFilters(); 
    }, []); 

    // Fetch article details when segment changes
    useEffect(() => { 
        getArticleDetails(); 
    }, [selectedArticle]); 

    // Fetch products when search or filters change (reset to page 1)
    useEffect(() => { 
        const handler = setTimeout(() => { 
            setPage(1);
            setHasMore(true);
            
            // Use search API if search input exists, otherwise use filter API
            if (searchInput.trim()) {
                searchProducts(1, false);
            } else {
                getProducts(1, false);
            }
        }, 500);
        
        return () => clearTimeout(handler); 
    }, [searchInput, selectedFilters]); 

    // Load more products when page changes
    useEffect(() => {
        if (page > 1) {
            // Use appropriate API based on search state
            if (searchInput.trim()) {
                searchProducts(page, true);
            } else {
                getProducts(page, true);
            }
        }
    }, [page]);

    return ( 
        <div className="w-full bg-gray-50 min-h-screen"> 
            <main className="w-full max-w-7xl mx-auto p-2 md:p-4 lg:p-6"> 
                {placeOrderModal && ( 
                    <OrderModal 
                        setPlaceOrderModal={setPlaceOrderModal} 
                        selectedProductDetails={selectedProductDetails} 
                        clearSearch={clearSearch}
                    /> 
                )} 

                {/* Search Bar - Mobile Optimized */}
                <div className="mb-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchInput}
                            onChange={handleSearchChange}
                            placeholder="Search articles, segments, variants, keywords..."
                            className="w-full pl-10 pr-10 py-3 text-sm md:text-base rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:outline-none shadow-sm transition-colors"
                        />
                        
                        {searchInput && (
                            <button
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Section - Disabled during search */}
                <div ref={dropdownRef} className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 lg:gap-4 mb-4 md:mb-6 lg:mb-8 ${searchInput ? 'opacity-50 pointer-events-none' : ''}`}> 
                    {/* Segment Filter */} 
                    <div className="relative"> 
                        <button 
                            onClick={() => toggleDropdown("Segment")} 
                            disabled={!!searchInput}
                            className="w-full flex items-center justify-between text-left bg-white px-3 md:px-4 py-2 md:py-3 rounded-md md:rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 transition-colors text-sm disabled:cursor-not-allowed" 
                        > 
                            <span className="font-semibold text-gray-700 truncate"> 
                                {selectedArticle ? `Segment: ${selectedArticle}` : "Select Segment"} 
                            </span> 
                            <svg className={`w-4 h-4 md:w-5 md:h-5 text-gray-500 transform transition-transform flex-shrink-0 ml-2 ${openDropdown === 'Segment' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg> 
                        </button> 
                        {openDropdown === "Segment" && !searchInput && ( 
                            <div className="absolute z-20 mt-2 w-full bg-white rounded-md md:rounded-lg shadow-xl border border-gray-200 p-2 max-h-60 overflow-y-auto"> 
                                {filters?.segments?.map((option) => ( 
                                    <label key={option} className="flex items-center gap-2 md:gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer"> 
                                        <input 
                                            type="checkbox" 
                                            className="form-checkbox h-4 w-4 md:h-5 md:w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 flex-shrink-0" 
                                            checked={selectedArticle.toLowerCase() === option.toLowerCase()} 
                                            onChange={(e) => handleFilterChange("segment", option.toLowerCase(), e.target.checked)} 
                                        /> 
                                        <span className="text-gray-800 capitalize text-sm md:text-base">{option}</span> 
                                    </label> 
                                ))} 
                            </div> 
                        )} 
                    </div> 

                    {/* Category/Variant Filter */} 
                    {/* <div className="relative"> 
                        <button 
                            onClick={() => toggleDropdown("Variant")} 
                            disabled={!selectedArticle || !!searchInput} 
                            className="w-full flex items-center justify-between text-left bg-white px-3 md:px-4 py-2 md:py-3 rounded-md md:rounded-lg shadow-sm border border-gray-200 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed hover:enabled:border-indigo-500 text-sm" 
                        > 
                            <span className="font-semibold text-gray-700 truncate"> 
                                {selectedFilters.filterOptions[selectedFilters.filterNames.indexOf("variant")]?.length > 0  
                                    ? `Categories: ${selectedFilters.filterOptions[selectedFilters.filterNames.indexOf("variant")].join(', ')}`  
                                    : "Select Category"} 
                            </span> 
                            <svg className={`w-4 h-4 md:w-5 md:h-5 text-gray-500 transform transition-transform flex-shrink-0 ml-2 ${openDropdown === 'Variant' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg> 
                        </button> 
                        {openDropdown === "Variant" && selectedArticle && articleDetails.length > 0 && !searchInput && ( 
                            <div className="absolute z-20 mt-2 w-full bg-white rounded-md md:rounded-lg shadow-xl border border-gray-200 p-2 max-h-60 overflow-y-auto"> 
                                {articleDetails.map((option) => ( 
                                    <label key={option} className="flex items-center gap-2 md:gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer"> 
                                        <input 
                                            type="checkbox" 
                                            className="form-checkbox h-4 w-4 md:h-5 md:w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 flex-shrink-0" 
                                            checked={selectedFilters.filterOptions[selectedFilters.filterNames.indexOf("variant")]?.includes(option.toLowerCase())} 
                                            onChange={(e) => handleFilterChange("variant", option.toLowerCase(), e.target.checked)} 
                                        /> 
                                        <span className="text-gray-800 capitalize text-sm md:text-base">{option}</span> 
                                    </label> 
                                ))} 
                            </div> 
                        )} 
                    </div>  */}

                    {/* Gender Filter */} 
                    <div className="relative"> 
                        <button 
                            onClick={() => toggleDropdown("Gender")} 
                            disabled={!!searchInput}
                            className="w-full flex items-center justify-between text-left bg-white px-3 md:px-4 py-2 md:py-3 rounded-md md:rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 transition-colors text-sm disabled:cursor-not-allowed" 
                        > 
                            <span className="font-semibold text-gray-700 truncate"> 
                                {selectedFilters.filterOptions[selectedFilters.filterNames.indexOf("gender")]?.length > 0  
                                    ? `Gender: ${selectedFilters.filterOptions[selectedFilters.filterNames.indexOf("gender")].join(', ')}`  
                                    : "Select Gender"} 
                            </span> 
                            <svg className={`w-4 h-4 md:w-5 md:h-5 text-gray-500 transform transition-transform flex-shrink-0 ml-2 ${openDropdown === 'Gender' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg> 
                        </button> 
                        {openDropdown === "Gender" && !searchInput && ( 
                            <div className="absolute z-20 mt-2 w-full bg-white rounded-md md:rounded-lg shadow-xl border border-gray-200 p-2 max-h-60 overflow-y-auto"> 
                                {["Gents", "Ladies", "Kids"].map((option) => ( 
                                    <label key={option} className="flex items-center gap-2 md:gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer"> 
                                        <input 
                                            type="checkbox" 
                                            className="form-checkbox h-4 w-4 md:h-5 md:w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 flex-shrink-0" 
                                            checked={selectedFilters.filterOptions[selectedFilters.filterNames.indexOf("gender")]?.includes(option.toLowerCase())} 
                                            onChange={(e) => handleFilterChange("gender", option.toLowerCase(), e.target.checked)} 
                                        /> 
                                        <span className="text-gray-800 capitalize text-sm md:text-base">{option}</span> 
                                    </label> 
                                ))} 
                            </div> 
                        )} 
                    </div> 
                </div> 


                {/* Products Section - MOBILE OPTIMIZED GRID WITH INFINITE SCROLL */} 
                {loading ? ( 
                    <div className="flex items-center justify-center h-96"> 
                        <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-indigo-600"></div> 
                    </div> 
                ) : allProducts?.length > 0 ? ( 
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 lg:gap-6"> 
                            {allProducts.map((product, productIndex) => 
                                product.variants?.map((variant, variantIndex) => 
                                    variant.articles?.map((article, articleIndex) => {
                                        const isLast = productIndex === allProducts.length - 1 && 
                                                      variantIndex === product.variants.length - 1 && 
                                                      articleIndex === variant.articles.length - 1;
                                        
                                        return (
                                            <div 
                                                key={article._id}
                                                ref={isLast ? lastProductRef : null}
                                            >
                                                <ProductCard 
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
                                            </div>
                                        );
                                    })
                                ) 
                            )} 
                        </div>
                        
                        {/* Loading More Indicator */}
                        {isFetchingMore && (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                <span className="ml-3 text-gray-600">Loading more...</span>
                            </div>
                        )}
                        
                        {/* End of Results */}
                        {!hasMore && allProducts.length > 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500">You've reached the end!</p>
                            </div>
                        )}
                    </>
                ) : ( 
                    <div className="text-center py-12 md:py-20"> 
                        <h3 className="text-lg md:text-xl font-semibold text-gray-700">No Products Found</h3> 
                    </div> 
                )} 
            </main> 
        </div> 
    ); 
}; 

export default ProductScreen;
