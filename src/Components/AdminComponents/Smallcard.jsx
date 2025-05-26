import React from 'react'

const Smallcard = ({name, quantity, icon}) => {
  return (
    <div className='md:w-72 w-40 mx-auto md:mx-0 md:ml-4 md:h-48 h-fit bg-gray-200 rounded-2xl mt-3 lg:mt-0'>
      <div className='w-11/12 md:px-2 px-1 py-2 md:py-4 mx-auto rounded-2xl flex justify-around md:block'>
            <div className='bg-gray-100 rounded-3xl p-3 block w-fit md:mb-8'>
              <span>
                {icon}
              </span>
            </div>
            <div className='ml-2'>
            <span className='text-sm block mb-1'>{name}</span>
            <span className='md:text-3xl text-xl'>{quantity || 0}</span>
            </div>
      </div>
    </div>
  )
}

export default Smallcard
