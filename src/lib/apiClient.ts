import axios from "axios";
import { BASE_API_URL } from "./config/apiConfig";

const apiClient = axios.create({
    baseURL: BASE_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
    timeout: 30000,
});

// Request interceptor to handle FormData
apiClient.interceptors.request.use((config) => {
    if (config.data instanceof FormData) {
        // remove from all header locations axios uses
        if (config.headers) {
            delete (config.headers)["Content-Type"];
            delete (config.headers)["content-type"];
        }
        if ((apiClient.defaults.headers).common) {
            delete (apiClient.defaults.headers).common["Content-Type"];
        }
    }
    return config;
});

// Global error handler
apiClient.interceptors.response.use(
    (res) => res,
    (error) => {
        console.error("API Proxy Error:", {
            url: error.config?.url,
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            data: error.response?.data,
        });

        // Transform specific errors
        if (error.response?.status === 413) {
            error.message = "File size exceeds maximum limit (5MB)";
        }

        return Promise.reject(error);
    }
);

export default apiClient;
