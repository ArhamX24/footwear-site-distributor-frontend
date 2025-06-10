import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";

const AuthWrapper = ({ allowedRole, children }) => {
  const userLoggedIn = useSelector((store) => store.auth.isLoggedIn);
  const userRole = useSelector((store) => store.auth.userRole);
  const location = useLocation();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (userLoggedIn) {
      if (userRole) {
        setCheckingAuth(false); // ✅ Wait for Redux to fully update userRole
      }
    } else {
      setCheckingAuth(false); // ✅ Ensure unauthorized users don't get stuck
    }
  }, [userLoggedIn, userRole]);

  if (checkingAuth) return <div>Loading...</div>; // ✅ Avoid premature redirects

  return (
    !userLoggedIn ? (
      <Navigate to="/login" replace />
    ) : userRole === allowedRole ? (
      children || <Outlet /> // ✅ Supports nested routes
    ) : (
      <Navigate to="/login"/>
    )
  );
};

export default AuthWrapper;