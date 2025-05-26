import React, { useState } from 'react'
import MenuIcon from "@mui/icons-material/Menu"
import Sidebar from '../../Components/AdminComponents/Sidebar'
import { Link, Outlet } from 'react-router'
import logo from "../../../public/logo.png"

const AdminPanel = () => {
  const [navMenu, setNavMenu] = useState(false)

  return (
    <div className='min-h-screen w-full'>
    <div className='w-full h-full'>    
      <div className='flex justify-between items-center px-4 py-6 bg-gray-100'>
        <div className='flex items-center'>
        <div
  className="mr-4 lg:hidden transition-transform duration-300 ease-in-out"
  onClick={() => setNavMenu(!navMenu)}
>
  {!navMenu ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      className="transition-transform duration-300 ease-in-out rotate-0"
    >
      <path d="M21 17.9995V19.9995H3V17.9995H21ZM17.4038 3.90332L22 8.49951L17.4038 13.0957L15.9896 11.6815L19.1716 8.49951L15.9896 5.31753L17.4038 3.90332ZM12 10.9995V12.9995H3V10.9995H12ZM12 3.99951V5.99951H3V3.99951H12Z"></path>
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      className="transition-transform duration-300 ease-in-out rotate-180"
    >
      <path d="M21 17.9995V19.9995H3V17.9995H21ZM6.59619 3.90332L8.01041 5.31753L4.82843 8.49951L8.01041 11.6815L6.59619 13.0957L2 8.49951L6.59619 3.90332ZM21 10.9995V12.9995H12V10.9995H21ZM21 3.99951V5.99951H12V3.99951H21Z"></path>
    </svg>
  )}
</div>
            <Link to={"/secure/admin/dashboard"}><img src={logo} className="w-24"></img></Link>
        </div>
        <Link to={"profile"}>
            <div className='px-4 py-2 rounded-xl bg-gray-600 text-white cursor-pointer'>Profile</div>  
        </Link>
        </div>
      {
        navMenu ? 
            <div className={`w-1/2 h-screen fixed bg-white shadow-lg z-10 p-5 transition-transform duration-300 ease-in-out ${
        navMenu ? "translate-x-0" : "-translate-x-full"
      }`} onClick={(e)=>{e.stopPropagation(), e.preventDefault(), setNavMenu(false)}}>
                  <Sidebar position={"absolute"} setNavMenu={setNavMenu}/>
            </div>: ""
      }
    <div className='w-full flex min-h-screen' onClick={()=> {setNavMenu(false)}}>
        <div className='hidden lg:block lg:w-1/5 min-h-full'>
        <Sidebar/>
        </div>
        <div className='lg:w-4/5 w-full py-6'>
        <Outlet/>
        </div>
    </div>
    </div>
    </div>
  )
}

export default AdminPanel

