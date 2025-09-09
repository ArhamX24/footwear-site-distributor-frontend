// Components/Auth/AuthWrapper.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

const AuthWrapper = ({ allowedRoles, children }) => {
  const { isLoggedIn, userRole, isLoading } = useSelector((state) => state.auth);
  const location = useLocation();
  
  console.log("🛡️ AuthWrapper RENDER:");
  console.log("🛡️   - Current path:", location.pathname);
  console.log("🛡️   - isLoading:", isLoading);
  console.log("🛡️   - isLoggedIn:", isLoggedIn);
  console.log("🛡️   - userRole:", userRole);
  console.log("🛡️   - allowedRoles:", allowedRoles);

  if (isLoading) {
    console.log("🛡️ AuthWrapper: SHOWING LOADING (waiting for BootAuth)");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    console.log("🛡️ AuthWrapper: USER NOT LOGGED IN -> Redirecting to /login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // ✅ ENHANCED: Handle both single role and array of roles
  const allowedRolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  if (!allowedRolesArray.includes(userRole)) {
    console.log("🛡️ AuthWrapper: ROLE MISMATCH -> Redirecting to appropriate dashboard");
    console.log("🛡️   - User has role:", userRole);
    console.log("🛡️   - Required roles:", allowedRolesArray);
    
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
  
  console.log("🛡️ AuthWrapper: USER AUTHORIZED -> Showing protected content");
  return children || <Outlet />;
};

export default AuthWrapper;
