import { createSlice } from "@reduxjs/toolkit";

const CartSlice = createSlice({
    name: 'cart',
    initialState: {
        items: [],
        totalItems: 0,
        totalPrice: 0
    },
    reducers: {
        addItem: (state,action) => {
          let product = action.payload;
          state.items.push(product)
          state.totalPrice += product.price
          state.totalItems += 1
        },
        clearCart: (state) => {
            state.items = []
            state.totalItems = 0
            state.totalPrice = 0
        }
    }
})

export const {
    addItem,
    clearCart
} = CartSlice.actions

export default CartSlice.reducer