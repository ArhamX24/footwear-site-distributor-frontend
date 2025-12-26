// ✅ FIXED: Password visible + Items Produced removed
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { baseURL } from '../../Utils/URLS';
import { FaUsers, FaSpinner, FaUser, FaQrcode, FaEye, FaPhone, FaLock, FaDownload } from 'react-icons/fa';
import AddContractorDialog from '../../Components/AdminComponents/AddContractorDialog';

const ContractorCard = ({ contractor, setIsDeleted, setIsUpdated }) => {
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [contractorDetails, setContractorDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);

  const handleViewDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${baseURL}/api/v1/admin/users/details/${contractor._id}`,
        { withCredentials: true }
      );
      
      if (response.data.result) {
        setContractorDetails(response.data.data);
        setViewModalOpen(true);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to fetch details",
        background: "#1F2937",
        color: "#F9FAFB",
        confirmButtonColor: "#4B5563",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      setDownloadingReport(true);
      const response = await axios.get(
        `${baseURL}/api/v1/admin/download/${contractor._id}`,
        {
          withCredentials: true,
          responseType: 'blob'
        }
      );

      const now = new Date();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `QR-Report-${contractor.fullName.replace(/\s+/g, '_')}-${now.getFullYear()}-${month}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "Downloaded!",
        text: "Individual contractor report downloaded",
        background: "#1F2937",
        color: "#F9FAFB",
        confirmButtonColor: "#4B5563",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "No QR data found for this contractor",
        background: "#1F2937",
        color: "#F9FAFB",
        confirmButtonColor: "#4B5563",
      });
    } finally {
      setDownloadingReport(false);
    }
  };

  const handleDelete = async () => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#4B5563",
        cancelButtonColor: "#EF4444",
        confirmButtonText: "Yes, delete it!",
        background: "#1F2937",
        color: "#F9FAFB",
      });

      if (result.isConfirmed) {
        await axios.delete(`${baseURL}/api/v1/admin/users/${contractor._id}`, {
          withCredentials: true
        });
        
        Swal.fire({
          title: "Deleted!",
          text: "Contractor has been deleted.",
          icon: "success",
          background: "#1F2937",
          color: "#F9FAFB",
          confirmButtonColor: "#4B5563",
        });
        
        setIsDeleted(prev => !prev);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.response?.data?.message || "Failed to delete contractor",
        background: "#1F2937",
        color: "#F9FAFB",
        confirmButtonColor: "#4B5563",
      });
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300">
        <div className="flex items-center mb-4">
          <div className="bg-gray-600 p-3 rounded-full mr-4">
            <FaUser className="text-white text-xl" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 capitalize">{contractor.fullName}</h3>
            <p className="text-gray-600 text-sm">{contractor.phoneNo}</p>
          </div>
          <div className="flex items-center">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              contractor.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {contractor.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* ✅ REMOVED: Items Produced field from card */}
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Joined:</span>
            <span className="text-sm text-gray-600">
              {new Date(contractor.createdAt).toLocaleDateString('en-IN')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleViewDetails}
            disabled={loading}
            className="bg-gray-800 text-white px-2 py-2 rounded-lg hover:bg-gray-900 transition duration-200 text-xs font-medium flex items-center justify-center disabled:bg-gray-400"
          >
            <FaEye className="mr-1" />
            {loading ? "..." : "View"}
          </button>
          
          <button
            onClick={handleDownloadReport}
            disabled={downloadingReport}
            className="bg-green-600 text-white px-2 py-2 rounded-lg hover:bg-green-700 transition duration-200 text-xs font-medium flex items-center justify-center disabled:bg-green-400"
            title="Download this contractor's monthly QR report"
          >
            <FaDownload className="mr-1" />
            {downloadingReport ? "..." : "Report"}
          </button>
          
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-2 py-2 rounded-lg hover:bg-red-700 transition duration-200 text-xs font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {viewModalOpen && contractorDetails && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 text-white sticky top-0 z-10">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FaEye />
                Bar Code Generator Full Details
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 font-medium">Full Name</label>
                  <p className="text-gray-900 font-semibold mt-1 capitalize">{contractorDetails.fullName || "N/A"}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 font-medium">Phone Number</label>
                  <p className="text-gray-900 font-semibold mt-1">{contractorDetails.phoneNo || "N/A"}</p>
                </div>

                {/* ✅ PASSWORD VISIBLE BY DEFAULT (no special styling) */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="text-xs text-gray-500 font-medium flex items-center gap-1">
                    <FaLock className="text-xs" />
                    Password
                  </label>
                  <p className="text-gray-900 font-semibold mt-1 font-mono tracking-wider break-all">
                    {contractorDetails.password || "Not set"}
                  </p>
                </div>

                {/* ✅ REMOVED: Total Items Produced field */}
              </div>

              <button
                onClick={() => setViewModalOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ManageContractors = () => {
  const [contractors, setContractors] = useState(null);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloadingAllReports, setDownloadingAllReports] = useState(false);

  const getContractors = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseURL}/api/v1/admin/users/contractors`, {
        withCredentials: true,
      });
      if (response.data.result) {
        setContractors(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching contractors:', error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load contractors",
        background: "#1F2937",
        color: "#F9FAFB",
        confirmButtonColor: "#4B5563",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAllReports = async () => {
    try {
      setDownloadingAllReports(true);
      const response = await axios.get(
        `${baseURL}/api/v1/admin/download-all/excel`,
        {
          withCredentials: true,
          responseType: 'blob'
        }
      );

      const now = new Date();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `QR-Report-All-Contractors-${now.getFullYear()}-${month}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "Downloaded!",
        text: "All contractors' monthly reports downloaded",
        background: "#1F2937",
        color: "#F9FAFB",
        confirmButtonColor: "#4B5563",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "No QR data found for this month",
        background: "#1F2937",
        color: "#F9FAFB",
        confirmButtonColor: "#4B5563",
      });
    } finally {
      setDownloadingAllReports(false);
    }
  };

  useEffect(() => {
    getContractors();
  }, [isUpdated, isDeleted]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gray-600 p-3 rounded-full">
                <FaUsers className="text-2xl text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bar Code Generator
            </h1>
            <div className="w-24 h-1 bg-gray-600 mx-auto rounded-full"></div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <AddContractorDialog setIsUpdated={setIsUpdated} />
              
              {/* <button
                onClick={handleDownloadAllReports}
                disabled={downloadingAllReports}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition duration-200 font-medium disabled:bg-blue-400 flex-1 sm:flex-none"
                title="Download all contractors' QR reports for this month"
              >
                <FaDownload className="text-lg" />
                {downloadingAllReports ? "Downloading..." : "Download All Reports"}
              </button> */}
            </div>
            
            <div>
              {contractors && (
                <p className="text-gray-600 text-center sm:text-left">
                  Managing {contractors.length} Bar Code Generator{contractors.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-white rounded-full p-6 shadow-lg mb-4">
              <FaSpinner className="text-3xl text-gray-600 animate-spin" />
            </div>
            <p className="text-gray-600 font-medium">Loading Bar Code Generators...</p>
          </div>
        ) : (
          <>
            {!contractors || contractors.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gray-100 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                  <FaUsers className="text-4xl text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Bar Code Generator Found
                </h3>
                <p className="text-gray-600 mb-6">
                  There are no Bar Code Generator in your system yet.
                </p>
                <div className="inline-block">
                  <AddContractorDialog setIsUpdated={setIsUpdated} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {contractors.map((contractor) => (
                  <ContractorCard
                    key={contractor._id}
                    contractor={contractor}
                    setIsDeleted={setIsDeleted}
                    setIsUpdated={setIsUpdated}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ManageContractors;
