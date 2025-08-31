import { useState, useCallback, useMemo } from "react";
import { useFormik } from "formik";
import axios from "axios";
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";
import { baseURL } from "../../Utils/URLS";
import { useDispatch } from "react-redux";
import { setIsOpen } from "../../Slice/QrSlice";
import AddDialog from "./AddDialog"; // Import directly

const QRModalContent = ({ products, getProducts }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [articleSearch, setArticleSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatedQRs, setGeneratedQRs] = useState([]);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);

  const dispatch = useDispatch();

  const flattenedArticles = useMemo(
    () => (Array.isArray(products) ? products : []),
    [products]
  );

  const filteredArticles = useMemo(() => {
    const term = articleSearch.trim().toLowerCase();
    if (!term) return flattenedArticles;
    return flattenedArticles.filter((a) =>
      (a.name || a.articleName || "").toLowerCase().includes(term) ||
      (a.segment || "").toLowerCase().includes(term)
    );
  }, [articleSearch, flattenedArticles]);

  const handleSelectArticle = useCallback((article) => {
    setSelectedArticle(article);
    setDropdownOpen(false);
    setArticleSearch("");
  }, []);

  // QR Generation form
  const qrFormik = useFormik({
    initialValues: { numberOfQRs: "" },
    onSubmit: async (values, action) => {
      if (!selectedArticle) {
        Swal.fire("Select an article first", "", "warning");
        return;
      }
      if (!values.numberOfQRs || values.numberOfQRs <= 0) {
        Swal.fire("Please enter a valid number of QR codes", "", "warning");
        return;
      }
      
      try {
        setLoading(true);
        setGeneratedQRs([]);
        
        const requestData = {
          productId: selectedArticle._id,
          articleName: selectedArticle.articleName || selectedArticle.name,
          segment: selectedArticle.segment,
          numberOfQRs: parseInt(values.numberOfQRs),
        };

        const response = await axios.post(
          `${baseURL}/api/v1/admin/qr/generate`,
          requestData,
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.data.result) throw new Error(response.data.message);
        
        setGeneratedQRs(response.data.qrCodes);
        Swal.fire(
          "Success!",
          `Generated ${values.numberOfQRs} QR codes successfully!`,
          "success"
        );
        action.resetForm();
      } catch (err) {
        console.log(err);
        Swal.fire("Error", err.response?.data?.message || "Something went wrong", "error");
      } finally {
        setLoading(false);
      }
    },
  });

  const handleDownload = useCallback(async () => {
    if (generatedQRs.length === 0) {
      Swal.fire("No QR codes to download", "", "warning");
      return;
    }
    try {
      setDownloadLoading(true);
      const response = await axios.post(
        `${baseURL}/api/v1/admin/qr/download`,
        { qrCodes: generatedQRs },
        {
          withCredentials: true,
          responseType: "blob",
          headers: { "Content-Type": "application/json" },
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `QR_Codes_${selectedArticle?.articleName || selectedArticle?.name || "products"}_${Date.now()}.zip`
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
  }, [generatedQRs, selectedArticle]);

  const handlePrint = useCallback(async () => {
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
          <title>QR Codes - ${selectedArticle?.articleName || selectedArticle?.name || 'Products'}</title>
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
            .header h1 {
              margin: 0;
              color: #333;
              font-size: 24px;
            }
            .header p {
              margin: 10px 0 0 0;
              color: #666;
              font-size: 14px;
            }
            .qr-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin-bottom: 30px;
            }
            .qr-item {
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
              background: white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .qr-item img {
              width: 150px;
              height: 150px;
              margin: 0 auto 10px;
              display: block;
            }
            .qr-info {
              font-size: 12px;
              color: #666;
              margin: 5px 0;
              text-transform: capitalize;
            }
            .qr-title {
              font-weight: bold;
              color: #333;
              margin: 10px 0 5px 0;
              font-size: 14px;
            }
            .print-buttons {
              text-align: center;
              margin: 20px 0;
              padding: 20px;
              border-top: 1px solid #ddd;
            }
            .print-btn {
              background: #007bff;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
              margin: 0 10px;
            }
            .print-btn:hover {
              background: #0056b3;
            }
            .close-btn {
              background: #6c757d;
            }
            .close-btn:hover {
              background: #5a6268;
            }
            @page {
              margin: 1in;
              size: A4;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>QR Codes</h1>
            <p><strong>Article:</strong> ${selectedArticle?.segment || 'N/A'} - ${selectedArticle?.articleName || selectedArticle?.name || 'N/A'}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p><strong>Total Codes:</strong> ${generatedQRs.length}</p>
          </div>
          
          <div class="print-buttons no-print">
            <button class="print-btn" onclick="window.print()">🖨️ Print QR Codes</button>
            <button class="print-btn close-btn" onclick="window.close()">❌ Close</button>
          </div>
          
          <div class="qr-grid">
            ${generatedQRs.map((qr, index) => `
              <div class="qr-item">
                <img src="${qr.dataURL}" alt="QR Code ${index + 1}" />
                <div class="qr-info">Code: ${qr.qrData.index}/${qr.qrData.totalCount}</div>
                <div class="qr-info">Segment: ${qr.qrData.segment || 'N/A'}</div>
              </div>
            `).join('')}
          </div>
          
          <div class="print-buttons no-print">
            <button class="print-btn" onclick="window.print()">🖨️ Print QR Codes</button>
            <button class="print-btn close-btn" onclick="window.close()">❌ Close</button>
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
  }, [generatedQRs, selectedArticle]);

  return (
    <div className="w-full max-w-7xl mx-auto max-h-[95vh] overflow-hidden">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
        
        {/* Main QR Generation Section - Left Side */}
        <div className="bg-white p-6 rounded-lg shadow-lg overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Generate QR Codes</h2>
            <button
              onClick={() => dispatch(setIsOpen(false))}
              className="text-gray-500 hover:text-gray-700 font-bold px-2 py cursor-pointer rounded-full border"
            >
            x
            </button>
          </div>

          <div className="space-y-4">
            {/* Article Selection Section */}
            <div className="relative w-full">
              <div>
              <p className="text-center mb-1">If Article Is Not Present</p>
               <div className="px-6 pb-6">
                <AddDialog getProducts={getProducts} />
              </div>

              <label className="block text-sm font-medium mb-2">Select Article</label>
              </div>
              
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 flex items-center justify-between hover:border-gray-400 transition-colors"
              >
                {selectedArticle
                  ? `${selectedArticle.segment} - ${selectedArticle.articleName || selectedArticle.name}`
                  : "Choose an article"}
                <span className={`ml-2 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute mt-2 w-full bg-white shadow-lg rounded-md border border-gray-200 z-10">
                  <div className="p-2 border-b">
                    <input
                      type="text"
                      placeholder="Search article or segment..."
                      className="w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:border-gray-500"
                      value={articleSearch}
                      onChange={(e) => setArticleSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredArticles.length > 0 ? (
                      filteredArticles.map((article, idx) => (
                        <div
                          key={`${article._id}-${idx}`}
                          onClick={() => handleSelectArticle(article)}
                          className="flex items-center p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          {/* Article Image */}
                          <div className="flex-shrink-0 mr-3">
                            {article.images && article.images.length > 0 ? (
                              <img
                                src={article.images[0]}
                                alt={article.articleName || article.name}
                                className="w-10 h-10 object-cover rounded-md"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                    
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 capitalize truncate">
                              {article.segment} - {article.articleName || article.name}
                            </div>
                            <div className="text-sm text-gray-500 capitalize truncate">
                              {article.variant}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No articles found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* QR Generation Form */}
            <form onSubmit={qrFormik.handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Number of Cartons
                </label>
                <input
                  type="number"
                  name="numberOfQRs"
                  placeholder="e.g., 50"
                  onChange={qrFormik.handleChange}
                  value={qrFormik.values.numberOfQRs}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-gray-500"
                  min="1"
                  max="1000"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Maximum 1000 QR codes per generation
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-xl hover:bg-gray-600 transition duration-200 disabled:bg-gray-400"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <CircularProgress size={20} color="inherit" className="mr-2" />
                    Generating QR Codes...
                  </div>
                ) : (
                  "Generate QR Codes"
                )}
              </button>
            </form>

            {/* QR Codes Download & Print Section */}
            {generatedQRs.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <p className="text-sm text-center text-black mb-4">
                  <strong>{generatedQRs.length} QR Codes Generated Successfully!</strong>
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Download Button */}
                  <button
                    onClick={handleDownload}
                    className="flex items-center justify-center bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-700 transition duration-200 disabled:bg-green-400"
                    disabled={downloadLoading}
                  >
                    {downloadLoading ? (
                      <>
                        <CircularProgress size={20} color="inherit" className="mr-2" />
                        Preparing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download as ZIP
                      </>
                    )}
                  </button>

                  {/* Print Button */}
                  <button
                    onClick={handlePrint}
                    className="flex items-center justify-center bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition duration-200 disabled:bg-blue-400"
                    disabled={printLoading}
                  >
                    {printLoading ? (
                      <>
                        <CircularProgress size={20} color="inherit" className="mr-2" />
                        Opening...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print QR Codes
                      </>
                    )}
                  </button>
                </div>

                {/* Preview Section */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview (First 4 QR Codes)</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {generatedQRs.slice(0, 4).map((qr, index) => (
                      <div key={index} className="text-center">
                        <img 
                          src={qr.dataURL} 
                          alt={`QR ${index + 1}`} 
                          className="w-16 h-16 mx-auto border border-gray-200 rounded"
                        />
                        <p className="text-xs text-gray-500 mt-1">QR {index + 1}</p>
                      </div>
                    ))}
                  </div>
                  {generatedQRs.length > 4 && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      + {generatedQRs.length - 4} more QR codes
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>


      </div>
    </div>
  );
};

export default QRModalContent;
