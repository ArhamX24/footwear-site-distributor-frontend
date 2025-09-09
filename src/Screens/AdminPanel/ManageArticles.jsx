import { Link } from "react-router"
import { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../../Utils/URLS";

const AddProduct = () => {
  const [products, setProducts] = useState(null)
  const [totalProducts, setTotalProducts] = useState(0)
  const [inventoryDataCount, setInventoryDataCount] = useState(0)

  const getProducts = async () => {
    try {
      let response = await axios.get(
        `${baseURL}/api/v1/admin/products/getproducts`
      );
      setProducts(response.data.data);
      setTotalProducts(response.data.totalCount)
    } catch (error) {
      console.error(error.response?.data);
    }
  };

  const fetchAllInventoryData = async () => {
    try {
      const response = await axios.get(`${baseURL}/api/v1/admin/inventory/all`);
      if (response.data.result) {
        const data = response.data.data;
        setInventoryDataCount(data.inventoryCount || 0);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getProducts()
    fetchAllInventoryData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Page Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Manage Articles & Inventory</h1>
          <p className="text-gray-600">Manage your product catalog and track inventory levels efficiently</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-800">{inventoryDataCount}</p>
                <p className="text-gray-600 text-sm">Items in Stock</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-800">{totalProducts}</p>
                <p className="text-gray-600 text-sm">Total Articles</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold text-gray-800">Add New Article</h4>
                  <p className="text-sm text-gray-600">Create new product entries</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold text-gray-800">Import Products</h4>
                  <p className="text-sm text-gray-600">Bulk import from Excel</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="max-w-6xl mx-auto my-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Manage Inventory Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="bg-gray-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Manage Inventory</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">Track stock levels, update quantities, and manage your product inventory efficiently across all locations.</p>
              <Link
                to="/secure/admin/product/manageinventory"
                className="block w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-xl font-semibold text-center transition-colors duration-200 transform hover:scale-105"
              >
                Open Inventory Manager
              </Link>
            </div>
          </div>

          {/* Manage Articles Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="bg-gray-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Manage Articles</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">Add, edit, or remove articles from your catalog. Update descriptions, prices, and categories with ease.</p>
              <Link
                to="/secure/admin/product/viewarticles"
                className="block w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-xl font-semibold text-center transition-colors duration-200 transform hover:scale-105"
              >
                Manage Articles
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default AddProduct
