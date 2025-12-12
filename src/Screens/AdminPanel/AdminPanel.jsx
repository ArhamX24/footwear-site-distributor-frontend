import { useState, useEffect } from 'react'
import Sidebar from '../../Components/AdminComponents/Sidebar'
import { Link, Outlet } from 'react-router'
import logo from "../../../public/logo.png"

const AdminPanel = () => {
  const [navMenu, setNavMenu] = useState(false)

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (navMenu) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [navMenu])

  return (
    <div className='min-h-screen w-full bg-gray-50'>
      {/* Navbar */}
      <div className='flex justify-between items-center px-4 py-6 bg-white shadow-sm sticky top-0 z-30'>
        <div className='flex items-center gap-3'>
          {/* Hamburger Menu - Mobile Only */}
          <button
            onClick={() => setNavMenu(!navMenu)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="currentColor"
              className={`transition-transform duration-300 ${navMenu ? 'rotate-90' : ''}`}
            >
              {!navMenu ? (
                <path d="M3 4H21V6H3V4ZM3 11H21V13H3V11ZM3 18H21V20H3V18Z"></path>
              ) : (
                <path d="M12 10.586L16.95 5.636L18.364 7.05L13.414 12L18.364 16.95L16.95 18.364L12 13.414L7.05 18.364L5.636 16.95L10.586 12L5.636 7.05L7.05 5.636L12 10.586Z"></path>
              )}
            </svg>
          </button>
          
          <Link to="/secure/admin/dashboard">
            <img src={logo} className="w-20 md:w-24" alt="Logo" />
          </Link>
        </div>
      </div>

      {/* Mobile Overlay */}
      {navMenu && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setNavMenu(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div 
        className={`
          fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 
          transform transition-transform duration-300 ease-in-out
          lg:hidden overflow-y-auto
          ${navMenu ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <img src={logo} className="w-16" alt="Logo" />
          </div>
          <button
            onClick={() => setNavMenu(false)}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="currentColor"
            >
              <path d="M12 10.586L16.95 5.636L18.364 7.05L13.414 12L18.364 16.95L16.95 18.364L12 13.414L7.05 18.364L5.636 16.95L10.586 12L5.636 7.05L7.05 5.636L12 10.586Z"></path>
            </svg>
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="h-full">
          <Sidebar position="relative" setNavMenu={setNavMenu} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className='w-full flex min-h-screen'>
        {/* Desktop Sidebar */}
        <div className='hidden lg:block lg:w-1/5 min-h-full sticky top-20 self-start'>
          <Sidebar position="relative" />
        </div>

        {/* Main Content */}
        <div className='lg:w-4/5 w-full py-6 px-4'>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AdminPanel
