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
        `https://${baseURL}/api/v1/admin/products/getproducts`
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
    <>
      <h1 className='text-xl text-center underline'>All Products Listed</h1>
    {
      products == null ? <div className='flex w-full h-4/5 items-center justify-center'><span className="loading loading-bars loading-lg"></span></div>
      :
      <div>
      <div className="grid grid-cols-3 px-2 py-4 bg-gray-50 border-b text-sm font-medium text-gray-700">
        <div>Article</div>
        <div>Price</div>
      </div>
        {products.map(product => (
          <ProductCard key={product._id} product={product} setProducts={setProducts} setIsDeleted={setIsDeleted} setisUpdated={setisUpdated} />
        ))}
      </div>
    }
    </>
  )
}

export default AddProduct

