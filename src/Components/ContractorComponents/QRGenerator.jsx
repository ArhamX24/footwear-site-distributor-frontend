import React, { useState, useCallback, useEffect } from "react";
import { useFormik } from "formik";
import axios from "axios";
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { baseURL } from "../../Utils/URLS";

// ─── Print HTML builder ────────────────────────────────────────────────────
const buildPrintHTML = (qrCodes, articleName) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>QR Labels – ${articleName}</title>
  <style>
    /* ── Reset ── */
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    /* ── Screen UI ── */
    body {
      background: #e5e7eb;
      padding: 16px;
      font-family: sans-serif;
    }

    .qr-label {
      width: 100mm;
      height: 50mm;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      margin: 0 auto 16px auto; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .qr-label img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    /* ── Print Configuration (Crucial for fixing blank sheets) ── */
    @page {
      size: 100mm 50mm;
      margin: 0; /* STRIPS BROWSER MARGINS */
    }

    @media print {
      /* Hide screen controls */
      .controls { display: none !important; }

      body, html {
        background: white !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100mm !important;
      }

      /* Each label exactly fits one physical page */
      .qr-label {
        width: 100mm !important;
        height: 50mm !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        page-break-after: always;
        break-after: page;
      }

      /* Prevents an empty blank page at the very end of printing */
      .qr-label:last-child {
        page-break-after: auto;
        break-after: auto;
      }
    }

    /* ── Screen controls bar ── */
    .controls {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #1f2937;
      color: white;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin: -16px -16px 16px -16px;
      font-size: 14px;
    }
    .controls span { flex: 1; font-weight: 600; }
    .controls button {
      border: none; padding: 8px 18px; border-radius: 6px;
      cursor: pointer; font-size: 13px; font-weight: 600;
    }
    .btn-print { background: #2563eb; color: white; }
    .btn-print:hover { background: #1d4ed8; }
    .btn-close { background: #6b7280; color: white; }
    .btn-close:hover { background: #4b5563; }
  </style>
</head>
<body>

  <div class="controls">
    <span>🏷️ ${articleName} — ${qrCodes.length} label${qrCodes.length !== 1 ? 's' : ''}</span>
    <button class="btn-print" onclick="window.print()">🖨️ Print</button>
    <button class="btn-close" onclick="window.close()">✕ Close</button>
  </div>

  ${qrCodes.map((qr, i) => `
    <div class="qr-label">
      <img
        src="${qr.qrCodeImage}"
        alt="QR Carton ${qr.cartonNumber || i + 1}"
      />
    </div>
  `).join('\n')}

</body>
</html>
`;

// ─── Color dot palette ─────────────────────────────────────────────────────
const COLOR_HEX = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308',
  black: '#111827', white: '#f9fafb', pink: '#ec4899', orange: '#f97316',
  purple: '#a855f7', brown: '#92400e', grey: '#9ca3af', gray: '#9ca3af',
  navy: '#1e3a5f', maroon: '#7f1d1d', cream: '#fef9c3', beige: '#d6c5a0',
  silver: '#c0c0c0', gold: '#d97706', cyan: '#06b6d4', lime: '#84cc16',
};
const colorDot = (name) =>
  COLOR_HEX[name.toLowerCase()] ||
  COLOR_HEX[name.toLowerCase().replace(/\s+/g, '')] ||
  '#94a3b8';

// ═══════════════════════════════════════════════════════════════════════════
const QRGenerator = () => {
  const [loading,         setLoading]         = useState(false);
  const [generatedQRs,    setGeneratedQRs]    = useState([]);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [printLoading,    setPrintLoading]    = useState(false);
  const [articles,        setArticles]        = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [batchId,         setBatchId]         = useState(null);
  const [dbColors,        setDbColors]        = useState([]);
  const [selectedColors,  setSelectedColors]  = useState([]);

  useEffect(() => { fetchAllArticles(); }, []);

  const fetchAllArticles = async () => {
    try {
      setArticlesLoading(true);
      const response = await axios.get(
        `${baseURL}/api/v1/admin/products/articles`,
        { withCredentials: true }
      );
      if (response.data.result && response.data.data) {
        setArticles(response.data.data);
      }
    } catch {
      setArticles([]);
    } finally {
      setArticlesLoading(false);
    }
  };

  const handleArticleSelection = (event, newValue) => {
    if (newValue && typeof newValue === 'object') {
      setSelectedArticle(newValue);
      qrFormik.setFieldValue('articleName', newValue.articleName);
      qrFormik.setFieldValue('articleId',   newValue.articleId.toString());
      const cols = (newValue.colors || []).map((c) => c.trim().toLowerCase()).filter(Boolean);
      setDbColors(cols);
      setSelectedColors([]);
    } else if (typeof newValue === 'string') {
      setSelectedArticle(null);
      qrFormik.setFieldValue('articleName', newValue);
      qrFormik.setFieldValue('articleId',   '');
      setDbColors([]);
      setSelectedColors([]);
    }
  };

  const toggleColor = (color) =>
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );

  const handleSpaceToComma = (event, fieldName) => {
    if (event.key === ' ') {
      event.preventDefault();
      const current = qrFormik.values[fieldName];
      if (current.trim() && !current.endsWith(',') && !current.endsWith(' ')) {
        qrFormik.setFieldValue(fieldName, current + ', ');
      }
    }
  };

  const handleInputChange = (event, fieldName) => {
    const value = event.target.value;
    qrFormik.setFieldValue(
      fieldName,
      fieldName === 'sizes' ? value.replace(/[^0-9,\s]/g, '') : value
    );
  };

  const handleLogout = async () => {
    try {
      const result = await Swal.fire({
        title: 'Confirm Logout', text: 'Are you sure you want to log out?',
        icon: 'question', showCancelButton: true,
        confirmButtonText: 'Yes, Logout', cancelButtonText: 'Cancel',
        confirmButtonColor: '#d33',
      });
      if (result.isConfirmed) {
        await axios.post(`${baseURL}/api/v1/auth/logout`, {}, { withCredentials: true });
        Swal.fire({ icon: 'success', title: 'Logged out successfully', timer: 1500, showConfirmButton: false });
        setTimeout(() => { window.location.href = '/login'; }, 1500);
      }
    } catch {
      Swal.fire({ icon: 'error', title: 'Logout failed', text: 'Please try again' });
    }
  };

  const qrFormik = useFormik({
    initialValues: {
      articleName:   "",
      articleId:     "",
      sizes:         "",
      numberOfQRs:   "",
      bharra:        "",
      printing:      "",
      packing:       "",
      cartonPair:    "",
      colorPrinting: "",
      imbozing:      "",
    },
    onSubmit: async (values) => {
      if (!values.articleName.trim()) { Swal.fire("Article name is required", "", "warning"); return; }
      if (selectedColors.length === 0) { Swal.fire("Select at least one color", "", "warning"); return; }
      if (!values.sizes.trim())        { Swal.fire("Sizes are required", "", "warning"); return; }
      if (!values.numberOfQRs || values.numberOfQRs <= 0) {
        Swal.fire("Please enter a valid number of cartons", "", "warning"); return;
      }

      try {
        setLoading(true);
        setGeneratedQRs([]);
        setBatchId(null);

        const requestData = {
          articleId:     values.articleId,
          articleName:   values.articleName.trim(),
          colors:        selectedColors,
          sizes:         values.sizes.split(',').map((s) => s.trim()).filter(Boolean),
          numberOfQRs:   parseInt(values.numberOfQRs),
          bharra:        values.bharra            || null,
          printing:      values.printing.trim()   || null,
          packing:       values.packing.trim()    || null,
          cartonPair:    values.cartonPair.trim() || null,
          colorPrinting: values.colorPrinting     || null,
          imbozing:      values.imbozing.trim()   || null,
        };

        const response = await axios.post(
          `${baseURL}/api/v1/contractor/qr/generate`,
          requestData,
          { withCredentials: true, headers: { "Content-Type": "application/json" } }
        );

        if (!response.data.result) throw new Error(response.data.message);

        const data = response.data.data;
        setGeneratedQRs(data.qrCodes);
        setBatchId(data.batchId || data.qrCodes[0]?.batchId);
        Swal.fire("Success!", response.data.message, "success");

      } catch (err) {
        Swal.fire("Error", err.response?.data?.message || "Failed to generate QR codes", "error");
      } finally {
        setLoading(false);
      }
    },
  });

  // ── Download ZIP ──────────────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    if (generatedQRs.length === 0) { Swal.fire("No QR codes to download", "", "warning"); return; }
    try {
      setDownloadLoading(true);
      const response = await axios.post(
        `${baseURL}/api/v1/contractor/qr/download`,
        { batchId: batchId || generatedQRs[0]?.batchId, articleName: qrFormik.values.articleName },
        { withCredentials: true, responseType: "blob" }
      );
      const url  = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute(
        "download",
        `QR_Codes_${qrFormik.values.articleName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.zip`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      Swal.fire("Success!", "QR codes downloaded successfully!", "success");
    } catch {
      Swal.fire("Error", "Failed to download QR codes", "error");
    } finally {
      setDownloadLoading(false);
    }
  }, [generatedQRs, qrFormik.values, batchId]);

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = useCallback(() => {
    if (generatedQRs.length === 0) { Swal.fire("No QR codes to print", "", "warning"); return; }
    try {
      setPrintLoading(true);
      const printWindow = window.open('', '_blank', 'width=420,height=700');
      if (!printWindow) {
        Swal.fire(
          "Popups Blocked",
          "Please allow popups for this site in your browser settings, then try again.",
          "warning"
        );
        return;
      }
      const html = buildPrintHTML(generatedQRs, qrFormik.values.articleName);
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
    } catch (err) {
      console.error("Print window error:", err);
      Swal.fire("Error", "Failed to open print window: " + err.message, "error");
    } finally {
      setPrintLoading(false);
    }
  }, [generatedQRs, qrFormik.values.articleName]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">🏷️ QR Label Generator</h1>
              <p className="text-sm text-gray-500 mt-1">Generate carton QR labels for production tracking</p>
            </div>
            <button onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center gap-2 text-sm">
              🚪 Logout
            </button>
          </div>

          <form onSubmit={qrFormik.handleSubmit} className="space-y-5">

            {/* Article */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Article Name <span className="text-red-500">*</span>
              </label>
              <Autocomplete
                freeSolo
                options={articles}
                getOptionLabel={(opt) => typeof opt === 'object' && opt.articleName ? opt.articleName : opt}
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
                  <TextField {...params} placeholder="Search articles or type new name..."
                    variant="outlined" size="small"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>{articlesLoading ? <CircularProgress color="inherit" size={18} /> : null}{params.InputProps.endAdornment}</>
                      ),
                    }}
                  />
                )}
                sx={{ '& .MuiOutlinedInput-root': { padding: '4px 8px' } }}
              />
              <p className="text-xs text-gray-400 mt-1">{articles.length} articles available.</p>
            </div>

            {/* Colors */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Colors <span className="text-red-500">*</span>
              </label>
              {!selectedArticle ? (
                <p className="text-xs text-gray-400 italic bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  Select an article above to see its available colors
                </p>
              ) : dbColors.length === 0 ? (
                <p className="text-xs text-amber-600 italic bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  No colors saved for this article yet. Add colors via Admin Panel → Edit article.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {dbColors.map((color) => {
                      const active = selectedColors.includes(color);
                      const dot    = colorDot(color);
                      return (
                        <button key={color} type="button" onClick={() => toggleColor(color)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold capitalize border-2 transition-all duration-200 ${
                            active
                              ? 'border-gray-700 bg-gray-700 text-white shadow-md scale-105'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:shadow-sm'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full border border-white/40 flex-shrink-0"
                            style={{ backgroundColor: dot }} />
                          {color}
                          {active && <span className="ml-0.5 text-white/80">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  {selectedColors.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1.5">
                      Selected: <span className="font-semibold text-gray-700">{selectedColors.join(', ')}</span>
                      <button type="button" onClick={() => setSelectedColors([])}
                        className="ml-2 text-red-400 hover:text-red-600 underline">Clear</button>
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Sizes */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Sizes <span className="text-red-500">*</span>
              </label>
              <input type="text" name="sizes" placeholder="e.g., 38 39 40"
                onChange={(e) => handleInputChange(e, 'sizes')}
                onKeyDown={(e) => handleSpaceToComma(e, 'sizes')}
                value={qrFormik.values.sizes}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <p className="text-xs text-gray-400 mt-1">Space → auto adds ", " between sizes</p>
            </div>

            {/* Cartons */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Number of Cartons <span className="text-red-500">*</span>
              </label>
              <input type="number" name="numberOfQRs" placeholder="e.g., 50" min="1"
                onChange={qrFormik.handleChange} value={qrFormik.values.numberOfQRs}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>

            {/* Production Details */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 mb-4">
                🏭 Production Details <span className="font-normal text-gray-400">(Optional)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-600">Bharra</label>
                  <select name="bharra" onChange={qrFormik.handleChange} value={qrFormik.values.bharra}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                    <option value="">Select Bharra</option>
                    <option value="fauji">Fauji</option>
                    <option value="plain">Plain</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-600">Color Printing</label>
                  <select name="colorPrinting" onChange={qrFormik.handleChange} value={qrFormik.values.colorPrinting}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                    <option value="">Select</option>
                    {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                {[
                  ["printing",   "Printing",    "e.g., Print-A123"],
                  ["packing",    "Packing",     ""],
                  ["cartonPair", "Carton Pair", ""],
                  ["imbozing",   "Imbozing",    ""],
                ].map(([name, label, ph]) => (
                  <div key={name}>
                    <label className="block text-xs font-semibold mb-1 text-gray-600">{label}</label>
                    <input type="text" name={name} placeholder={ph}
                      onChange={qrFormik.handleChange} value={qrFormik.values[name]}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition disabled:bg-blue-400 font-semibold text-base">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <CircularProgress size={20} color="inherit" /> Generating QR Labels...
                </div>
              ) : "🏷️ Generate QR Code Labels"}
            </button>
          </form>
        </div>

        {/* Results */}
        {generatedQRs.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center bg-green-100 text-green-800 px-5 py-2 rounded-full font-semibold">
                ✅ {generatedQRs.length} QR Code Labels Generated!
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button onClick={handleDownload} disabled={downloadLoading}
                className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-4 rounded-xl hover:bg-green-700 transition disabled:bg-green-400 font-semibold">
                {downloadLoading
                  ? <><CircularProgress size={20} color="inherit" /> Downloading...</>
                  : <><span>📦</span> Download ZIP ({generatedQRs.length} QRs)</>}
              </button>
              <button onClick={handlePrint} disabled={printLoading}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-xl hover:bg-blue-700 transition disabled:bg-blue-400 font-semibold">
                {printLoading
                  ? <><CircularProgress size={20} color="inherit" /> Opening...</>
                  : <><span>🖨️</span> Print QR Labels</>}
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h3 className="text-base font-semibold text-gray-800 mb-4">
                📋 Preview (First 4 of {generatedQRs.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {generatedQRs.slice(0, 4).map((qr, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-lg p-2 bg-white shadow-sm text-center">
                    <img src={qr.qrCodeImage} alt={`QR ${index + 1}`} className="w-full h-36 object-contain rounded" />
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