import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "./api";
import { setUserRole } from "../../Slice/AuthSlice";

function BootAuth() {
  const dispatch = useDispatch();
  const userRole = useSelector((Store) => Store.auth.userRole);

  // Function to determine correct API paths
  const getMeEndpoint = () => "/api/v1/auth/me"; // ✅ Unified for both roles
  const getRefreshEndpoint = () => "/api/v1/auth/refresh"; // ✅ Unified for both roles

  useEffect(() => {
  (async () => {
    try {
      // First, attempt to get user details
      const response = await api.get(getMeEndpoint());
      const userDetails = response.data.data; // <-- nested user details
      
      if (userDetails?.role) {
        dispatch(setUserRole(userDetails.role));
      } else {
        throw new Error("Role not found, attempting refresh...");
      }
    } catch {
      try {
        // If user details fail, attempt refresh
        await api.get(getRefreshEndpoint());
        const response = await api.get(getMeEndpoint());
        const userDetails = response.data.data; // <-- nested user details
        
        if (userDetails?.role) {
          dispatch(setUserRole(userDetails.role));
        } else {
          throw new Error("User role still undefined after refresh.");
        }
      } catch (error) {
        console.error("Error refreshing token:", error);
      }
    }
  })();
}, []); // ✅ Removed `userRole` dependency to prevent unnecessary re-renders

  return null; // This component only runs logic, no UI needed
}

export default BootAuth;