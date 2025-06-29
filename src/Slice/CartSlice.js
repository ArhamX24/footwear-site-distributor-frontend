import { createSlice } from "@reduxjs/toolkit";

const CartSlice = createSlice({
    name: 'cart',
    initialState: {
        items: [],
        totalItems: 0,
        totalPrice: 0,
        dealGrasped: [],
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
        },
        removeItem: (state, action) => {
            let product = action.payload;
            state.items = state.items.filter(item => item.productid !== product.productid);
            state.totalPrice -= product.price
            state.totalItems -= 1
        },
        dealGrasped: (state, action) => {
            let productId = action.payload
            state.dealGrasped.push(productId)
        }
    }
})

export const {
    addItem,
    clearCart,
    removeItem,
    dealGrasped
} = CartSlice.actions

export default CartSlice.reducer