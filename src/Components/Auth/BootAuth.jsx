// ✅ CORRECTED BootAuth.jsx - Always validate with backend
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "./api";
import { setUserRole, setIsLoggedIn, setAuthLoading } from "../../Slice/AuthSlice";

function BootAuth() {
  const dispatch = useDispatch();
  
  const getMeEndpoint = () => "/api/v1/auth/me";
  const getRefreshEndpoint = () => "/api/v1/auth/refresh";

  useEffect(() => {
    console.log("🚀 BootAuth: Starting authentication check");
    
    // ✅ ALWAYS validate with backend - don't trust Redux Persist alone
    const validateAuthentication = async () => {
      console.log("🔵 BootAuth: Setting loading to TRUE");
      dispatch(setAuthLoading(true));
      
      try {
        console.log("🔵 BootAuth: Making /me request to validate tokens...");
        const response = await api.get(getMeEndpoint());
        console.log("✅ BootAuth: /me SUCCESS:", response.data);
        
        if (response.data.result && response.data.data?.role) {
          console.log("✅ BootAuth: Tokens valid, user authenticated with role:", response.data.data.role);
          dispatch(setUserRole(response.data.data.role));
          dispatch(setIsLoggedIn(true));
        } else {
          console.log("❌ BootAuth: Invalid /me response, trying refresh...");
          throw new Error("Invalid response structure");
        }
      } catch (meError) {
        console.log("❌ BootAuth: /me FAILED:", meError.response?.status);
        console.error(meError)
        
        try {
          console.log("🔄 BootAuth: Trying refresh token...");
          const refreshResponse = await api.get(getRefreshEndpoint());
          console.log("✅ BootAuth: Refresh SUCCESS:", refreshResponse.data);
          
          if (refreshResponse.data.result) {
            console.log("🔄 BootAuth: Refresh successful, trying /me again...");
            const meResponse = await api.get(getMeEndpoint());
            
            if (meResponse.data.result && meResponse.data.data?.role) {
              console.log("✅ BootAuth: User authenticated after refresh with role:", meResponse.data.data.role);
              dispatch(setUserRole(meResponse.data.data.role));
              dispatch(setIsLoggedIn(true));
            } else {
              throw new Error("Invalid response after refresh");
            }
          } else {
            throw new Error("Refresh failed");
          }
        } catch (refreshError) {
          console.log("❌ BootAuth: Both /me and refresh FAILED - user not authenticated");
          console.error(refreshError)
          dispatch(setUserRole(""));
          dispatch(setIsLoggedIn(false));
        }
      } finally {
        console.log("🏁 BootAuth: Setting loading to FALSE - validation complete");
        dispatch(setAuthLoading(false));
      }
    };

    validateAuthentication();
  }, [dispatch]); // Only depend on dispatch

  return null;
}

export default BootAuth;
