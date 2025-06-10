
import { useNavigate } from 'react-router'

const Unauthorized = () => {

    const navigate = useNavigate()

    let goBack = () => navigate(-1)

  return (
    <div className='w-screen h-screen flex items-center justify-center'>
        <div className='w-11/12'>
        <h1 className='md:text-5xl text-2xl'>You Are Not Authorized To Enter</h1>
        <button className='md:w-1/4 w-3/4 py-2 px-4 rounded-2xl bg-gray-300 mt-3' onClick={goBack}>Go Back</button>
        </div>
    </div>
  )
}

export default Unauthorized
