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

  // ✅ Updated form with article ID support
  const qrFormik = useFormik({
    initialValues: { 
      articleName: "",
      articleId: "", // ✅ Add articleId field
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
          articleId: values.articleId, // ✅ Include articleId
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

  // ✅ Handle article selection from dropdown
  const handleArticleSelection = (event, newValue) => {
    if (newValue && typeof newValue === 'object') {
      // Selected an existing article
      setSelectedArticle(newValue);
      qrFormik.setFieldValue('articleName', newValue.articleName);
      qrFormik.setFieldValue('articleId', newValue.articleId.toString());
      
      // ✅ Auto-populate colors and sizes from selected article
      if (newValue.colors && newValue.colors.length > 0) {
        qrFormik.setFieldValue('colors', newValue.colors.join(', '));
      }
      if (newValue.sizes && newValue.sizes.length > 0) {
        qrFormik.setFieldValue('sizes', newValue.sizes.join(', '));
      }
    } else if (typeof newValue === 'string') {
      // Custom input
      setSelectedArticle(null);
      qrFormik.setFieldValue('articleName', newValue);
      qrFormik.setFieldValue('articleId', ''); // Clear articleId for custom
      qrFormik.setFieldValue('colors', '');
      qrFormik.setFieldValue('sizes', '');
    }
  };

  // Rest of your handlers remain the same...
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

  // Other handlers remain the same (handlePrint, handleGenerateReceipt)...

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              QR Code Label Generator
            </h1>
            <p className="text-gray-600">
              Generate professional QR code labels for your cartons
            </p>
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
                    ? `${articles.length} existing articles available. Selecting an article will auto-populate colors and sizes.`
                    : "Enter a completely new article name that will be added to the system."
                  }
                  {selectedArticle && (
                    <div className="mt-1 text-blue-600">
                      Selected: {selectedArticle.articleName} (ID: {selectedArticle.articleId})
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Colors <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="colors"
                  placeholder="e.g., Red, Blue, Green"
                  onChange={qrFormik.handleChange}
                  value={qrFormik.values.colors}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {selectedArticle ? "Auto-populated from selected article" : "Separate multiple colors with commas"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Sizes <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="sizes"
                  placeholder="e.g., 3,5 (will show as 3X5)"
                  onChange={qrFormik.handleChange}
                  value={qrFormik.values.sizes}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {selectedArticle ? "Auto-populated from selected article" : "Enter first and last size (e.g., 3,5 displays as 3X5)"}
                </div>
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
                <div className="text-xs text-gray-500 mt-1">
                  Maximum 1000 cartons per generation
                </div>
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

        {/* Results Section - Keep your existing results section */}
        {generatedQRs.length > 0 && (
          // Your existing results JSX...
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Keep your existing results display code */}
          </div>
        )}
      </div>
    </div>
  );
};

export default QRGenerator;
