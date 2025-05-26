import {configureStore} from "@reduxjs/toolkit"
import CartReducer from '../Slice/CartSlice'
import NavReducer from "../Slice/NavSlice"
import AuthReducer from "../Slice/AuthSlice"


const Store = configureStore({
    reducer: {
        cart: CartReducer,
        nav: NavReducer,
        auth: AuthReducer
    }
})

export default Store