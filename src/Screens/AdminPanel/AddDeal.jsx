import {useState, useEffect} from 'react'
import axios from 'axios'
import DealsCard from '../../Components/AdminComponents/DealsCard'
import { baseURL } from '../../Utils/URLS'

const AddDeal = () => {
  const [deals, setDeals] = useState(null)
  const [isDeleted, setIsDeleted] = useState(false)
  const [isUpdated, setIsUpdated] = useState(false)

  const getDeals = async () => {
    try {
      let response = await axios.get(`http://${baseURL}/api/v1/admin/deal/get`, {withCredentials: true})
      setDeals(response.data.data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    getDeals()
  }, [isDeleted, isUpdated])
  

  useEffect(() => {
    getDeals()
  }, [])
  

  return (
    <>
    <h1 className='text-xl text-center underline'>All Deals & Offers</h1>
    {
      deals == null ? <div className='flex w-full h-4/5 items-center justify-center'><span className="loading loading-bars loading-lg"></span></div>
      :
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-y p-4 mt-2 w-4/5 mx-auto min-h-3/4'>
        {
          deals && deals.map((deal,idx)=>{
            return(
              <DealsCard key={idx} deal={deal} setIsDeleted={setIsDeleted} setIsUpdated={setIsUpdated}/>
            )
          })
        }
      </div>

    }
    </>
  )
}

export default AddDeal