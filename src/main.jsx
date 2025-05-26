import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {createBrowserRouter, RouterProvider} from "react-router-dom"
import AdminPanel from './Screens/AdminPanel/AdminPanel.jsx'
import AdminDashboard from "./Screens/AdminPanel/AdminDashboard.jsx"
import AddDistributor from './Screens/AdminPanel/AddDistributor.jsx'
import Home from './Screens/User/Home.jsx'
import AddProduct from './Screens/AdminPanel/AddProduct.jsx'
import AddDeal from './Screens/AdminPanel/AddDeal.jsx'
import AdminProfile from './Screens/AdminPanel/AdminProfile.jsx'
import LoginPage from './Components/UserComponents/LoginPage.jsx'
import AdminLoginPage from './Components/AdminComponents/AdminLoginPage.jsx'
import ErrorPage from './Components/AdminComponents/ErrorPage.jsx'
import UserErrorPage from './Components/UserComponents/UserErrorPage.jsx'
import PastOrdersPage from './Components/AdminComponents/PastOrdersPage.jsx'
import CartPage from './Screens/User/CartPage.jsx'
import ProductScreen from './Screens/User/ProductScreen.jsx'
import {Provider} from "react-redux"
import Store from './Store/Store.js'
import AuthWrapper from './Components/Auth/AuthWrapper.jsx'

let AppRouter = createBrowserRouter([
  {
    path: "/secure/distributor",
    element:<AuthWrapper><App /></AuthWrapper>,
    errorElement: <UserErrorPage/>,
    children: [
      { path: "/", element: <Home /> },
      { path: "dashboard", element: <ProductScreen/>},
      { path: "cart", element: <CartPage/>},
      { path: "*", element: <ErrorPage/>}
    ],
  },
  {
    path: "/secure/admin/",
    element: <AdminPanel />,
    errorElement: <ErrorPage />,
    children: [
      { path: "dashboard", element: <AdminDashboard /> },
      { path: "distributor", element: <AddDistributor /> },
      { path: "product", element: <AddProduct /> },
      { path: "deal", element: <AddDeal /> },
      { path: "profile", element: <AdminProfile /> },
      { path: "pastorders", element: <PastOrdersPage/>},
    ],
  },
  { path: "secure/distributor/login", element: <LoginPage /> },
  { path: "secure/admin/login", element: <AdminLoginPage /> },
]);

createRoot(document.getElementById('root')).render(
  <Provider store={Store}>
    <RouterProvider router={AppRouter}/>
  </Provider>
)
