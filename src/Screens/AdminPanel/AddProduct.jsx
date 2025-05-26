import React,{useState, useEffect} from 'react'
import axios from 'axios'
import ProductCard from '../../Components/AdminComponents/ProductCard';
import { LinearProgress } from '@mui/material';

const AddProduct = () => {
  
const [products, setProducts] = useState(null);
const [isDeleted, setIsDeleted] = useState(false)
const [isUpdated, setisUpdated] = useState(false)


  const getProducts = async () => {
    try {
      let response = await axios.get(
        "http://localhost:8080/api/v1/admin/products/getproducts"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-y p-4 mt-2 w-4/5 mx-auto min-h-3/4">
        {products.map(product => (
          <ProductCard key={product._id} product={product} setProducts={setProducts} setIsDeleted={setIsDeleted} setisUpdated={setisUpdated} />
        ))}
      </div>
      </div>

    }
    </>
  )
}

export default AddProduct

