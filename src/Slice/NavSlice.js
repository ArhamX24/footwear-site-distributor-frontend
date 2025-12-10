import { createSlice } from "@reduxjs/toolkit";

const NavSlice = createSlice({
    name: 'nav',
    initialState: {
        isOpen: false,
        searchQuery: "",
    },
    reducers: {
        toogleMenu: (state) => {
            state.isOpen = !state.isOpen;
        },
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
        },
    }
});

export const { toogleMenu, setSearchQuery } = NavSlice.actions;
export default NavSlice.reducer;
