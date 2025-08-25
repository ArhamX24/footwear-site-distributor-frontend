import { configureStore } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import CartReducer from "../Slice/CartSlice";
import NavReducer from "../Slice/NavSlice";
import AuthReducer from "../Slice/AuthSlice";
import QrReducer from "../Slice/QrSlice"

// Persist only auth state (so login persists across refreshes)
const authPersistConfig = {
    key: "auth",
    storage,
    whitelist: ["isLoggedIn", "userRole"] // Only store necessary auth fields
};

const persistedAuthReducer = persistReducer(authPersistConfig, AuthReducer);

const Store = configureStore({
    reducer: {
        cart: CartReducer,
        nav: NavReducer,
        auth: persistedAuthReducer, // Use persisted version of auth slice
        qr: QrReducer
    }
});

export const persistor = persistStore(Store); // Enables persistence
export default Store;