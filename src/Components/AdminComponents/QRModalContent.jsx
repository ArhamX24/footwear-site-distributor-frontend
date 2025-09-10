import { useState, useCallback } from "react";
import { useFormik } from "formik";
import axios from "axios";
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";
import { baseURL } from "../../Utils/URLS";
import { useDispatch } from "react-redux";
import { setIsOpen } from "../../Slice/QrSlice";

const QRModalContent = ({ products, getProducts }) => {
  const [loading, setLoading] = useState(false);
  const [generatedQRs, setGeneratedQRs] = useState([]);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);

  const dispatch = useDispatch();

  // ✅ New form with 4 inputs
  const qrFormik = useFormik({
    initialValues: { 
      articleName: "",
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
        
        // ✅ New request format
        const requestData = {
          articleName: values.articleName.trim(),
          colors: values.colors.split(',').map(c => c.trim()).filter(c => c),
          sizes: values.sizes.split(',').map(s => s.trim()).filter(s => s),
          numberOfQRs: parseInt(values.numberOfQRs),
        };

        const response = await axios.post(
          `${baseURL}/api/v1/contractor/qr/generate`, // ✅ Updated endpoint
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
        
        action.resetForm();
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
  }, [generatedQRs, qrFormik.values]);

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
            .qr-info {
              font-size: 16px;
              color: #333;
              margin: 8px 0;
              font-weight: bold;
              text-align: left;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .qr-divider {
              height: 2px;
              background: #333;
              margin: 15px 0;
            }
            .qr-item img {
              width: 200px;
              height: 200px;
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
                <div class="qr-info">Article Name: ${qrFormik.values.articleName}</div>
                <div class="qr-info">Colors: ${qrFormik.values.colors}</div>
                <div class="qr-info">Sizes: ${qrFormik.values.sizes}</div>
                <div class="qr-info">Carton No: ${qr.cartonNumber || index + 1}</div>
                <div class="qr-divider"></div>
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
      Swal.fire("Error", "Failed to open print window", "error");
    } finally {
      setPrintLoading(false);
    }
  }, [generatedQRs, qrFormik.values]);

  return (
    <div className="w-full max-w-4xl mx-auto max-h-[95vh] overflow-hidden">
      <div className="bg-white p-6 rounded-lg shadow-lg overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Generate QR Code Labels</h2>
          <button
            onClick={() => dispatch(setIsOpen(false))}
            className="text-gray-500 hover:text-gray-700 text-xl px-3 py-1 rounded-full border hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* ✅ New 4-input form */}
          <form onSubmit={qrFormik.handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Article Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="articleName"
                  placeholder="e.g., Cotton T-Shirt"
                  onChange={qrFormik.handleChange}
                  value={qrFormik.values.articleName}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Colors <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="colors"
                  placeholder="e.g., Red, Blue, Green"
                  onChange={qrFormik.handleChange}
                  value={qrFormik.values.colors}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Separate multiple colors with commas
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Sizes <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="sizes"
                  placeholder="e.g., S, M, L, XL"
                  onChange={qrFormik.handleChange}
                  value={qrFormik.values.sizes}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Separate multiple sizes with commas
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Number of Cartons <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="numberOfQRs"
                  placeholder="e.g., 50"
                  onChange={qrFormik.handleChange}
                  value={qrFormik.values.numberOfQRs}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
                  min="1"
                  max="1000"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Maximum 1000 cartons per generation
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-blue-400 font-medium"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <CircularProgress size={20} color="inherit" className="mr-2" />
                  Generating QR Labels...
                </div>
              ) : (
                "Generate QR Code Labels"
              )}
            </button>
          </form>

          {/* ✅ Download & Print Section */}
          {generatedQRs.length > 0 && (
            <div className="border-t pt-6">
              <div className="text-center mb-4">
                <p className="text-lg font-semibold text-green-600">
                  ✅ {generatedQRs.length} QR Code Labels Generated!
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition duration-200 disabled:bg-green-400"
                  disabled={downloadLoading}
                >
                  {downloadLoading ? (
                    <>
                      <CircularProgress size={20} color="inherit" className="mr-2" />
                      Preparing ZIP...
                    </>
                  ) : (
                    <>
                      📦 Download as ZIP
                    </>
                  )}
                </button>

                <button
                  onClick={handlePrint}
                  className="flex items-center justify-center bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-blue-400"
                  disabled={printLoading}
                >
                  {printLoading ? (
                    <>
                      <CircularProgress size={20} color="inherit" className="mr-2" />
                      Opening Print...
                    </>
                  ) : (
                    <>
                      🖨️ Print Labels
                    </>
                  )}
                </button>
              </div>

              {/* ✅ Preview with new format */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-3">Label Preview (First 2)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedQRs.slice(0, 2).map((qr, index) => (
                    <div key={index} className="border-2 border-gray-300 rounded-lg p-3 bg-white">
                      <div className="text-xs space-y-1 mb-2">
                        <div><strong>Article Name:</strong> {qrFormik.values.articleName}</div>
                        <div><strong>Colors:</strong> {qrFormik.values.colors}</div>
                        <div><strong>Sizes:</strong> {qrFormik.values.sizes}</div>
                        <div><strong>Carton No:</strong> {qr.cartonNumber || index + 1}</div>
                      </div>
                      <hr className="my-2 border-gray-400" />
                      <img 
                        src={qr.qrCodeImage} 
                        alt={`QR ${index + 1}`} 
                        className="w-20 h-20 mx-auto border border-gray-200"
                      />
                    </div>
                  ))}
                </div>
                {generatedQRs.length > 2 && (
                  <p className="text-xs text-gray-500 text-center mt-3">
                    + {generatedQRs.length - 2} more labels
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRModalContent;
