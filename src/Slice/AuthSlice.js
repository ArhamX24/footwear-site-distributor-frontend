// Slice/AuthSlice.js - Add logout action
import { createSlice } from "@reduxjs/toolkit";

const AuthSlice = createSlice({
    name: "auth",
    initialState: {
        userRole: "",
        isLoggedIn: false,
        isLoading: true,
        userData: null // ✅ Add user data storage
    },
    reducers: {
        setUserRole: (state, action) => {
            state.userRole = action.payload;
        },
        setIsLoggedIn: (state, action) => {
            state.isLoggedIn = action.payload;
        },
        setAuthLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        // ✅ NEW: Add user data action
        setUserData: (state, action) => {
            state.userData = action.payload;
        },
        // ✅ NEW: Add logout action
        logout: (state) => {
            state.userRole = "";
            state.isLoggedIn = false;
            state.isLoading = false;
            state.userData = null;
        }
    }
});

export const {
    setUserRole,
    setIsLoggedIn,
    setAuthLoading,
    setUserData,
    logout
} = AuthSlice.actions

export default AuthSlice.reducer
