import React, { useEffect, useState } from 'react'
import ProfileUpdate from '../../Components/AdminComponents/ProfileUpdate'

const AdminProfile = () => {
    const [adminData, setAdminData] = useState(null)
    const [profileModalOpen, setProfileModalOpen] = useState(false)

    const getAdminData = async () => {
      try {
        
      } catch (error) {
        
      }
    }

    useEffect(() => {
      getAdminData()
    }, [])
    

  return (
    <>
    {
      profileModalOpen ? <ProfileUpdate setProfileModalOpen={setProfileModalOpen}/> : 
      <>
    <div className="bg-white w-4/5 mx-auto overflow-hidden shadow rounded-lg border">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">User Profile</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">This is some information about the user.</p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          {[
            { label: "Full name", value: "John Doe" },
            { label: "Email address", value: "johndoe@example.com" },
            { label: "Phone number", value: "(123) 456-7890" },
            { label: "Address", value: "123 Main St, Anytown, USA 12345" },
          ].map((item, index) => (
            <div key={index} className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
    <div className='w-4/5 flex items-end justify-end mt-5 mx-auto'>
        <button className="px-4 py-2 mx-auto w-1/6 bg-gray-700 text-white rounded-lg hover:bg-gray-800 cursor-pointer" onClick={()=>{setProfileModalOpen(true)}}>Edit Profile</button>
    </div>
    </>
        }
    </>
  )
}

export default AdminProfile;