import { useEffect, useState, useRef } from "react";
import ProductCard from "../../Components/UserComponents/ProductCard";
import axios from "axios";
import OrderModal from "../../Components/UserComponents/OrderModal";
import { useSelector } from "react-redux";
import Carousel from "./Carousel";
import { baseURL } from "../../Utils/URLS";

// Custom hook to detect clicks outside an element
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
    const [allProducts, setAllProducts] = useState(null);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [selectedFilters, setSelectedFilters] = useState({
        filterNames: [],
        filterOptions: [],
    });
    const [placeOrderModal, setPlaceOrderModal] = useState(false);
    const [selectedProductDetails, setSelectedProductDetails] = useState(null);
    const [filters, setFilters] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [articleDetails, setArticleDetails] = useState([]);
    const [dealsImages, setDealsImages] = useState(null);
    const [selectedArticle, setSelectedArticle] = useState('');
    const [loading, setLoading] = useState(false);

    const categories = ["Gents", "Ladies", "Kids"];
    const searchQuery = useSelector((Store) => Store?.nav?.searchQuery);
    const dropdownRef = useRef(null);

    useOutsideAlerter(dropdownRef, () => setOpenDropdown(null));

    const getProducts = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page,
                limit: 12,
                search: searchQuery || "",
                filterName: JSON.stringify(selectedFilters.filterNames),
                filterOption: JSON.stringify(selectedFilters.filterOptions),
            });

            const response = await axios.get(
                `${baseURL}/api/v1/distributor/products/get?${queryParams.toString()}`
            );

            if (response.data.result) {
                setAllProducts(response.data.data);
                setTotalPages(response.data.totalPages);
            } else {
                setAllProducts(null);
                setTotalPages(0);
            }
        } catch (error) {
            console.error("Error fetching products:", error.response?.data);
        } finally {
            setLoading(false);
        }
    };

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

    const getDealsImages = async () => {
        try {
            const response = await axios.get(`${baseURL}/api/v1/distributor/deals/get`);
            if (response.data.result) {
                setDealsImages(response.data.images);
            }
        } catch (error) {
            console.error(error.response?.data);
        }
    };

    const getArticleDetails = async () => {
        if (!selectedArticle) {
            setArticleDetails([]);
            return;
        }
        try {
            const response = await axios.get(`${baseURL}/api/v1/distributor/products/details/get?segment=${selectedArticle}`);
            if (response.data.result) {
                // Extract unique variant names
                const uniqueVariants = [...new Set(response.data.data.variants.map(v => v.name))];
                setArticleDetails(uniqueVariants);
            }
        } catch (error) {
            console.error(error.response?.data);
        }
    };

    const toggleDropdown = (category) => {
        setOpenDropdown(openDropdown === category ? null : category);
    };

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
                if (isChecked) {
                    updatedFilterNames.push("segment");
                    updatedFilterOptions.push([selectedOption]);
                    setSelectedArticle(selectedOption);
                } else {
                    setSelectedArticle('');
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

    useEffect(() => {
        getFilters();
        getDealsImages();
    }, []);

    useEffect(() => {
        getArticleDetails();
    }, [selectedArticle]);

    useEffect(() => {
        const handler = setTimeout(() => {
            getProducts();
        }, 300); // Debounce API call
        return () => clearTimeout(handler);
    }, [page, searchQuery, selectedFilters]);

    return (
        <div className="w-full bg-gray-50 min-h-screen">
            <main className="w-full max-w-7xl mx-auto p-4 md:p-6">
                {placeOrderModal && (
                    <OrderModal
                        setPlaceOrderModal={setPlaceOrderModal}
                        selectedProductDetails={selectedProductDetails}
                        getProducts={getProducts}
                    />
                )}

                {/* Filter Section */}
                <div ref={dropdownRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {/* Segment Filter */}
                    <div className="relative">
                        <button
                            onClick={() => toggleDropdown("Segment")}
                            className="w-full flex items-center justify-between text-left bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 transition-colors"
                        >
                            <span className="font-semibold text-gray-700">Segment</span>
                            <svg className={`w-5 h-5 text-gray-500 transform transition-transform ${openDropdown === 'Segment' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {openDropdown === "Segment" && (
                            <div className="absolute z-20 mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 p-2 max-h-60 overflow-y-auto">
                                {filters?.segments?.map((option) => (
                                    <label key={option} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                            checked={selectedArticle.toLowerCase() === option.toLowerCase()}
                                            onChange={(e) => handleFilterChange("segment", option.toLowerCase(), e.target.checked)}
                                        />
                                        <span className="text-gray-800 capitalize">{option}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Category/Variant Filter */}
                    <div className="relative">
                        <button
                            onClick={() => selectedArticle && toggleDropdown("Variant")}
                            disabled={!selectedArticle}
                            className="w-full flex items-center justify-between text-left bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed hover:enabled:border-indigo-500"
                        >
                            <span className="font-semibold text-gray-700">Category</span>
                            <svg className={`w-5 h-5 text-gray-500 transform transition-transform ${openDropdown === 'Variant' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {openDropdown === "Variant" && (
                            <div className="absolute z-20 mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 p-2 max-h-60 overflow-y-auto">
                                {articleDetails.length > 0 ? articleDetails.map((option) => (
                                    <label key={option} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                            checked={selectedFilters.filterOptions[selectedFilters.filterNames.indexOf("variant")]?.includes(option.toLowerCase())}
                                            onChange={(e) => handleFilterChange("variant", option.toLowerCase(), e.target.checked)}
                                        />
                                        <span className="text-gray-800 capitalize">{option}</span>
                                    </label>
                                )) : <p className="text-sm text-gray-500 p-2">No categories for this segment.</p>}
                            </div>
                        )}
                    </div>

                    {/* Gender Filter */}
                    <div className="relative">
                        <button
                            onClick={() => toggleDropdown("Gender")}
                            className="w-full flex items-center justify-between text-left bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 transition-colors"
                        >
                            <span className="font-semibold text-gray-700">Gender</span>
                            <svg className={`w-5 h-5 text-gray-500 transform transition-transform ${openDropdown === 'Gender' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {openDropdown === "Gender" && (
                            <div className="absolute z-20 mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 p-2 max-h-60 overflow-y-auto">
                                {categories.map((option) => (
                                    <label key={option} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                            checked={selectedFilters.filterOptions[selectedFilters.filterNames.indexOf("gender")]?.includes(option.toLowerCase())}
                                            onChange={(e) => handleFilterChange("gender", option.toLowerCase(), e.target.checked)}
                                        />
                                        <span className="text-gray-800 capitalize">{option}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Products Section */}
                {loading ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : allProducts?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {allProducts.map((product) =>
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
                ) : (
                    <div className="text-center py-20">
                        <h3 className="text-xl font-semibold text-gray-700">No Products Found</h3>
                        <p className="text-gray-500 mt-2">Try adjusting your filters or search term.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ProductScreen;
