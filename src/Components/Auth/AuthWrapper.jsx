import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import axios from "axios";
import { baseURL } from "../../Utils/URLS";

const AuthWrapper = ({ allowedRole, children }) => {
 const [isLoggedIn, setIsLoggedIn] = useState(false);
 const [userRole, setUserRole] = useState('')
const [loading, setLoading] = useState(true);

const getUser = async () => {
  try {
    const response = await axios.get(`${baseURL}/api/v1/auth/me`, {
      withCredentials: true,
    });
    if (response.data.data) {
      setIsLoggedIn(true);
      setUserRole(response.data.data.role)
    }
  } catch (error) {
    setIsLoggedIn(false);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  getUser();
}, []);

if (loading) return <div>Loading...</div>;

return !isLoggedIn ? (
  <Navigate to="/login" replace />
) : userRole === allowedRole ? (
  children || <Outlet />
) : (
  <Navigate to="/login" />
);  
};

export default AuthWrapper;