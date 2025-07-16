import logo from "../../../public/logo.png"
import { Link, Outlet } from "react-router";
import { toogleMenu , setSearchQuery} from "../../Slice/NavSlice";
import { useDispatch, useSelector } from "react-redux";

const Home = () => {
  // States for products, filters, modal, etc.
  
  const sideMenuOpen = useSelector((Store)=> Store.nav.isOpen)
  const searchQuery = useSelector((Store)=> Store.nav.searchQuery)
  const cartVal = useSelector((Store)=> Store.cart?.totalItems)

  const dispatch = useDispatch();

  return (
    <div className="min-h-screen w-full bg-gray-100 text-gray-800">
      {/* Navbar */}
      <div className="flex justify-between items-center lg:px-6 md:px-4 px-2 py-4 bg-gray-200 text-black shadow-md">
        <div className="flex items-center">
          
          <Link to={"dashboard"}><img src={logo} className=" w-20 md:w-24"></img></Link>
        </div>
        <div className="flex items-center justify-end gap-x-2">
      <div className="flex items-center border rounded-md w-4/5">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => {
            dispatch(setSearchQuery(e.target.value));
          }}
          className="p-2 w-full md:w-64 lg:w-96 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-700"
          />
      </div>

        <Link to={"cart"}>
        <div>
          <span className="cursor-pointer flex">
            {cartVal ? <sup className="">{cartVal}</sup> : ""}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M4.00436 6.41686L0.761719 3.17422L2.17593 1.76001L5.41857 5.00265H20.6603C21.2126 5.00265 21.6603 5.45037 21.6603 6.00265C21.6603 6.09997 21.6461 6.19678 21.6182 6.29L19.2182 14.29C19.0913 14.713 18.7019 15.0027 18.2603 15.0027H6.00436V17.0027H17.0044V19.0027H5.00436C4.45207 19.0027 4.00436 18.5549 4.00436 18.0027V6.41686ZM6.00436 7.00265V13.0027H17.5163L19.3163 7.00265H6.00436ZM5.50436 23.0027C4.67593 23.0027 4.00436 22.3311 4.00436 21.5027C4.00436 20.6742 4.67593 20.0027 5.50436 20.0027C6.33279 20.0027 7.00436 20.6742 7.00436 21.5027C7.00436 22.3311 6.33279 23.0027 5.50436 23.0027ZM17.5044 23.0027C16.6759 23.0027 16.0044 22.3311 16.0044 21.5027C16.0044 20.6742 16.6759 20.0027 17.5044 20.0027C18.3328 20.0027 19.0044 20.6742 19.0044 21.5027C19.0044 22.3311 18.3328 23.0027 17.5044 23.0027Z"></path></svg>
            </span>
        </div>
       </Link>
        </div>
          </div>

      {/* Main Layout */}
      <div className="w-full">
        <Outlet/>
      </div>
    </div>
  );
};

export default Home;