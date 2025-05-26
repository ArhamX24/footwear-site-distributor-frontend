import { createSlice } from "@reduxjs/toolkit";

const AuthSlice = createSlice({
    name: "auth",
    initialState: {
        userRole: "",
        isLoggedIn: false
    },
    reducers: {
        setUserRole: (state, action) => {
            state.userRole = action.payload;
        },
        setIsLoggedIn: (state, action) => {
            state.isLoggedIn = action.payload;
        }
    }
});

export const {
    setUserRole,
    setIsLoggedIn
} = AuthSlice.actions

export default AuthSlice.reducer