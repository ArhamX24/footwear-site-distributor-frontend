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

  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [batchId, setBatchId] = useState(null);

  useEffect(() => { fetchAllArticles(); }, []);

  const fetchAllArticles = async () => {
    try {
      setArticlesLoading(true);
      const response = await axios.get(`${baseURL}/api/v1/admin/products/articles`, {
        withCredentials: true
      });
      if (response.data.result && response.data.data) {
        setArticles(response.data.data);
      }
    } catch (error) {
      setArticles([]);
    } finally {
      setArticlesLoading(false);
    }
  };

  const handleSpaceToComma = (event, fieldName) => {
    if (event.key === ' ') {
      event.preventDefault();
      const currentValue = qrFormik.values[fieldName];
      if (currentValue.trim() && !currentValue.endsWith(',') && !currentValue.endsWith(' ')) {
        qrFormik.setFieldValue(fieldName, currentValue + ', ');
      }
    }
  };

  const handleInputChange = (event, fieldName) => {
    const value = event.target.value;
    if (fieldName === 'colors') {
      qrFormik.setFieldValue(fieldName, value.replace(/[^a-zA-Z,\s]/g, ''));
    } else if (fieldName === 'sizes') {
      qrFormik.setFieldValue(fieldName, value.replace(/[^0-9,\s]/g, ''));
    } else {
      qrFormik.setFieldValue(fieldName, value);
    }
  };

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
        Swal.fire({ icon: 'success', title: 'Logged out successfully', timer: 1500, showConfirmButton: false });
        setTimeout(() => { window.location.href = '/login'; }, 1500);
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Logout failed', text: 'Please try again' });
    }
  };

  const qrFormik = useFormik({
    initialValues: {
      articleName: "",
      articleId: "",
      colors: "",
      sizes: "",
      numberOfQRs: "",
      // Production details
      bharra: "",          // select: fauji | plain
      printing: "",        // free text
      packing: "",         // free text
      cartonPair: "",      // free text ✅ NEW
      colorPrinting: "",   // select: 1-5  ✅ NEW
      imbozing: "",        // free text    ✅ NEW
    },
    onSubmit: async (values, action) => {
      if (!values.articleName.trim()) { Swal.fire("Article name is required", "", "warning"); return; }
      if (!values.colors.trim()) { Swal.fire("Colors are required", "", "warning"); return; }
      if (!values.sizes.trim()) { Swal.fire("Sizes are required", "", "warning"); return; }
      if (!values.numberOfQRs || values.numberOfQRs <= 0) { Swal.fire("Please enter a valid number of cartons", "", "warning"); return; }

      try {
        setLoading(true);
        setGeneratedQRs([]);
        setBatchId(null);

        const requestData = {
          articleId: values.articleId,
          articleName: values.articleName.trim(),
          colors: values.colors.split(',').map(c => c.trim()).filter(Boolean),
          sizes: values.sizes.split(',').map(s => s.trim()).filter(Boolean),
          numberOfQRs: parseInt(values.numberOfQRs),
          bharra: values.bharra || null,
          printing: values.printing.trim() || null,
          packing: values.packing.trim() || null,
          cartonPair: values.cartonPair.trim() || null,      // ✅ NEW
          colorPrinting: values.colorPrinting || null,        // ✅ NEW
          imbozing: values.imbozing.trim() || null,           // ✅ NEW
        };

        const response = await axios.post(
          `${baseURL}/api/v1/contractor/qr/generate`,
          requestData,
          { withCredentials: true, headers: { "Content-Type": "application/json" } }
        );

        if (!response.data.result) throw new Error(response.data.message);
        setGeneratedQRs(response.data.data.qrCodes);
        Swal.fire("Success!", response.data.message, "success");

        const data = response.data.data;

        console.log(data);
        
        setGeneratedQRs(data.qrCodes);
        setBatchId(data.batchId || data.qrCodes[0]?.batchId);

      } catch (err) {
        Swal.fire("Error", err.response?.data?.message || "Failed to generate QR codes", "error");
      } finally {
        setLoading(false);
      }
    },
  });

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

  // ✅ Download ZIP — no limit, all QR codes
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
        batchId: batchId || generatedQRs[0]?.batchId, 
        articleName: qrFormik.values.articleName,
      },
      { withCredentials: true, responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `QR_Codes_${qrFormik.values.articleName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      Swal.fire("Success!", "QR codes downloaded successfully!", "success");
    } catch (err) {
      console.error("Download error:", err.response);
      Swal.fire("Error", "Failed to download QR codes", "error");
    } finally {
      setDownloadLoading(false);
    }
  }, [generatedQRs, qrFormik.values, selectedArticle]);

  // ✅ Print — 48.7mm x 35mm, zero margins
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
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: 48.7mm 35mm; margin: 0; }
            html, body { width: 48.7mm; height: 35mm; margin: 0; padding: 0; background: white; }
            .qr-label {
              width: 48.7mm;
              height: 35mm;
              display: flex;
              align-items: center;
              justify-content: center;
              page-break-after: always;
              overflow: hidden;
            }
            .qr-label:last-child { page-break-after: avoid; }
            .qr-label img { width: 48.7mm; height: 35mm; object-fit: contain; display: block; }
            .no-print { display: flex; gap: 8px; position: fixed; top: 10px; right: 10px; z-index: 9999; }
            @media print { .no-print { display: none !important; } }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button onclick="window.print()" style="background:#2563eb;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-size:14px;">🖨️ Print</button>
            <button onclick="window.close()" style="background:#6b7280;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-size:14px;">✕ Close</button>
          </div>
          ${generatedQRs.map((qr) => `
            <div class="qr-label">
              <img src="${qr.qrCodeImage}" alt="QR Code" />
            </div>
          `).join('')}
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">🏷️ QR Label Generator</h1>
              <p className="text-sm text-gray-500 mt-1">Generate carton QR labels for production tracking</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center gap-2 text-sm"
            >
              🚪 Logout
            </button>
          </div>

          <form onSubmit={qrFormik.handleSubmit} className="space-y-5">

            {/* Article Autocomplete */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Article Name <span className="text-red-500">*</span>
              </label>
              <Autocomplete
                freeSolo
                options={articles}
                getOptionLabel={(option) => typeof option === 'object' && option.articleName ? option.articleName : option}
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
                    <div className="flex flex-col w-full py-1">
                      <div className="font-medium">{typeof option === 'object' ? option.articleName : option}</div>
                      {typeof option === 'object' && (
                        <div className="text-xs text-gray-500">
                          Segment: {option.segment} | Category: {option.variantName}
                          {option.colors?.length > 0 && <span> | Colors: {option.colors.slice(0, 3).join(', ')}</span>}
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
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {articlesLoading ? <CircularProgress color="inherit" size={18} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                sx={{ '& .MuiOutlinedInput-root': { padding: '4px 8px' } }}
              />
              <p className="text-xs text-gray-400 mt-1">{articles.length} articles available. Type to search or enter new name.</p>
            </div>

            {/* Colors + Sizes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Colors <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="colors"
                  placeholder="e.g., Red Blue Green"
                  onChange={(e) => handleInputChange(e, 'colors')}
                  onKeyDown={(e) => handleSpaceToComma(e, 'colors')}
                  value={qrFormik.values.colors}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Space → auto adds ", " between colors</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Sizes <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="sizes"
                  placeholder="e.g., 38 39 40"
                  onChange={(e) => handleInputChange(e, 'sizes')}
                  onKeyDown={(e) => handleSpaceToComma(e, 'sizes')}
                  value={qrFormik.values.sizes}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Space → auto adds ", " between sizes</p>
              </div>
            </div>

            {/* Number of Cartons */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Number of Cartons <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="numberOfQRs"
                placeholder="e.g., 50"
                onChange={qrFormik.handleChange}
                value={qrFormik.values.numberOfQRs}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                min="1"
              />
            </div>

            {/* Production Details */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-4">🏭 Production Details <span className="font-normal text-gray-400">(Optional)</span></h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

                {/* Bharra — select */}
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-600">Bharra</label>
                  <select
                    name="bharra"
                    onChange={qrFormik.handleChange}
                    value={qrFormik.values.bharra}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    <option value="">Select Bharra</option>
                    <option value="fauji">Fauji</option>
                    <option value="plain">Plain</option>
                  </select>
                </div>

                {/* Color Printing — select 1-5 */}
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-600">Color Printing</label>
                  <select
                    name="colorPrinting"
                    onChange={qrFormik.handleChange}
                    value={qrFormik.values.colorPrinting}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    <option value="">Select Color Printing</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>

                {/* Printing — free text */}
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-600">Printing</label>
                  <input
                    type="text"
                    name="printing"
                    placeholder="e.g., Print-A123"
                    onChange={qrFormik.handleChange}
                    value={qrFormik.values.printing}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Packing — free text */}
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-600">Packing</label>
                  <input
                    type="text"
                    name="packing"
                    onChange={qrFormik.handleChange}
                    value={qrFormik.values.packing}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Carton Pair — free text ✅ NEW */}
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-600">Carton Pair</label>
                  <input
                    type="text"
                    name="cartonPair"
                    onChange={qrFormik.handleChange}
                    value={qrFormik.values.cartonPair}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Imbozing — free text ✅ NEW */}
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-600">Imbozing</label>
                  <input
                    type="text"
                    name="imbozing"
                    onChange={qrFormik.handleChange}
                    value={qrFormik.values.imbozing}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition disabled:bg-blue-400 font-semibold text-base"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <CircularProgress size={20} color="inherit" />
                  Generating QR Labels...
                </div>
              ) : "🏷️ Generate QR Code Labels"}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {generatedQRs.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">

            {/* Success Badge */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center bg-green-100 text-green-800 px-5 py-2 rounded-full font-semibold">
                ✅ {generatedQRs.length} QR Code Labels Generated!
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

              {/* Download ZIP */}
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-4 rounded-xl hover:bg-green-700 transition disabled:bg-green-400 font-semibold"
                disabled={downloadLoading}
              >
                {downloadLoading ? (
                  <><CircularProgress size={20} color="inherit" /> Downloading...</>
                ) : (
                  <><span>📦</span> Download ZIP ({generatedQRs.length} QRs)</>
                )}
              </button>

              {/* Print */}
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-xl hover:bg-blue-700 transition disabled:bg-blue-400 font-semibold"
                disabled={printLoading}
              >
                {printLoading ? (
                  <><CircularProgress size={20} color="inherit" /> Opening Print...</>
                ) : (
                  <><span>🖨️</span> Print QR Labels</>
                )}
              </button>
            </div>

            {/* Preview First 4 */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h3 className="text-base font-semibold text-gray-800 mb-4">📋 Preview (First 4 of {generatedQRs.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {generatedQRs.slice(0, 4).map((qr, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-lg p-2 bg-white shadow-sm text-center">
                    <img
                      src={qr.qrCodeImage}
                      alt={`QR ${index + 1}`}
                      className="w-full h-36 object-contain rounded"
                    />
                    <p className="text-xs text-gray-500 mt-2 font-medium">Carton #{qr.cartonNumber || index + 1}</p>
                  </div>
                ))}
              </div>
              {generatedQRs.length > 4 && (
                <div className="text-center mt-4">
                  <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium">
                    + {generatedQRs.length - 4} more in ZIP download
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