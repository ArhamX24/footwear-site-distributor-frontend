import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {createBrowserRouter, RouterProvider} from "react-router-dom"
import AdminPanel from './Screens/AdminPanel/AdminPanel.jsx'
import AdminDashboard from "./Screens/AdminPanel/AdminDashboard.jsx"
import AddDistributor from './Screens/AdminPanel/ManageDistributors.jsx'
import Home from './Screens/User/Home.jsx'
import AddProduct from './Screens/AdminPanel/ManageArticles.jsx'
import AddDeal from './Screens/AdminPanel/ManageDeals.jsx'
import LoginPage from './Components/Auth/LoginPage.jsx'
import ErrorPage from './Components/AdminComponents/ErrorPage.jsx'
import UserErrorPage from './Components/UserComponents/UserErrorPage.jsx'
import PastOrdersPage from './Components/AdminComponents/PastOrdersPage.jsx'
import CartPage from './Screens/User/CartPage.jsx'
import ProductScreen from './Screens/User/ProductScreen.jsx'
import {Provider} from "react-redux"
import Store from './Store/Store.js'
import AuthWrapper from './Components/Auth/AuthWrapper.jsx'
import Unauthorized from './Components/Auth/Unauthorized.jsx'
import BootAuth from './Components/Auth/BootAuth.jsx'
import  {Navigate} from "react-router"
import AllArticlesListed from './Components/AdminComponents/AllArticlesListed.jsx'
import ManageInventory from './Components/AdminComponents/ManageInventory.jsx'

let AppRouter = createBrowserRouter([
  { path: "login", element: <LoginPage /> },
  { path: "/unauthorized", element: <Unauthorized/>},
  {
    path: "/",
    element: <AuthWrapper allowedRole={"distributor"}><Home /></AuthWrapper>,
    errorElement: <UserErrorPage />,
    children: [
    { index: true, element: <Navigate to="dashboard" replace /> },
    { path: "dashboard", element: <ProductScreen /> },
    { path: "cart", element: <CartPage /> },
]
  },
  {
    path: "/secure/admin/",
    element: <AuthWrapper allowedRole={"admin"}><AdminPanel /></AuthWrapper>,
    errorElement: <ErrorPage />,
    children: [
      { path: "dashboard", element: <AdminDashboard /> },
      { path: "distributor", element: <AddDistributor /> },
      { path: "product", element: <AddProduct /> },
      { path: "deal", element: <AddDeal /> },
      { path: "pastorders", element: <PastOrdersPage /> },
      { path: "/secure/admin/product/viewarticles", element: <AllArticlesListed/>},
      { path: "/secure/admin/product/manageinventory", element: <ManageInventory/>}
    ],
  },
]);
createRoot(document.getElementById('root')).render(
  <Provider store={Store}>
    <BootAuth/>
    <RouterProvider router={AppRouter}/>
  </Provider>
)
