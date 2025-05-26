import {useState, useEffect} from 'react'
import axios from 'axios'
import DistributorCard from '../../Components/AdminComponents/DistributorCard'

const AddDistributor = () => {
  const [distributors, setDistributors] = useState(null)
  const [isDeleted, setIsDeleted] = useState(false)
  const [isUpdated, setIsUpdated] = useState(false)

  const getDistributors = async () => {
    try {
      let response = await axios.get("http://localhost:8080/api/v1/admin/distributor/get", {withCredentials: true})
      setDistributors(response.data.data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    getDistributors()
  }, [isUpdated, isDeleted])
  

  useEffect(() => {
    getDistributors();
  }, []);

  return (
    <>
          <h1 className='text-xl text-center underline'>All Distributors</h1>
          {
            !distributors ? <div className='flex w-full h-4/5 items-center justify-center'><span className="loading loading-bars loading-lg"></span></div>
            :
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-y p-4 mt-2 w-4/5 mx-auto min-h-3/4'>
          {
            distributors && distributors.map((distributor) =>
              <DistributorCard key={distributor?._id} distributor={distributor} setIsDeleted={setIsDeleted} setIsUpdated={setIsUpdated} />
            )
          }
          </div>
          }
        </>
  )
}

export default AddDistributor
