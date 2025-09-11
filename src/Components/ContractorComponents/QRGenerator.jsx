import React, { useState, useCallback, useEffect } from "react";
import { useFormik } from "formik";
import axios from "axios";
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import { baseURL } from "../../Utils/URLS";

const QRGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [generatedQRs, setGeneratedQRs] = useState([]);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  
  // ✅ Updated states for article management with IDs
  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [useCustomArticle, setUseCustomArticle] = useState(false);

  // ✅ Fetch articles with IDs on component mount
  useEffect(() => {
    fetchAllArticles();
  }, []);

  const fetchAllArticles = async () => {
    try {
      setArticlesLoading(true);
      const response = await axios.get(`${baseURL}/api/v1/admin/products/articles`, {
        withCredentials: true
      });
      
      if (response.data.result && response.data.data) {
        setArticles(response.data.data);
        console.log(`Found ${response.data.data.length} articles with IDs`);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticles([]);
    } finally {
      setArticlesLoading(false);
    }
  };

  // ✅ NEW: Handle space to comma conversion
  const handleSpaceToComma = (event, fieldName) => {
    if (event.key === ' ') {
      event.preventDefault();
      const currentValue = qrFormik.values[fieldName];
      const lastChar = currentValue.slice(-1);
      
      // Only add comma if the last character isn't already a comma or space
      if (currentValue.trim() && lastChar !== ',' && lastChar !== ' ') {
        qrFormik.setFieldValue(fieldName, currentValue + ', ');
      }
    }
  };

  // ✅ NEW: Handle input change for colors/sizes
  const handleInputChange = (event, fieldName) => {
    const value = event.target.value;
    qrFormik.setFieldValue(fieldName, value);
  };

  // ✅ NEW: Logout function
  const handleLogout = async () => {
    try {
      const result = await Swal.fire({
        title: 'Confirm Logout',
        text: 'Are you sure you want to log out?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Logout',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#d33',
      });

      if (result.isConfirmed) {
        await axios.post(`${baseURL}/api/v1/auth/logout`, {}, { withCredentials: true });
        Swal.fire({
          icon: 'success',
          title: 'Logged out successfully',
          timer: 1500,
          showConfirmButton: false
        });
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
    } catch (error) {
      console.error('Logout error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Logout failed',
        text: 'Please try again'
      });
    }
  };

  // ✅ Updated form with article ID support
  const qrFormik = useFormik({
    initialValues: { 
      articleName: "",
      articleId: "",
      colors: "",
      sizes: "", 
      numberOfQRs: ""
    },
    onSubmit: async (values, action) => {
      // Validation
      if (!values.articleName.trim()) {
        Swal.fire("Article name is required", "", "warning");
        return;
      }
      if (!values.colors.trim()) {
        Swal.fire("Colors are required", "", "warning");
        return;
      }
      if (!values.sizes.trim()) {
        Swal.fire("Sizes are required", "", "warning");
        return;
      }
      if (!values.numberOfQRs || values.numberOfQRs <= 0) {
        Swal.fire("Please enter a valid number of cartons", "", "warning");
        return;
      }
      
      try {
        setLoading(true);
        setGeneratedQRs([]);
        
        const requestData = {
          articleId: values.articleId,
          articleName: values.articleName.trim(),
          colors: values.colors.split(',').map(c => c.trim()).filter(c => c),
          sizes: values.sizes.split(',').map(s => s.trim()).filter(s => s),
          numberOfQRs: parseInt(values.numberOfQRs),
        };

        const response = await axios.post(
          `${baseURL}/api/v1/contractor/qr/generate`,
          requestData,
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.data.result) throw new Error(response.data.message);
        
        setGeneratedQRs(response.data.data.qrCodes);
        
        Swal.fire(
          "Success!",
          response.data.message,
          "success"
        );

      } catch (err) {
        console.log(err);
        Swal.fire(
          "Error", 
          err.response?.data?.message || "Failed to generate QR codes", 
          "error"
        );
      } finally {
        setLoading(false);
      }
    },
  });

  // ✅ UPDATED: Handle article selection from dropdown - No auto-filling
  const handleArticleSelection = (event, newValue) => {
    if (newValue && typeof newValue === 'object') {
      setSelectedArticle(newValue);
      qrFormik.setFieldValue('articleName', newValue.articleName);
      qrFormik.setFieldValue('articleId', newValue.articleId.toString());
    } else if (typeof newValue === 'string') {
      setSelectedArticle(null);
      qrFormik.setFieldValue('articleName', newValue);
      qrFormik.setFieldValue('articleId', '');
    }
  };

  // ✅ Download QR codes as ZIP
  const handleDownload = useCallback(async () => {
    if (generatedQRs.length === 0) {
      Swal.fire("No QR codes to download", "", "warning");
      return;
    }
    
    try {
      setDownloadLoading(true);
      
      const response = await axios.post(
        `${baseURL}/api/v1/contractor/qr/download`,
        { 
          qrCodes: generatedQRs,
          batchId: generatedQRs[0]?.batchId,
          articleInfo: {
            articleId: selectedArticle?.articleId,
            savedAsArticleName: qrFormik.values.articleName,
            contractorInput: qrFormik.values.articleName,
            colors: qrFormik.values.colors.split(','),
            sizes: qrFormik.values.sizes.split(','),
            numberOfQRs: generatedQRs.length
          }
        },
        {
          withCredentials: true,
          responseType: "blob",
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `QR_Codes_${qrFormik.values.articleName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.zip`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      Swal.fire("Success!", "QR codes downloaded successfully!", "success");
    } catch (err) {
      Swal.fire("Error", "Failed to download QR codes", "error");
    } finally {
      setDownloadLoading(false);
    }
  }, [generatedQRs, qrFormik.values, selectedArticle]);

  // ✅ Print QR codes
  const handlePrint = useCallback(() => {
    if (generatedQRs.length === 0) {
      Swal.fire("No QR codes to print", "", "warning");
      return;
    }

    try {
      setPrintLoading(true);
      
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        Swal.fire("Error", "Please allow popups to use the print feature", "error");
        return;
      }

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Codes - ${qrFormik.values.articleName}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
              .no-print { display: none !important; }
              .page-break { page-break-after: always; }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .qr-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 30px;
              margin-bottom: 30px;
            }
            .qr-item {
              border: 2px solid #333;
              border-radius: 12px;
              padding: 20px;
              text-align: center;
              background: white;
              page-break-inside: avoid;
            }
            .qr-item img {
              width: 200px;
              height: 240px;
              margin: 15px auto;
              display: block;
              border: 1px solid #ddd;
            }
            .print-buttons {
              text-align: center;
              margin: 20px 0;
            }
            .print-btn {
              background: #007bff;
              color: white;
              border: none;
              padding: 15px 30px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 16px;
              margin: 0 10px;
            }
            @page {
              margin: 0.5in;
              size: A4;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>QR Code Labels</h1>
            <p><strong>Article:</strong> ${qrFormik.values.articleName}</p>
            <p><strong>Total Cartons:</strong> ${generatedQRs.length}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="print-buttons no-print">
            <button class="print-btn" onclick="window.print()">🖨️ Print Labels</button>
            <button class="print-btn" style="background: #6c757d;" onclick="window.close()">❌ Close</button>
          </div>
          
          <div class="qr-grid">
            ${generatedQRs.map((qr, index) => `
              <div class="qr-item">
                <img src="${qr.qrCodeImage}" alt="QR Code ${index + 1}" />
              </div>
            `).join('')}
          </div>
          
          <script>
            window.focus();
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();

    } catch (err) {
      console.error('Print error:', err);
      Swal.fire("Error", "Failed to open print window", "error");
    } finally {
      setPrintLoading(false);
    }
  }, [generatedQRs, qrFormik.values]);

  // ✅ Generate receipt PDF
  const handleGenerateReceipt = useCallback(async () => {
    if (generatedQRs.length === 0) {
      Swal.fire("No QR codes to generate receipt for", "", "warning");
      return;
    }
    
    try {
      setReceiptLoading(true);
      
      const sizesArray = qrFormik.values.sizes.split(',').map(s => s.trim());
      const sizesFormatted = sizesArray.length > 1 
        ? [sizesArray[0], sizesArray[sizesArray.length - 1]]
        : sizesArray;
      
      const response = await axios.post(
        `${baseURL}/api/v1/contractor/qr/receipt`,
        {
          qrCodes: generatedQRs,
          articleInfo: {
            articleId: selectedArticle?.articleId,
            savedAsArticleName: qrFormik.values.articleName,
            contractorInput: qrFormik.values.articleName,
            colors: qrFormik.values.colors.split(',').map(c => c.trim()),
            sizes: sizesFormatted,
            numberOfQRs: generatedQRs.length
          }
        },
        {
          withCredentials: true,
          responseType: "blob",
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `QR_Receipt_${qrFormik.values.articleName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      Swal.fire("Success!", "QR receipt downloaded successfully!", "success");
    } catch (err) {
      Swal.fire("Error", "Failed to generate receipt", "error");
    } finally {
      setReceiptLoading(false);
    }
  }, [generatedQRs, qrFormik.values, selectedArticle]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                QR Code Label Generator
              </h1>
            </div>
            {/* ✅ NEW: Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 font-medium flex items-center"
            >
              <span className="mr-2">🚪</span>
              Logout
            </button>
          </div>

          {/* ✅ Updated form with article dropdown */}
          <form onSubmit={qrFormik.handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* ✅ Enhanced Article Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Article Name <span className="text-red-500">*</span>
                </label>
                
                {/* Toggle between dropdown and custom input */}
                <div className="mb-3">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="articleMode"
                        checked={!useCustomArticle}
                        onChange={() => setUseCustomArticle(false)}
                        className="mr-2"
                      />
                      Select from existing articles
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="articleMode"
                        checked={useCustomArticle}
                        onChange={() => setUseCustomArticle(true)}
                        className="mr-2"
                      />
                      Enter new article
                    </label>
                  </div>
                </div>

                {!useCustomArticle ? (
                  // ✅ Enhanced Autocomplete with article objects
                  <Autocomplete
                    freeSolo
                    options={articles}
                    getOptionLabel={(option) => {
                      if (typeof option === 'object' && option.articleName) {
                        return option.articleName;
                      }
                      return option;
                    }}
                    loading={articlesLoading}
                    value={selectedArticle}
                    onChange={handleArticleSelection}
                    onInputChange={(event, newInputValue) => {
                      if (!selectedArticle || selectedArticle.articleName !== newInputValue) {
                        handleArticleSelection(event, newInputValue);
                      }
                    }}
                    renderOption={(props, option) => (
                      <li {...props} key={option.articleId || option}>
                        <div className="flex flex-col w-full">
                          <div className="font-medium">
                            {typeof option === 'object' ? option.articleName : option}
                          </div>
                          {typeof option === 'object' && (
                            <div className="text-xs text-gray-500">
                              Segment: {option.segment} | Variant: {option.variantName}
                              {option.colors && option.colors.length > 0 && (
                                <span> | Colors: {option.colors.slice(0, 3).join(', ')}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search articles or type new name..."
                        variant="outlined"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {articlesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={typeof option === 'object' ? option.articleName : option}
                          {...getTagProps({ index })}
                        />
                      ))
                    }
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        padding: '8px 12px',
                      }
                    }}
                  />
                ) : (
                  // ✅ Custom input for new articles
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Enter new article name..."
                    value={qrFormik.values.articleName}
                    onChange={(e) => {
                      qrFormik.setFieldValue('articleName', e.target.value);
                      qrFormik.setFieldValue('articleId', ''); // Clear articleId for custom
                      setSelectedArticle(null);
                    }}
                    name="articleName"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        padding: '8px 12px',
                      }
                    }}
                  />
                )}
                
                <div className="text-xs text-gray-500 mt-2">
                  {!useCustomArticle 
                    ? `${articles.length} existing articles available. You'll need to manually enter colors and sizes.`
                    : "Enter a completely new article name that will be added to the system."
                  }
                </div>
              </div>

              {/* ✅ UPDATED: Colors input with space-to-comma */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Colors <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="colors"
                  placeholder="e.g., Red, Blue)"
                  onChange={(e) => handleInputChange(e, 'colors')}
                  onKeyDown={(e) => handleSpaceToComma(e, 'colors')}
                  value={qrFormik.values.colors}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* ✅ UPDATED: Sizes input with space-to-comma */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Sizes <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="sizes"
                  placeholder="e.g. 3, 4, 5"
                  onChange={(e) => handleInputChange(e, 'sizes')}
                  onKeyDown={(e) => handleSpaceToComma(e, 'sizes')}
                  value={qrFormik.values.sizes}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Number of Cartons <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="numberOfQRs"
                  placeholder="e.g., 50"
                  onChange={qrFormik.handleChange}
                  value={qrFormik.values.numberOfQRs}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="1000"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-blue-400 font-medium text-lg"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <CircularProgress size={20} color="inherit" className="mr-2" />
                    Generating QR Labels...
                  </div>
                ) : (
                  "🏷️ Generate QR Code Labels"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ✅ RESULTS SECTION */}
        {generatedQRs.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full">
                <span className="text-green-600 mr-2">✅</span>
                <span className="font-semibold">
                  {generatedQRs.length} QR Code Labels Generated!
                </span>
              </div>
            </div>
            
            {/* ✅ ACTION BUTTONS - Download, Print, Receipt */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition duration-200 disabled:bg-green-400 font-medium"
                disabled={downloadLoading}
              >
                {downloadLoading ? (
                  <>
                    <CircularProgress size={20} color="inherit" className="mr-2" />
                    Preparing ZIP...
                  </>
                ) : (
                  <>
                    <span className="mr-2">📦</span>
                    Download as ZIP
                  </>
                )}
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center justify-center bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-blue-400 font-medium"
                disabled={printLoading}
              >
                {printLoading ? (
                  <>
                    <CircularProgress size={20} color="inherit" className="mr-2" />
                    Opening Print...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🖨️</span>
                    Print Labels
                  </>
                )}
              </button>

              <button
                onClick={handleGenerateReceipt}
                className="flex items-center justify-center bg-purple-600 text-white px-6 py-4 rounded-lg hover:bg-purple-700 transition duration-200 disabled:bg-purple-400 font-medium"
                disabled={receiptLoading}
              >
                {receiptLoading ? (
                  <>
                    <CircularProgress size={20} color="inherit" className="mr-2" />
                    Generating Receipt...
                  </>
                ) : (
                  <>
                    <span className="mr-2">📄</span>
                    Generate Receipt
                  </>
                )}
              </button>
            </div>

            {/* ✅ PREVIEW SECTION */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📋 QR Code Preview (First 4)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {generatedQRs.slice(0, 4).map((qr, index) => (
                  <div key={index} className="border-2 border-gray-300 rounded-lg p-3 bg-white shadow-sm">
                    <img 
                      src={qr.qrCodeImage} 
                      alt={`QR ${index + 1}`} 
                      className="w-full h-40 mx-auto border border-gray-200 rounded object-contain"
                    />
                    <div className="text-center text-sm text-gray-600 mt-2">
                      Carton #{qr.cartonNumber || index + 1}
                    </div>
                  </div>
                ))}
              </div>
              {generatedQRs.length > 4 && (
                <div className="text-center mt-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    + {generatedQRs.length - 4} more labels available for download/print
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRGenerator;
