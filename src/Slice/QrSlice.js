import { createSlice } from "@reduxjs/toolkit";

const QrSlice = createSlice({
    name: "Qr",
    initialState: {
        isOpen: false
    },
    reducers: {
        setIsOpen: (state, action) => {            
          state.isOpen = action.payload;
        }
        
    }
});

export const {
    setIsOpen
} = QrSlice.actions

export default QrSlice.reducer