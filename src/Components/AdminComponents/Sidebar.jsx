import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { baseURL } from "../../Utils/URLS";

const Sidebar = ({ position, setNavMenu }) => {
  const navigate = useNavigate();

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

  // Close mobile menu when clicking a link
  const handleLinkClick = () => {
    if (setNavMenu) {
      setNavMenu(false);
    }
  };

  return (
    <div className={`w-full bg-gray-100 min-h-full ${position} left-0 top-0 z-10 flex flex-col`}>
      <div className='w-11/12 mx-auto flex-1 py-4'>
        <div className='text-gray-700 text-center w-full font-semibold text-sm mb-4'>MENU</div>

        {/* Dashboard */}
        <NavLink
          to="dashboard"
          onClick={handleLinkClick}
          className={({ isActive }) =>
            `p-3 rounded-xl flex items-center justify-start mt-3 duration-200 ease-in-out cursor-pointer text-sm
            ${isActive ? "bg-gray-700 text-white shadow-md" : "hover:bg-gray-200 text-gray-700"}`
          }
        >
          <span className='mr-3'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M11 13V21H4C3.44772 21 3 20.5523 3 20V13H11ZM13 3H20C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H13V3ZM3 4C3 3.44772 3.44772 3 4 3H11V11H3V4Z"></path>
            </svg>
          </span>
          <span>Dashboard</span>
        </NavLink>

        {/* Godown */}
        <NavLink
          to="product/manageinventory"
          onClick={handleLinkClick}
          className={({ isActive }) =>
            `p-3 rounded-xl flex items-center justify-start mt-3 duration-200 ease-in-out cursor-pointer text-sm
            ${isActive ? "bg-gray-700 text-white shadow-md" : "hover:bg-gray-200 text-gray-700"}`
          }
        >
          <span className='mr-3'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M7.00488 7.99966V5.99966C7.00488 3.23824 9.24346 0.999664 12.0049 0.999664C14.7663 0.999664 17.0049 3.23824 17.0049 5.99966V7.99966H20.0049C20.5572 7.99966 21.0049 8.44738 21.0049 8.99966V20.9997C21.0049 21.5519 20.5572 21.9997 20.0049 21.9997H4.00488C3.4526 21.9997 3.00488 21.5519 3.00488 20.9997V8.99966C3.00488 8.44738 3.4526 7.99966 4.00488 7.99966H7.00488ZM7.00488 9.99966H5.00488V19.9997H19.0049V9.99966H17.0049V11.9997H15.0049V9.99966H9.00488V11.9997H7.00488V9.99966ZM9.00488 7.99966H15.0049V5.99966C15.0049 4.34281 13.6617 2.99966 12.0049 2.99966C10.348 2.99966 9.00488 4.34281 9.00488 5.99966V7.99966Z"></path>
            </svg>
          </span>
          <span>Godown</span>
        </NavLink>

        {/* View Articles */}
        <NavLink
          to="product/viewarticles"
          onClick={handleLinkClick}
          className={({ isActive }) =>
            `p-3 rounded-xl flex items-center justify-start mt-3 duration-200 ease-in-out cursor-pointer text-sm
            ${isActive ? "bg-gray-700 text-white shadow-md" : "hover:bg-gray-200 text-gray-700"}`
          }
        >
          <span className='mr-3'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M7.00488 7.99966V5.99966C7.00488 3.23824 9.24346 0.999664 12.0049 0.999664C14.7663 0.999664 17.0049 3.23824 17.0049 5.99966V7.99966H20.0049C20.5572 7.99966 21.0049 8.44738 21.0049 8.99966V20.9997C21.0049 21.5519 20.5572 21.9997 20.0049 21.9997H4.00488C3.4526 21.9997 3.00488 21.5519 3.00488 20.9997V8.99966C3.00488 8.44738 3.4526 7.99966 4.00488 7.99966H7.00488ZM7.00488 9.99966H5.00488V19.9997H19.0049V9.99966H17.0049V11.9997H15.0049V9.99966H9.00488V11.9997H7.00488V9.99966ZM9.00488 7.99966H15.0049V5.99966C15.0049 4.34281 13.6617 2.99966 12.0049 2.99966C10.348 2.99966 9.00488 4.34281 9.00488 5.99966V7.99966Z"></path>
            </svg>
          </span>
          <span>View Articles</span>
        </NavLink>

        {/* Deals */}
        <NavLink
          to="deal"
          onClick={handleLinkClick}
          className={({ isActive }) =>
            `p-3 rounded-xl flex items-center justify-start mt-3 duration-200 ease-in-out cursor-pointer text-sm
            ${isActive ? "bg-gray-700 text-white shadow-md" : "hover:bg-gray-200 text-gray-700"}`
          }
        >
          <span className='mr-3'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 23C16.1421 23 19.5 19.6421 19.5 15.5C19.5 14.6345 19.2697 13.8032 19 13.0296C17.3333 14.6765 16.0667 15.5 15.2 15.5C19.1954 8.5 17 5.5 11 1.5C11.5 6.49951 8.20403 8.77375 6.86179 10.0366C5.40786 11.4045 4.5 13.3462 4.5 15.5C4.5 19.6421 7.85786 23 12 23ZM12.7094 5.23498C15.9511 7.98528 15.9666 10.1223 13.463 14.5086C12.702 15.8419 13.6648 17.5 15.2 17.5C15.8884 17.5 16.5841 17.2992 17.3189 16.9051C16.6979 19.262 14.5519 21 12 21C8.96243 21 6.5 18.5376 6.5 15.5C6.5 13.9608 7.13279 12.5276 8.23225 11.4932C8.35826 11.3747 8.99749 10.8081 9.02477 10.7836C9.44862 10.4021 9.7978 10.0663 10.1429 9.69677C11.3733 8.37932 12.2571 6.91631 12.7094 5.23498Z"></path>
            </svg>
          </span>
          <span>Manage <span className='font-semibold'>Offers</span></span>
        </NavLink>

        {/* Distributors */}
        <NavLink
          to="distributor"
          onClick={handleLinkClick}
          className={({ isActive }) =>
            `p-3 rounded-xl flex items-center justify-start mt-3 duration-200 ease-in-out cursor-pointer text-sm
            ${isActive ? "bg-gray-700 text-white shadow-md" : "hover:bg-gray-200 text-gray-700"}`
          }
        >
          <span className='mr-3'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M11.8611 2.39057C12.8495 1.73163 14.1336 1.71797 15.1358 2.35573L19.291 4.99994H20.9998C21.5521 4.99994 21.9998 5.44766 21.9998 5.99994V14.9999C21.9998 15.5522 21.5521 15.9999 20.9998 15.9999H19.4801C19.5396 16.9472 19.0933 17.9102 18.1955 18.4489L13.1021 21.505C12.4591 21.8907 11.6609 21.8817 11.0314 21.4974C10.3311 22.1167 9.2531 22.1849 8.47104 21.5704L3.33028 17.5312C2.56387 16.9291 2.37006 15.9003 2.76579 15.0847C2.28248 14.7057 2 14.1254 2 13.5109V6C2 5.44772 2.44772 5 3 5H7.94693L11.8611 2.39057ZM4.17264 13.6452L4.86467 13.0397C6.09488 11.9632 7.96042 12.0698 9.06001 13.2794L11.7622 16.2518C12.6317 17.2083 12.7903 18.6135 12.1579 19.739L17.1665 16.7339C17.4479 16.5651 17.5497 16.2276 17.4448 15.9433L13.0177 9.74551C12.769 9.39736 12.3264 9.24598 11.9166 9.36892L9.43135 10.1145C8.37425 10.4316 7.22838 10.1427 6.44799 9.36235L6.15522 9.06958C5.58721 8.50157 5.44032 7.69318 5.67935 7H4V13.5109L4.17264 13.6452ZM14.0621 4.04306C13.728 3.83047 13.3 3.83502 12.9705 4.05467L7.56943 7.65537L7.8622 7.94814C8.12233 8.20827 8.50429 8.30456 8.85666 8.19885L11.3419 7.45327C12.5713 7.08445 13.8992 7.53859 14.6452 8.58303L18.5144 13.9999H19.9998V6.99994H19.291C18.9106 6.99994 18.5381 6.89148 18.2172 6.68727L14.0621 4.04306ZM6.18168 14.5448L4.56593 15.9586L9.70669 19.9978L10.4106 18.7659C10.6256 18.3897 10.5738 17.9178 10.2823 17.5971L7.58013 14.6247C7.2136 14.2215 6.59175 14.186 6.18168 14.5448Z"></path>
            </svg>
          </span>
          <span>Manage <span className='font-semibold'>Distributors</span></span>
        </NavLink>

        {/* Bar Code Generator */}
        <NavLink
          to="/secure/admin/managecontractor"
          onClick={handleLinkClick}
          className={({ isActive }) =>
            `p-3 rounded-xl flex items-center justify-start mt-3 duration-200 ease-in-out cursor-pointer text-sm
            ${isActive ? "bg-gray-700 text-white shadow-md" : "hover:bg-gray-200 text-gray-700"}`
          }
        >
          <span className='mr-3'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M5 20H19V22H5V20ZM12 18C7.58172 18 4 14.4183 4 10C4 5.58172 7.58172 2 12 2C16.4183 2 20 5.58172 20 10C20 14.4183 16.4183 18 12 18ZM12 16C15.3137 16 18 13.3137 18 10C18 6.68629 15.3137 4 12 4C8.68629 4 6 6.68629 6 10C6 13.3137 8.68629 16 12 16Z"></path>
            </svg>
          </span>
          <span>Bar Code Generator</span>
        </NavLink>

        {/* Managers */}
        <NavLink
          to="/secure/admin/managemanagers"
          onClick={handleLinkClick}
          className={({ isActive }) =>
            `p-3 rounded-xl flex items-center justify-start mt-3 duration-200 ease-in-out cursor-pointer text-sm
            ${isActive ? "bg-gray-700 text-white shadow-md" : "hover:bg-gray-200 text-gray-700"}`
          }
        >
          <span className='mr-3'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M4 22C4 17.5817 7.58172 14 12 14C16.4183 14 20 17.5817 20 22H4ZM13 16.083V20H17.6586C16.9423 17.9735 15.1684 16.4467 13 16.083ZM11 20V16.083C8.83165 16.4467 7.05766 17.9735 6.34141 20H11ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13ZM12 11C14.2104 11 16 9.21043 16 7C16 4.78957 14.2104 3 12 3C9.78957 3 8 4.78957 8 7C8 9.21043 9.78957 11 12 11Z"></path>
            </svg>
          </span>
          <span>Add <span className='font-semibold'>Managers</span></span>
        </NavLink>

        {/* Past Orders */}
        <NavLink
          to="pastorders"
          onClick={handleLinkClick}
          className={({ isActive }) =>
            `p-3 rounded-xl flex items-center justify-start mt-3 duration-200 ease-in-out cursor-pointer text-sm
            ${isActive ? "bg-gray-700 text-white shadow-md" : "hover:bg-gray-200 text-gray-700"}`
          }
        >
          <span className='mr-3'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 1L21.5 6.5V17.5L12 23L2.5 17.5V6.5L12 1ZM5.49388 7.0777L13.0001 11.4234V20.11L19.5 16.3469V7.65311L12 3.311L5.49388 7.0777ZM4.5 8.81329V16.3469L11.0001 20.1101V12.5765L4.5 8.81329Z"></path>
            </svg>
          </span>
          <span>Manage <span className='font-semibold'>Past Orders</span></span>
        </NavLink>
      </div>

      {/* Logout Button at Bottom */}
      <div className='w-11/12 mx-auto pb-6 mt-auto'>
        <button
          onClick={handleLogout}
          className="w-full p-3 rounded-xl flex items-center justify-start bg-red-50 hover:bg-red-600 text-red-600 hover:text-white duration-200 ease-in-out cursor-pointer border-2 border-red-200 hover:border-red-600 transition-all text-sm"
        >
          <span className='mr-3'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M5 22C4.44772 22 4 21.5523 4 21V3C4 2.44772 4.44772 2 5 2H19C19.5523 2 20 2.44772 20 3V6H18V4H6V20H18V18H20V21C20 21.5523 19.5523 22 19 22H5ZM18 16V13H11V11H18V8L23 12L18 16Z"></path>
            </svg>
          </span>
          <span className="font-semibold">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
