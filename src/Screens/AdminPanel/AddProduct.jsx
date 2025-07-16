import React,{useState, useEffect} from 'react'
import axios from 'axios'
import ProductCard from '../../Components/AdminComponents/ProductCard';
import { LinearProgress } from '@mui/material';
import { baseURL } from '../../Utils/URLS';

const AddProduct = () => {
  
const [products, setProducts] = useState(null);
const [isDeleted, setIsDeleted] = useState(false)
const [isUpdated, setisUpdated] = useState(false)


  const getProducts = async () => {
    try {
      let response = await axios.get(
        `${baseURL}/api/v1/admin/products/getproducts`
      );
      setProducts(response.data.data);
    } catch (error) {
      console.error(error.response?.data);
    }
  };

  useEffect(() => {
    getProducts();
  }, [isDeleted, isUpdated])
  

useEffect(() => {
    getProducts()
}, [])


  return (
    // Parent Component (e.g. ArticlesPage.jsx)

// Parent Component (e.g. ArticlesPage.jsx)

<>
  <h1 className="text-xl text-center underline">All Articles Listed</h1>

  {products == null 
    ? (
      <div className="flex w-full h-4/5 items-center justify-center">
        <span className="loading loading-bars loading-lg"></span>
      </div>
    )
    : (
      <div className="w-4/5 mx-auto mt-2 border-y">
        {/* Table Header */}
        <div className="grid grid-cols-4 px-2 py-4 bg-gray-50 border-b text-sm font-medium text-gray-700">
          <div>Segment</div>
          <div>Category</div>
          <div>Article</div>
          <div className="text-center">Actions</div>
        </div>

        {/* Table Body */}
        {products.map(product => (
          <ProductCard
            key={product._id}
            product={product}
            setProducts={setProducts}
            setIsDeleted={setIsDeleted}
            setisUpdated={setisUpdated}
          />
        ))}
      </div>
    )
  }
</>
  )
}

export default AddProduct

