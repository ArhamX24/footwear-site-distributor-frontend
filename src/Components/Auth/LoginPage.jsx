import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useFormik } from 'formik';
import CircularProgress from "@mui/material/CircularProgress";
import { useNavigate } from "react-router-dom";
import logo from "../../../public/logo.png";
import { useDispatch } from 'react-redux';
import { setIsLoggedIn, setUserRole } from '../../Slice/AuthSlice'; // Updated to only track role
import { baseURL } from '../../Utils/URLS';

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [eyeOpen, setEyeOpen] = useState(false);

  let inputRef = useRef();

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleEyeOpen = () => {
    setEyeOpen(!eyeOpen);
  };

  const formik = useFormik({
    initialValues: {
      phoneNo: "",
      password: "",
    },
    onSubmit: async (values, action) => {
      try {
        setIsLoading(true);
        setError('');

        let { phoneNo, password } = values;

        // ✅ Send login request to unified login API
        const response = await axios.post(`/api/v1/auth/login`, { phoneNo, password }, { withCredentials: true });

        if (!response.data.result) {
          setIsLoading(false)
          setError(response.data.message);
          return;
        }

        // ✅ Dispatch Redux role state
        dispatch(setUserRole(response.data.role));

        // ✅ Redirect based on role
        if (response.data.role === "admin") navigate('/secure/admin/dashboard');
        else if (response.data.role === "distributor") navigate('/dashboard');

        action.resetForm();
      } catch (error) {
        console.error(error)
        setError(error.response?.data?.message || "Login Failed. Try Again.");
      } finally {
        setIsLoading(false)
      }
    }
  });

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  return (
    <div className='w-full min-h-screen flex items-center justify-center bg-gray-300'>
      <div className="w-96 bg-gray-200 rounded-lg shadow-md p-6">
        <img src={logo} alt="logo" className='w-20 mb-2 mx-auto' />
        <div className="mb-4 h-28 flex items-center justify-center flex-col bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg">
          <h3 className="text-2xl font-bold text-white">Sign In</h3>
        </div>
        <div className="flex flex-col gap-4">
          <form onSubmit={formik.handleSubmit}>
            <input
              type="tel"
              placeholder="Eg. 9897989765"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-gray-500 focus:outline-none"
              name="phoneNo"
              ref={inputRef}
              value={formik.values.phoneNo}
              onChange={formik.handleChange}
              pattern="[0-9]{10}"
              maxLength={10}
            />
            <div className='flex items-center my-3'>
              <input
                type={eyeOpen ? "text" : "password"}
                placeholder="Password"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:border-gray-500 focus:outline-none"
                name="password"
                value={formik.values.password}
                onChange={formik.handleChange}
              />
              <span className='ml-2 cursor-pointer' onClick={handleEyeOpen}>
                {
                  !eyeOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M4.52047 5.93457L1.39366 2.80777L2.80788 1.39355L22.6069 21.1925L21.1927 22.6068L17.8827 19.2968C16.1814 20.3755 14.1638 21.0002 12.0003 21.0002C6.60812 21.0002 2.12215 17.1204 1.18164 12.0002C1.61832 9.62282 2.81932 7.5129 4.52047 5.93457ZM14.7577 16.1718L13.2937 14.7078C12.902 14.8952 12.4634 15.0002 12.0003 15.0002C10.3434 15.0002 9.00026 13.657 9.00026 12.0002C9.00026 11.537 9.10522 11.0984 9.29263 10.7067L7.82866 9.24277C7.30514 10.0332 7.00026 10.9811 7.00026 12.0002C7.00026 14.7616 9.23884 17.0002 12.0003 17.0002C13.0193 17.0002 13.9672 16.6953 14.7577 16.1718ZM7.97446 3.76015C9.22127 3.26959 10.5793 3.00016 12.0003 3.00016C17.3924 3.00016 21.8784 6.87992 22.8189 12.0002C22.5067 13.6998 21.8038 15.2628 20.8068 16.5925L16.947 12.7327C16.9821 12.4936 17.0003 12.249 17.0003 12.0002C17.0003 9.23873 14.7617 7.00016 12.0003 7.00016C11.7514 7.00016 11.5068 7.01833 11.2677 7.05343L7.97446 3.76015Z"></path></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M1.18164 12C2.12215 6.87976 6.60812 3 12.0003 3C17.3924 3 21.8784 6.87976 22.8189 12C21.8784 17.1202 17.3924 21 12.0003 21C6.60812 21 2.12215 17.1202 1.18164 12ZM12.0003 17C14.7617 17 17.0003 14.7614 17.0003 12C17.0003 9.23858 14.7617 7 12.0003 7C9.23884 7 7.00026 9.23858 7.00026 12C7.00026 14.7614 9.23884 17 12.0003 17ZM12.0003 15C10.3434 15 9.00026 13.6569 9.00026 12C9.00026 10.3431 10.3434 9 12.0003 9C13.6571 9 15.0003 10.3431 15.0003 12C15.0003 13.6569 13.6571 15 12.0003 15Z"></path></svg>
                  )
                }
              </span>
            </div>
            <div className='text-sm my-2 text-center text-red-500'>{error ? error : ""}</div>
            <div className="pt-4">
              <button type='submit' className="w-full bg-gray-700 text-white py-2 rounded-lg transition-transform duration-200 hover:scale-105">
                {isLoading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;