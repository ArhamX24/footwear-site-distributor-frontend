import { createSlice } from "@reduxjs/toolkit";

const CartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    totalItems: 0,
    dealGrasped: [],
  },
  reducers: {
    addItem: (state, action) => {
      const newProduct = action.payload;
      
      const existingItemIndex = state.items.findIndex(
        (item) =>
          item.productid === newProduct.productid &&
          item.variant === newProduct.variant &&
          item.segment === newProduct.segment &&
          item.sizes === newProduct.sizes &&
          JSON.stringify([...item.colors].sort()) === JSON.stringify([...newProduct.colors].sort())
      );

      if (existingItemIndex !== -1) {
        state.items[existingItemIndex].quantity += newProduct.quantity;
      } else {
        state.items.push(newProduct);
      }
      
      state.totalItems = state.items.length;
    },
    
    updateItem: (state, action) => {
      const { index, quantity, colors, sizes } = action.payload;
      if (state.items[index]) {
        if (quantity !== undefined) {
          state.items[index].quantity = quantity;
        }
        if (colors !== undefined) {
          state.items[index].colors = colors;
        }
        if (sizes !== undefined) {
          state.items[index].sizes = sizes;
        }
        
        state.totalItems = state.items.length;
      }
    },
    
    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
    },
    
    removeItem: (state, action) => {
      const product = action.payload;
      
      // ✅ FIX: Use array index to remove specific item
      state.items = state.items.filter((item, index) => {
        // Match exact item including colors and sizes
        const isMatch = 
          item.productid === product.productid &&
          item.variant === product.variant &&
          item.segment === product.segment &&
          item.sizes === product.sizes &&
          JSON.stringify([...item.colors].sort()) === JSON.stringify([...product.colors].sort());
        
        // Return true to KEEP the item, false to REMOVE it
        return !isMatch;
      });
      
      state.totalItems = state.items.length;
    },
    
    dealGrasped: (state, action) => {
      const productId = action.payload;
      state.dealGrasped.push(productId);
    },
  },
});

export const { addItem, clearCart, removeItem, dealGrasped, updateItem } = CartSlice.actions;
export default CartSlice.reducer;
