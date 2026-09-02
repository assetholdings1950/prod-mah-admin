import axios from "axios";
import { BASE_API_URL } from "./config/apiConfig";
import { cookies } from "next/headers";

export async function authClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get("adminAccessToken")?.value;
  console.log("[authClient] Token from cookies:", token ? token.substring(0, 15) + "..." : "undefined");

  const getAuthClient = axios.create({
    baseURL: BASE_API_URL,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    withCredentials: true,
  });

  // Request interceptor
  getAuthClient.interceptors.request.use((config) => {
    if (config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
      if (getAuthClient.defaults.headers.common) {
        delete getAuthClient.defaults.headers.common["Content-Type"];
      }
    }
    return config;
  });

  // Response interceptor
  getAuthClient.interceptors.response.use(
    (res) => res,
    (error) => {
      console.error("API Proxy Error:", {
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
      });

      if (error.response?.status === 413) {
        error.message = "File size exceeds maximum limit (5MB)";
      }

      return Promise.reject(error);
    }
  );

  return getAuthClient;
}
