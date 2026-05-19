import { useEffect, useState, useRef, useCallback } from "react";
import ProductCard, { ProductCardSkeleton } from "../../Components/UserComponents/ProductCard";
import axios from "axios";
import OrderModal from "../../Components/UserComponents/OrderModal";
import { baseURL } from "../../Utils/URLS";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

// ─── Filter persistence keys ───────────────────────────────────────────────
const FILTER_STORAGE_KEY = "distributor_filters_v1";

const saveFiltersToSession = (filters, selectedSegment, selectedGenders) => {
  try {
    sessionStorage.setItem(
      FILTER_STORAGE_KEY,
      JSON.stringify({ filters, selectedSegment, selectedGenders })
    );
  } catch (_) {}
};

const loadFiltersFromSession = () => {
  try {
    const raw = sessionStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
};

// ─── Outside click hook ────────────────────────────────────────────────────
const useOutsideAlerter = (ref, callback) => {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
};

// ─── Carousel Skeleton ─────────────────────────────────────────────────────
const CarouselSkeleton = () => (
  <div className="w-full bg-gray-200 rounded-xl overflow-hidden mb-4 md:mb-6 lg:mb-8 h-48 sm:h-56 md:h-64 lg:h-72 animate-pulse" />
);

// ─── Offers Carousel ───────────────────────────────────────────────────────
const OffersCarousel = ({ offers }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [initialLoading, setInitialLoading] = useState(true);
  const autoPlayRef = useRef(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % offers.length);
  }, [offers.length]);

  const prevSlide = () =>
    setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);

  useEffect(() => {
    if (isAutoPlaying && offers.length > 1) {
      autoPlayRef.current = setInterval(nextSlide, 7000);
    }
    return () => clearInterval(autoPlayRef.current);
  }, [isAutoPlaying, offers.length, nextSlide]);

  const handleImageLoad = (index) => {
    setLoadedImages((prev) => new Set([...prev, index]));
    if (index === 0) setInitialLoading(false);
  };

  if (!offers || offers.length === 0) return null;

  return (
    <div
      className="relative w-full bg-white rounded-xl shadow-md overflow-hidden mb-4 md:mb-6 lg:mb-8"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="relative h-48 sm:h-56 md:h-64 lg:h-72">
        {initialLoading && (
          <div className="absolute inset-0 bg-gray-200 z-20 animate-pulse" />
        )}
        <div className="relative w-full h-full">
          {offers.map((offer, index) => (
            <div
              key={`${offer._id || index}`}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {!loadedImages.has(index) && index === currentIndex && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              )}
              <img
                src={offer.image}
                alt={
                  offer.type === "deal"
                    ? `Deal: ${offer.name || "Special Offer"}`
                    : "Festival Offer"
                }
                className="w-full h-full object-cover"
                onLoad={() => handleImageLoad(index)}
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/800x400?text=Offer+Image";
                  handleImageLoad(index);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          ))}
        </div>

        {offers.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 p-2 md:p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
              aria-label="Previous offer"
            >
              <FaChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 p-2 md:p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
              aria-label="Next offer"
            >
              <FaChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <div className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
              {offers.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 md:h-2.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "bg-white w-6 md:w-8"
                      : "bg-white/50 hover:bg-white/75 w-2 md:w-2.5"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Fixed Gender Config ───────────────────────────────────────────────────
const GENDER_BUTTONS = [
  { label: "Gents", value: "gents" },
  { label: "Ladies", value: "ladies" },
  { label: "Kids", value: "kids" },
];

// ─── Main Component ────────────────────────────────────────────────────────
const ProductScreen = () => {
  // ── Restore saved filters ──
  const savedFilters = loadFiltersFromSession();

  const [allProducts, setAllProducts] = useState([]);
  const [segmentsList, setSegmentsList] = useState([]); // Dynamic segments
  const [selectedSegment, setSelectedSegment] = useState(
    savedFilters?.selectedSegment || ""
  );
  const [selectedGenders, setSelectedGenders] = useState(
    savedFilters?.selectedGenders || []
  );
  
  const [placeOrderModal, setPlaceOrderModal] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);

  const observerRef = useRef(null);
  const dropdownRef = useRef(null);

  useOutsideAlerter(dropdownRef, () => {});

  // ── Initial load logic (Offers & Dynamic Segments) ──
  useEffect(() => {
    const fetchDynamicFilters = async () => {
      try {
        const res = await axios.get(`${baseURL}/api/v1/distributor/products/filters/get`);
        if (res.data.result && res.data.data.segments) {
          setSegmentsList(res.data.data.segments);
        }
      } catch (err) {
        console.error("Error fetching segments:", err);
      }
    };
    fetchDynamicFilters();
    getCombinedOffers();
  }, []);

  // ── Persist filters whenever they change ──
  useEffect(() => {
    const filterNames = [];
    const filterOptions = [];
    if (selectedSegment) {
      filterNames.push("segment");
      filterOptions.push([selectedSegment]);
    }
    if (selectedGenders.length > 0) {
      filterNames.push("gender");
      filterOptions.push(selectedGenders);
    }
    saveFiltersToSession(
      { filterNames, filterOptions },
      selectedSegment,
      selectedGenders
    );
  }, [selectedSegment, selectedGenders]);

  const buildFilters = () => {
    const filterNames = [];
    const filterOptions = [];
    if (selectedSegment) {
      filterNames.push("segment");
      filterOptions.push([selectedSegment]);
    }
    if (selectedGenders.length > 0) {
      filterNames.push("gender");
      filterOptions.push(selectedGenders);
    }
    return { filterNames, filterOptions };
  };

  const getCombinedOffers = async () => {
    try {
      setOffersLoading(true);
      const response = await axios.get(`${baseURL}/api/v1/distributor/offers/all`);
      if (response.data.result && response.data.data) {
        setOffers(response.data.data);
      } else {
        setOffers([]);
      }
    } catch {
      setOffers([]);
    } finally {
      setOffersLoading(false);
    }
  };

  const getProducts = async (pageNum = 1, isLoadMore = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setIsFetchingMore(true);

      const { filterNames, filterOptions } = buildFilters();

      const queryParams = new URLSearchParams({
        page: pageNum,
        limit: 12,
        filterName: JSON.stringify(filterNames),
        filterOption: JSON.stringify(filterOptions),
      });

      const response = await axios.get(
        `${baseURL}/api/v1/distributor/products/get?${queryParams.toString()}`
      );

      if (response.data.result) {
        const newProducts = response.data.data;
        if (isLoadMore) {
          setAllProducts((prev) => [...prev, ...newProducts]);
        } else {
          setAllProducts(newProducts);
        }
        setHasMore(newProducts.length === 12);
      } else {
        if (!isLoadMore) setAllProducts([]);
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  const searchProducts = async (pageNum = 1, isLoadMore = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setIsFetchingMore(true);

      // Include active Segment & Genders inside the search API call
      const queryParams = new URLSearchParams({
        page: pageNum,
        limit: 12,
        search: searchInput.trim(),
        segment: selectedSegment || "",
        genders: JSON.stringify(selectedGenders)
      });

      const response = await axios.get(
        `${baseURL}/api/v1/distributor/products/search?${queryParams.toString()}`
      );

      if (response.data.result) {
        const newProducts = response.data.data;
        if (isLoadMore) {
          setAllProducts((prev) => [...prev, ...newProducts]);
        } else {
          setAllProducts(newProducts);
        }
        setHasMore(newProducts.length === 12);
      } else {
        if (!isLoadMore) setAllProducts([]);
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  const handleSegmentClick = (value) => {
    setSelectedSegment((prev) => (prev === value ? "" : value));
    setPage(1);
  };

  const handleGenderClick = (value) => {
    setSelectedGenders((prev) =>
      prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value]
    );
    setPage(1);
  };

  const handleSearchChange = (e) => setSearchInput(e.target.value);
  const clearSearch = () => setSearchInput("");

  const lastProductRef = useCallback(
    (node) => {
      if (loading || isFetchingMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [loading, isFetchingMore, hasMore]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      if (searchInput.trim()) {
        searchProducts(1, false);
      } else {
        getProducts(1, false);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput, selectedSegment, selectedGenders]);

  useEffect(() => {
    if (page > 1) {
      if (searchInput.trim()) {
        searchProducts(page, true);
      } else {
        getProducts(page, true);
      }
    }
  }, [page]);

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-sm shadow-sm pt-2 pb-3 px-2 md:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative mb-3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search by article, keyword, e.g. pl440, gents eva..."
              className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none shadow-sm transition-colors bg-white"
            />
            {searchInput && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mr-1 hidden sm:inline">
              Segment
            </span>

            {/* Render dynamically fetched segments */}
            {segmentsList.map((segment) => {
              const active = selectedSegment === segment;
              return (
                <button
                  key={segment}
                  onClick={() => handleSegmentClick(segment)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 shadow-sm
                    ${
                      active
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-200 shadow-md scale-105"
                        : "bg-white text-gray-600 border-gray-200 hover:border-indigo-400 hover:text-indigo-600 hover:shadow"
                    }
                  `}
                >
                  {segment.toUpperCase()}
                </button>
              );
            })}

            <div className="h-5 w-px bg-gray-200 mx-1 hidden sm:block" />

            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mr-1 hidden sm:inline">
              Gender
            </span>

            {GENDER_BUTTONS.map(({ label, value }) => {
              const active = selectedGenders.includes(value);
              return (
                <button
                  key={value}
                  onClick={() => handleGenderClick(value)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 shadow-sm
                    ${
                      active
                        ? "bg-rose-500 text-white border-rose-500 shadow-rose-200 shadow-md scale-105"
                        : "bg-white text-gray-600 border-gray-200 hover:border-rose-400 hover:text-rose-500 hover:shadow"
                    }
                  `}
                >
                  {label}
                </button>
              );
            })}

            {(selectedSegment || selectedGenders.length > 0) && (
              <button
                onClick={() => {
                  setSelectedSegment("");
                  setSelectedGenders([]);
                }}
                className="ml-auto px-2.5 py-1.5 rounded-full text-[10px] font-semibold text-gray-400 border border-gray-200 hover:border-red-300 hover:text-red-400 transition-all duration-200 bg-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="w-full max-w-7xl mx-auto p-2 md:p-4 lg:p-6">
        {placeOrderModal && (
          <OrderModal
            setPlaceOrderModal={setPlaceOrderModal}
            selectedProductDetails={selectedProductDetails}
            clearSearch={clearSearch}
          />
        )}

        {offersLoading ? (
          <CarouselSkeleton />
        ) : (
          offers.length > 0 && <OffersCarousel offers={offers} />
        )}

        {(selectedSegment || selectedGenders.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {selectedSegment && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
                {selectedSegment.toUpperCase()}
                <button
                  onClick={() => setSelectedSegment("")}
                  className="text-indigo-400 hover:text-indigo-700"
                >
                  ×
                </button>
              </span>
            )}
            {selectedGenders.map((g) => (
              <span
                key={g}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-medium border border-rose-100"
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
                <button
                  onClick={() => handleGenderClick(g)}
                  className="text-rose-400 hover:text-rose-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 lg:gap-6">
            {[...Array(12)].map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : allProducts?.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 lg:gap-6">
              {allProducts.map((product, productIndex) =>
                product.variants?.map((variant, variantIndex) =>
                  variant.articles?.map((article, articleIndex) => {
                    const isLast =
                      productIndex === allProducts.length - 1 &&
                      variantIndex === product.variants.length - 1 &&
                      articleIndex === variant.articles.length - 1;

                    return (
                      <div key={article._id} ref={isLast ? lastProductRef : null}>
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

            {isFetchingMore && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 lg:gap-6 mt-4">
                {[...Array(4)].map((_, index) => (
                  <ProductCardSkeleton key={`loading-${index}`} />
                ))}
              </div>
            )}

            {!hasMore && allProducts.length > 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">You've reached the end!</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 md:py-20">
            <h3 className="text-lg md:text-xl font-semibold text-gray-700">
              No Products Found
            </h3>
            <p className="text-sm md:text-base text-gray-500 mt-2">
              {searchInput
                ? `No results for "${searchInput}". Try different keywords.`
                : "Try selecting a different segment or gender."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductScreen;