import logo from "../../../public/logo.png";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { toogleMenu } from "../../Slice/NavSlice";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import Swal from "sweetalert2";
import { baseURL } from "../../Utils/URLS";

const Home = () => {
  const sideMenuOpen = useSelector((Store) => Store.nav.isOpen);
  const cartVal = useSelector((Store) => Store.cart?.totalItems);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      const result = await Swal.fire({
        title: 'Confirm Logout',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Logout',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
      });

      if (result.isConfirmed) {
        // Close mobile menu if open
        if (sideMenuOpen) {
          dispatch(toogleMenu());
        }

        const response = await axios.post(
          `${baseURL}/api/v1/auth/logout`,
          {},
          { withCredentials: true }
        );

        if (response.data.result) {
          await Swal.fire({
            icon: 'success',
            title: 'Logged out successfully',
            timer: 1500,
            showConfirmButton: false
          });
          
          navigate('/login');
        }
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Logout failed',
        text: error.response?.data?.message || 'Please try again'
      });
    }
  };

  // Helper function to check if route is active
  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-800">
      {/* Navbar - Simplified for Desktop */}
      <div className="flex justify-between items-center lg:px-6 md:px-4 px-2 py-4 bg-white text-black shadow-md sticky top-0 z-40 border-b border-gray-200">
        <div className="flex items-center">
          <Link to="/dashboard">
            <img src={logo} className="w-20 md:w-24" alt="PinKey Logo" />
          </Link>
        </div>

        <div className="flex items-center justify-end gap-x-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => dispatch(toogleMenu())}
            className="lg:hidden text-gray-800 focus:outline-none hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Side Menu */}
      {sideMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => dispatch(toogleMenu())}
          />
          <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 lg:hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Menu</h2>
                <button
                  onClick={() => dispatch(toogleMenu())}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <nav className="p-4 space-y-3 flex-1 overflow-y-auto">
              <Link
                to="/dashboard"
                onClick={() => dispatch(toogleMenu())}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive('/dashboard') 
                    ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-medium">Home</span>
              </Link>

              <Link
                to="/cart"
                onClick={() => dispatch(toogleMenu())}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive('/cart') 
                    ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="font-medium">Cart</span>
                {cartVal > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                    {cartVal}
                  </span>
                )}
              </Link>

              <Link
                to="/past-orders"
                onClick={() => dispatch(toogleMenu())}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive('/past-orders') 
                    ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium">Past Orders</span>
              </Link>
            </nav>

            {/* Mobile Logout Button at Bottom */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 p-3 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white transition-all duration-200 border-2 border-red-200 hover:border-red-600 font-semibold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 22C4.44772 22 4 21.5523 4 21V3C4 2.44772 4.44772 2 5 2H19C19.5523 2 20 2.44772 20 3V6H18V4H6V20H18V18H20V21C20 21.5523 19.5523 22 19 22H5ZM18 16V13H11V11H18V8L23 12L18 16Z"></path>
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Layout with Desktop Sidebar */}
      <div className="flex w-full">
        {/* Desktop Sidebar - Hidden on Mobile */}
        <aside className="hidden lg:flex lg:flex-col w-64 h-full bg-white shadow-lg min-h-[calc(100vh-76px)] sticky top-[76px] border-r border-gray-200">
          <nav className="p-4 space-y-2 flex-1">
            <Link
              to="/dashboard"
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                isActive('/dashboard')
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-medium">Home</span>
            </Link>

            <Link
              to="/cart"
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                isActive('/cart')
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartVal > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cartVal}
                  </span>
                )}
              </div>
              <span className="font-medium">Cart</span>
            </Link>

            <Link
              to="/past-orders"
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                isActive('/past-orders')
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium">Past Orders</span>
            </Link>
          </nav>

          {/* Desktop Logout at Bottom */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 p-3 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white transition-all duration-200 border-2 border-red-200 hover:border-red-600 font-semibold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 22C4.44772 22 4 21.5523 4 21V3C4 2.44772 4.44772 2 5 2H19C19.5523 2 20 2.44772 20 3V6H18V4H6V20H18V18H20V21C20 21.5523 19.5523 22 19 22H5ZM18 16V13H11V11H18V8L23 12L18 16Z"></path>
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full lg:w-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Home;
