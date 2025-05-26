import axios from "axios"
import { useEffect, useState } from "react";
import { setUserRole } from "../../Slice/AuthSlice";
import { Navigate } from "react-router";
import { useSelector } from "react-redux";


const AuthWrapper = ({children}) => {
  const [user, setUser] = useState(false)
  const [isLoading, setisLoading] = useState(false)

  const userLoggedIn = useSelector((Store)=> Store.auth.isLoggedIn);

  const getUser = async () => {
    try {
      setisLoading(true)
      let res = await axios.get("https://footwear-site-distributor-backend-3.onrender.com/api/v1/distributor/get", {withCredentials: true})

      if(res.data.result){
        setisLoading(false)
        setUser(true)
      }

    } catch (error) {
      console.error(error.response.data)
    } finally {
      setisLoading(false)
    }
  }

  useEffect(() => {
    getUser()
  }, [])
  

  if(isLoading){
    return <div>Loading...</div>
  }

  if(!userLoggedIn){
    return <Navigate to={"login"}/>
  }


  return children
}

export default AuthWrapper
