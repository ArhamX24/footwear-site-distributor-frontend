// Components/Auth/AuthWrapper.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

const AuthWrapper = ({ allowedRoles, children }) => {
  const { isLoggedIn, userRole, isLoading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // ✅ ENHANCED: Handle both single role and array of roles
  const allowedRolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  if (!allowedRolesArray.includes(userRole)) {

    
    // ✅ ENHANCED: Redirect to user's appropriate dashboard instead of unauthorized
    const redirectMap = {
      'admin': '/secure/admin/dashboard',
      'distributor': '/dashboard',
      'contractor': '/secure/contractor/qrgenerator',
      'warehouse_inspector': '/secure/warehousemanager/scanner',
      'shipment_manager': '/secure/shipment/scanner'
    };
    
    const redirectTo = redirectMap[userRole] || '/unauthorized';
    return <Navigate to={redirectTo} replace />;
  }
  return children || <Outlet />;
};

export default AuthWrapper;
