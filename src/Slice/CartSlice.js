import { createSlice } from "@reduxjs/toolkit";

const CartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    totalItems: 0,
    totalPrice: 0,
    dealGrasped: [],
  },
  reducers: {
    addItem: (state, action) => {
      let product = action.payload;
      state.items.push(product);
      state.totalPrice += product.price;
      state.totalItems += 1;
    },
    updateItem: (state, action) => {
      const { index, quantity, colors, sizes } = action.payload;
      if (state.items[index]) {
        // Update quantity
        if (quantity !== undefined) {
          const oldQuantity = state.items[index].quantity;
          state.items[index].quantity = quantity;
          // Recalculate price
          state.items[index].price = state.items[index].singlePrice * quantity;
          // Update total price
          const priceDiff = (quantity - oldQuantity) * state.items[index].singlePrice;
          state.totalPrice += priceDiff;
        }
        // Update colors if provided
        if (colors !== undefined) {
          state.items[index].colors = colors;
        }
        // Update sizes if provided
        if (sizes !== undefined) {
          state.items[index].sizes = sizes;
        }
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalPrice = 0;
    },
    removeItem: (state, action) => {
      let product = action.payload;
      state.items = state.items.filter((item) => item.productid !== product.productid);
      state.totalPrice -= product.price;
      state.totalItems -= 1;
    },
    dealGrasped: (state, action) => {
      let productId = action.payload;
      state.dealGrasped.push(productId);
    },
  },
});

export const { addItem, clearCart, removeItem, dealGrasped, updateItem } = CartSlice.actions;
export default CartSlice.reducer;
