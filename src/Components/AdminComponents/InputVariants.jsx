import React from "react";

const InputVariants = ({label,placeholder,type}) => {
  return (
    <div className="flex md:w-2/5 w-4/5 mx-auto md:mx-0 flex-col gap-6">
      <div className="flex flex-col">
        <label className="text-gray-700 font-medium mb-1">{label}</label>
        <input
          type={`${type}`}
          placeholder={`${placeholder}`}
          className="bg-gray-100 border border-gray-300 rounded px-3 py-2 focus:ring-blue-500"
          readOnly
        />
      </div>
    </div>
  );
};

export default InputVariants;