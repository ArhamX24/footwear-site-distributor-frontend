import { useState } from 'react'
import './App.css'
import AdminPanel from './Screens/AdminPanel/AdminPanel'
import { Outlet } from 'react-router'
import Home from './Screens/User/Home'
import BootAuth from './Components/Auth/BootAuth'

function App() {

  return (
    <div className='min-h-screen min-w-full bg-gray-50'>
      <Home/>
    </div>
  )
}

export default App
