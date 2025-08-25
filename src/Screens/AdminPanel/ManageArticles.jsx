import { Link } from "react-router"
import { useEffect, useState } from "react";
import axios from "axios";
import { baseURL } from "../../Utils/URLS";
import QRGenerationModal from "../../Components/AdminComponents/QRGenerationModal";
import QrModalContent from "../../Components/AdminComponents/QRModalContent"
import { useDispatch, useSelector } from "react-redux";

const AddProduct = () => {

  const [products, setProducts] = useState(null)
  const [totalProducts, setTotalProducts] = useState(0)

  const dispatch = useDispatch();
  const isQrModalOpen = useSelector((Store)=> Store.qr.isOpen);
  
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

  useEffect(() => {
    getProducts()
  }, [])
  

  return (
    <>
    {
      isQrModalOpen && <div className="fixed inset-0 flex items-center justify-center bg-gray-900/50 z-10 p-4 ">
                        <QrModalContent products={products}/>
                      </div>
    }
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Page Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Manage Articles</h1>
          <p className="text-gray-600">Generate QR codes, manage inventory, and organize your articles efficiently</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-800">89</p>
                <p className="text-gray-600 text-sm">QR Codes Generated</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-800">1,234</p>
                <p className="text-gray-600 text-sm">Items in Stock</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Generate QR Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="p-8">
              <div className="bg-gray-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Generate QR Code</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">Create QR codes for your articles to enable quick scanning and easy access to product information.</p>
              {/* Replace the button with the QR Generation Modal */}
              <QRGenerationModal products={products} />
            </div>
          </div>

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
                Open Inventory
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
    </>
)
}
export default AddProduct