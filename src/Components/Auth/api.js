import axios from "axios";
import { baseURL } from "../../Utils/URLS";

const api = axios.create({
    baseURL: `${baseURL}`, // ✅ Unified base for both admin & distributor
    withCredentials: true
});

const refreshURL = "/api/v1/auth/refresh"; // ✅ Single endpoint for refresh

api.interceptors.response.use(
    res => res,
    async (err) => {
        const original = err.config;

        // ✅ Automatically refresh token when access token expires
        if (err.response?.status === 401 && !original._retry) {
            original._retry = true;
            try {
                await axios.get(refreshURL, {
                    baseURL: api.defaults.baseURL,
                    withCredentials: true
                });
                return api(original); // Retry original request after refresh
            } catch {
                return Promise.reject(err); // Let app handle failed refresh
            }
        }

        return Promise.reject(err);
    }
);

export default api;