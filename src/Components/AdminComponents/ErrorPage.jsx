import React, { useContext } from 'react'
import { Link } from 'react-router'

const ErrorPage = () => {

  return (
    <section className="bg-gray-200 h-screen flex items-center justify-center">
        <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
          <div className="mx-auto max-w-screen-sm text-center">
            <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary-600 dark:text-primary-500">
              404
            </h1>
            <p className="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl">
              Something's missing.
            </p>
            <p className="mb-4 text-lg font-light text-gray-800">
              Sorry, we can't find that page. You'll find lots to explore on the home page.
            </p>
            <Link
                href="/secure/admin/dashboard"
                className="inline-flex text-gray-900 bg-gray-200 hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-400 font-medium rounded-lg text-sm px-5 py-2.5 text-center my-4 shadow-md"
                >
                Back to Homepage
            </Link>
          </div>
        </div>
      </section>
  )
}

export default ErrorPage
