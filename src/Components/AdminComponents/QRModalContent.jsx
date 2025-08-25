import { useState, useCallback, useMemo } from "react";
import { useFormik } from "formik";
import axios from "axios";
import Swal from "sweetalert2";
import CircularProgress from "@mui/material/CircularProgress";
import { baseURL } from "../../Utils/URLS";
import { useDispatch } from "react-redux";
import { setIsOpen } from "../../Slice/QrSlice";

// Modal content, only mounted when open === true
const QRModalContent = ({ products }) => {

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [articleSearch, setArticleSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatedQRs, setGeneratedQRs] = useState([]);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const dispatch = useDispatch();

  const flattenedArticles = useMemo(
    () => (Array.isArray(products) ? products : []),
    [products]
  );

  const filteredArticles = useMemo(() => {
    const term = articleSearch.trim().toLowerCase();
    if (!term) return flattenedArticles;
    return flattenedArticles.filter((a) =>
      (a.name || a.articleName || "").toLowerCase().includes(term)
    );
  }, [articleSearch, flattenedArticles]);

  const handleSelectArticle = useCallback((article) => {
    setSelectedArticle(article);
    setDropdownOpen(false);
    setArticleSearch("");
  }, []);

  const formik = useFormik({
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
          articleId: selectedArticle._id,
          articleName: selectedArticle.name,
          variant: selectedArticle.variantName,
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
        action.resetForm()
      } catch (err) {
        console.log(err);
        
        Swal.fire("Error", err.response.data.message || "Something went wrong", "error");
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
        `QR_Codes_${selectedArticle?.name || "products"}_${Date.now()}.zip`
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
  }, [generatedQRs, selectedArticle?.name]);




  return (
    <div
      className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Generate QR Codes</h2>
        <button
          onClick={ ()=> dispatch(setIsOpen(false))}
          className="text-gray-500 hover:text-gray-700 text-lg font-bold px-2 py rounded-full border"
        >
          ×
        </button>
      </div>

      <form onSubmit={formik.handleSubmit}  className="space-y-4">
        {/* Article Selection Dropdown */}
        <div className="relative w-full">
          <label className="block text-sm font-medium mb-2">
            Select Article
          </label>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 flex items-center justify-between hover:border-gray-400 transition-colors"
          >
            {selectedArticle
              ? `${selectedArticle.name} (${selectedArticle.variantName})`
              : "Choose an article"}
            <span
              className={`ml-2 transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </button>

          {dropdownOpen && (
            <div className="absolute mt-2 w-full bg-white shadow-lg rounded-md border border-gray-200 z-10">
              <div className="p-2 border-b">
                <input
                  type="text"
                  placeholder="Search article..."
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
                      className="flex items-center p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <img
                        src={article.image || article.images?.[0]}
                        alt={article.name}
                        className="w-10 h-10 object-cover rounded-md mr-3"
                      />
                      <div>
                        <span className="capitalize font-medium">
                          {article.name}
                        </span>
                        {article.variantName && (
                          <div className="text-sm text-gray-500">
                            {article.variantName}
                          </div>
                        )}
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

        {/* Number of QR Codes Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Number of QR Codes to Generate
          </label>
          <input
            type="number"
            name="numberOfQRs"
            placeholder="e.g., 50"
            onChange={formik.handleChange}
            value={formik.values.numberOfQRs}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-gray-500"
            min="1"
            max="1000"
          />
          <div className="text-xs text-gray-500 mt-1">
            Maximum 1000 QR codes per generation
          </div>
        </div>

        {/* Generate Button */}
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

      {/* QR Codes Preview and Download */}
      {generatedQRs.length > 0 && (

        <div className="mt-6 border-t pt-4">
            <p className="text-sm text-center text-black mb-2">Qr Codes Generated</p>
          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition duration-200 disabled:bg-green-400"
            disabled={downloadLoading}
          >
            {downloadLoading ? (
              <div className="flex items-center justify-center">
                <CircularProgress size={20} color="inherit" className="mr-2" />
                Preparing Download...
              </div>
            ) : (
              `Download All ${generatedQRs.length} QR Codes`
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default QRModalContent


