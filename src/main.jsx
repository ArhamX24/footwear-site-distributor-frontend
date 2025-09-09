// ✅ Updated main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {createBrowserRouter, RouterProvider, Outlet} from "react-router-dom"
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
import Store, { persistor } from './Store/Store.js' // ✅ Import persistor
import AuthWrapper from './Components/Auth/AuthWrapper.jsx'
import Unauthorized from './Components/Auth/Unauthorized.jsx'
import BootAuth from './Components/Auth/BootAuth.jsx'
import  {Navigate} from "react-router"
import AllArticlesListed from './Components/AdminComponents/AllArticlesListed.jsx'
import ManageInventory from './Components/AdminComponents/ManageInventory.jsx'
import QRStatisticsDashboard from './Components/AdminComponents/QRStatisticsDashboard.jsx'
// ✅ ADD THIS IMPORT
import { PersistGate } from 'redux-persist/integration/react'
import QRGenerator from './Components/ContractorComponents/QRGenerator.jsx'
import WarehouseManagerScanner from './Components/WarehouseManagerComponents/WarehouseManagerScanner.jsx'
import ShipmentScanner from './Components/ShipmentManagerComponenets/ShipmentScanner.jsx'
import ManageContractors from './Components/AdminComponents/ManageContractors.jsx'
import ManageManagers from './Components/AdminComponents/ManageManagers.jsx'

// ✅ Create a Layout component that includes BootAuth
const Layout = () => {
  return (
    <>
      <BootAuth />
      <Outlet />
    </>
  );
};

let AppRouter = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "unauthorized", element: <Unauthorized/>},
      {
        path: "/",
        element: <AuthWrapper allowedRoles={["distributor"]}><Home /></AuthWrapper>,
        errorElement: <UserErrorPage />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <ProductScreen /> },
          { path: "cart", element: <CartPage /> },
        ]
      },
      {
        path: "/secure/admin/",
        element: <AuthWrapper allowedRoles={["admin"]}><AdminPanel /></AuthWrapper>,
        errorElement: <ErrorPage />,
        children: [
          { path: "dashboard", element: <AdminDashboard /> },
          { path: "distributor", element: <AddDistributor /> },
          { path: "product", element: <AddProduct /> },
          { path: "deal", element: <AddDeal /> },
          { path: "pastorders", element: <PastOrdersPage /> },
          { path: "/secure/admin/product/viewarticles", element: <AllArticlesListed/>},
          { path: "/secure/admin/product/manageinventory", element: <ManageInventory/>},
          { path: "/secure/admin/product/qrdashboard", element: <QRStatisticsDashboard/>},
          { path: "/secure/admin/managecontractor", element: <ManageContractors/>},
          { path: "/secure/admin/managemanagers", element : <ManageManagers/>},
        ],
      },
      // ✅ FIXED: Added AuthWrapper protection for contractor routes
      {
        path: "/secure/contractor",
        element: <AuthWrapper allowedRoles={["contractor"]} />,
        children: [
          { index: true, element: <Navigate to="qrgenerator" replace /> },
          { path: "qrgenerator", element: <QRGenerator/> }
        ]
      },
      // ✅ FIXED: Added AuthWrapper protection for warehouse manager routes
      {
        path: "/secure/warehousemanager",
        element: <AuthWrapper allowedRoles={["warehouse_inspector"]} />,
        children: [
          { index: true, element: <Navigate to="scanner" replace /> },
          { path: "scanner", element: <WarehouseManagerScanner/> }
        ]
      },
      // ✅ FIXED: Added AuthWrapper protection for shipment manager routes
      {
        path: "/secure/shipment",
        element: <AuthWrapper allowedRoles={["shipment_manager"]} />,
        children: [
          { index: true, element: <Navigate to="scanner" replace /> },
          { path: "scanner", element: <ShipmentScanner/> }
        ]
      }
    ]
  }
]);


// ✅ UPDATED RENDER WITH PERSISTGATE
createRoot(document.getElementById('root')).render(
  <Provider store={Store}>
    <PersistGate loading={<div className="flex items-center justify-center min-h-screen"><div>Loading...</div></div>} persistor={persistor}>
      <RouterProvider router={AppRouter}/>
    </PersistGate>
  </Provider>
)
