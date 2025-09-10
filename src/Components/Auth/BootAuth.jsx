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
    
    // ✅ ALWAYS validate with backend - don't trust Redux Persist alone
    const validateAuthentication = async () => {
      dispatch(setAuthLoading(true));
      
      try {
        const response = await api.get(getMeEndpoint());
        
        if (response.data.result && response.data.data?.role) {
          dispatch(setUserRole(response.data.data.role));
          dispatch(setIsLoggedIn(true));
        } else {
          throw new Error("Invalid response structure");
        }
      } catch (meError) {

        try {
          const refreshResponse = await api.get(getRefreshEndpoint());
          
          if (refreshResponse.data.result) {
            const meResponse = await api.get(getMeEndpoint());
            
            if (meResponse.data.result && meResponse.data.data?.role) {
              dispatch(setUserRole(meResponse.data.data.role));
              dispatch(setIsLoggedIn(true));
            } else {
              throw new Error("Invalid response after refresh");
            }
          } else {
            throw new Error("Refresh failed");
          }
        } catch (refreshError) {

          dispatch(setUserRole(""));
          dispatch(setIsLoggedIn(false));
        }
      } finally {
        dispatch(setAuthLoading(false));
      }
    };

    validateAuthentication();
  }, [dispatch]); // Only depend on dispatch

  return null;
}

export default BootAuth;
