import { useState, useEffect } from "react";
import axios from "axios";
import ProductCard from "../../Components/AdminComponents/ProductCard";
import { baseURL } from "../../Utils/URLS";
import { ChevronDown, ChevronUp, Package, Grid3X3, Layers, Search, Filter } from "lucide-react";

const AllArticlesListed = () => {
  const [groupedProducts, setGroupedProducts] = useState(null);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const getProducts = async () => {
    try {
      setLoading(true);
      let response = await axios.get(
        `${baseURL}/api/v1/admin/products/getproducts`
      );
      setGroupedProducts(response.data.groupedData);
    } catch (error) {
      setGroupedProducts({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProducts();
  }, [isDeleted, isUpdated]);

  useEffect(() => {
    getProducts();
  }, []);

  // Filter segments based on search term and auto-expand matching segments
  useEffect(() => {
    if (searchTerm && groupedProducts) {
      const newExpanded = {};
      Object.keys(groupedProducts).forEach(segment => {
        const hasMatch = 
          segment.toLowerCase().includes(searchTerm.toLowerCase()) ||
          groupedProducts[segment].some(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.variantName.toLowerCase().includes(searchTerm.toLowerCase())
          );
        
        if (hasMatch) {
          newExpanded[segment] = true;
        }
      });
      setExpanded(newExpanded);
    } else if (!searchTerm) {
      // Optionally collapse all when search is cleared
      // Remove this if you want to keep previous state
      setExpanded({});
    }
  }, [searchTerm, groupedProducts]);

  // Filter segments based on search term
  const filteredSegments = groupedProducts
    ? Object.keys(groupedProducts).filter(segment =>
        segment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        groupedProducts[segment].some(product =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.variantName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : [];

  // Filter products within a segment based on search term
  const getFilteredProducts = (segment) => {
    if (!searchTerm) {
      return groupedProducts[segment];
    }
    
    return groupedProducts[segment].filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.variantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      segment.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Calculate total products
  const getTotalProducts = () => {
    if (!groupedProducts) return 0;
    return Object.values(groupedProducts).reduce((total, items) => total + items.length, 0);
  };

  // Expand all segments
  const expandAll = () => {
    const allExpanded = {};
    filteredSegments.forEach(segment => {
      allExpanded[segment] = true;
    });
    setExpanded(allExpanded);
  };

  // Collapse all segments
  const collapseAll = () => {
    setExpanded({});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-white rounded-full p-6 shadow-lg mb-4">
            <Package className="text-3xl text-gray-600 animate-pulse" size={32} />
          </div>
          <p className="text-gray-600 font-medium">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-3 rounded-full shadow-lg">
              <Package className="text-2xl text-white" size={24} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            All Articles Listed
          </h1>
          <div className="w-24 h-1 bg-gray-600 mx-auto rounded-full"></div>
          {groupedProducts && (
            <p className="text-gray-600 mt-4">
              {getTotalProducts()} articles across {Object.keys(groupedProducts).length} segments
            </p>
          )}
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search articles or segments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Control Buttons */}
            <div className="flex gap-3">
              <button
                onClick={expandAll}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-medium text-sm"
              >
                <Grid3X3 size={16} />
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all font-medium text-sm"
              >
                <Layers size={16} />
                Collapse All
              </button>
            </div>
          </div>

          {/* Search Results Info */}
          {searchTerm && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {filteredSegments.length === 0 
                  ? `No results found for "${searchTerm}"`
                  : `Found ${filteredSegments.length} segment${filteredSegments.length !== 1 ? 's' : ''} matching "${searchTerm}"`
                }
              </p>
            </div>
          )}
        </div>

        {/* Empty State */}
        {!groupedProducts || Object.keys(groupedProducts).length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <Package className="text-4xl text-gray-400" size={64} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Articles Found
            </h3>
            <p className="text-gray-600 mb-6">
              There are no articles in your system yet.
            </p>
            <button className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-medium">
              Add First Article
            </button>
          </div>
        ) : filteredSegments.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <Search className="text-4xl text-gray-400" size={64} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Results Found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or clear the search to see all articles.
            </p>
            <button 
              onClick={() => setSearchTerm("")}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-medium"
            >
              Clear Search
            </button>
          </div>
        ) : (
          /* Segments List */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {filteredSegments.map((segment, index) => {
              const filteredProducts = getFilteredProducts(segment);
              const isOpen = expanded[segment] || false;

              return (
                <div key={segment} className={index !== filteredSegments.length - 1 ? "border-b border-gray-200" : ""}>
                  {/* Segment Header */}
                  <div
                    className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 cursor-pointer hover:from-gray-100 hover:to-gray-150 transition-all duration-200"
                    onClick={() =>
                      setExpanded((prev) => ({
                        ...prev,
                        [segment]: !prev[segment],
                      }))
                    }
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-600 p-2 rounded-lg">
                        <Package className="text-white" size={18} />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 capitalize text-lg">
                          {segment}
                        </span>
                        <p className="text-sm text-gray-600 mt-0.5">
                          Product segment
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {searchTerm ? `${filteredProducts.length} of ${groupedProducts[segment].length}` : `${filteredProducts.length}`} articles
                        </span>
                        <p className="text-xs text-gray-500">
                          {isOpen ? "Click to collapse" : "Click to expand"}
                        </p>
                      </div>
                      <div className="bg-white p-1 rounded-full shadow-sm">
                        {isOpen ? (
                          <ChevronUp size={20} className="text-gray-600" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-600" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Articles */}
                  {isOpen && (
                    <div className="bg-white">
                      {/* Table Header - Desktop */}
                      <div className="hidden md:grid grid-cols-4 px-6 py-3 bg-gray-50 text-sm font-semibold text-gray-700 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <Package size={16} />
                          Segment
                        </div>
                        <div className="flex items-center gap-2">
                          <Filter size={16} />
                          Category
                        </div>
                        <div className="flex items-center gap-2">
                          <Grid3X3 size={16} />
                          Article
                        </div>
                        <div className="text-center">Actions</div>
                      </div>

                      {/* Articles List */}
                      <div className="max-h-96 overflow-y-auto">
                        {filteredProducts.length > 0 ? (
                          filteredProducts.map((product) => (
                            <ProductCard
                              key={product._id}
                              product={product}
                              setIsDeleted={setIsDeleted}
                              setisUpdated={setIsUpdated}
                            />
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            No matching articles in this segment
                          </div>
                        )}
                      </div>

                      {/* Section Footer */}
                      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                        <p className="text-sm text-gray-800 text-center capitalize">
                          {searchTerm 
                            ? `${filteredProducts.length} matching article${filteredProducts.length !== 1 ? 's' : ''} in ${segment} segment`
                            : `${filteredProducts.length} article${filteredProducts.length !== 1 ? 's' : ''} in ${segment} segment`
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Statistics */}
        {groupedProducts && Object.keys(groupedProducts).length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Inventory Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-600">
                  {Object.keys(groupedProducts).length}
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  Total Segments
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-600">
                  {getTotalProducts()}
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  Total Articles
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-600">
                  {getTotalProducts() > 0 ? Math.round(getTotalProducts() / Object.keys(groupedProducts).length) : 0}
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  Average per Segment
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllArticlesListed;