import React from "react";

const ProfileUpdate = ({setProfileModalOpen}) => {
  return (
    <div className="bg-gradient-to-r min-h-screen flex items-start justify-center">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-10 text-gray-900 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between mb-5 items-start">
          <h2 className="text-4xl font-bold text-gray-900">Update Profile</h2>
        </div>

        <form className="space-y-4">
          {["First Name", "Last Name", "Email", "Phone", "Phone"].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700">{field}</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" defaultValue={`Sample ${field}`} />
            </div>
          ))}
          <div className="flex justify-end space-x-4">
            <button type="button" className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 cursor-pointer" onClick={()=>{setProfileModalOpen(false)}}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 cursor-pointer">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileUpdate;