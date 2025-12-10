// hooks/useAuth.js - Custom hook for auth operations
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../Slice/AuthSlice';
import axios from 'axios';
import { baseURL } from '../Utils/URLS';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Call logout API to clear cookies
      await axios.post(`/api/v1/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always clear Redux state and redirect
      dispatch(logout());
      navigate('/');
    }
  };

  return { handleLogout };
};
