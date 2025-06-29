import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import axios from "axios";
import { baseURL } from "../../Utils/URLS";

const AuthWrapper = ({ allowedRole, children }) => {
  const userRole = useSelector((store) => store.auth.userRole);
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const getUser = async () => {
    try {
      let response = await axios.get(`${baseURL}/api/v1/auth/me`, {withCredentials: true})
      if(response.data.data){
        setIsLoggedIn(true)
      }
    } catch (error) {
      setIsLoggedIn(false)
    }
    
  }

  useEffect(()=>{
    getUser()
  },[])

  if (!isLoggedIn) return <div>Loading...</div>; // ✅ Avoid premature redirects

  return (
    !isLoggedIn ? (
      <Navigate to="/login" replace />
    ) : userRole === allowedRole ? (
      children || <Outlet /> // ✅ Supports nested routes
    ) : (
      <Navigate to="/login"/>
    )
  );
};

export default AuthWrapper;