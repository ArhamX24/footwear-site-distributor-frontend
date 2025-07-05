import React, { useRef } from "react";

const ImageUploader = ({ formik, setPreview }) => {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFiles = (event) => {
    const newFiles = Array.from(event.target.files);
    const existingFiles = formik.values.images || [];

    // Combine and deduplicate files
    const combinedFiles = [...existingFiles, ...newFiles];
    const uniqueFiles = Array.from(
      new Map(combinedFiles.map(file => [`${file.name}-${file.size}`, file])).values()
    );

    formik.setFieldValue("images", uniqueFiles);
    setPreview(uniqueFiles.map((file) => URL.createObjectURL(file)));

    // Reset input to allow re-uploading the same file
    event.target.value = null;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Hidden Inputs */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        multiple
        className="hidden"
        onChange={handleFiles}
      />
      <input
        type="file"
        accept="image/*"
        ref={galleryInputRef}
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      {/* Buttons visible only on mobile */}
      <div className="flex gap-4 sm:hidden mt-4">
        <button
          type="button"
          onClick={() => cameraInputRef.current.click()}
          className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md shadow"
        >
          Take Photo
        </button>
        <button
          type="button"
          onClick={() => galleryInputRef.current.click()}
          className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md shadow"
        >
          Choose from Gallery
        </button>
      </div>

      {/* Fallback drag-and-drop area for desktop */}
      <label
        htmlFor="dropzone-file"
        className="hidden sm:flex flex-col items-center justify-center w-full h-36 border-2 border-gray-800 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 mt-4"
      >
        <input
          id="dropzone-file"
          type="file"
          name="images"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFiles}
        />
        <p className="text-sm text-black">
          <span className="font-semibold">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-black">SVG, PNG, JPG or GIF</p>
      </label>
    </div>
  );
};

export default ImageUploader;