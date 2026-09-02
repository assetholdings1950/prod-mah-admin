import axios, { InternalAxiosRequestConfig } from "axios";

// Extend config type to carry a retry flag
interface RetryableConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

// Prevent multiple simultaneous token refresh calls
let isRefreshing = false;
let pendingQueue: Array<(success: boolean) => void> = [];

const flushQueue = (success: boolean) => {
    pendingQueue.forEach((cb) => cb(success));
    pendingQueue = [];
};

const appClient = axios.create({
    baseURL: "",
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
    timeout: 30000,
});

// Remove Content-Type for FormData uploads
appClient.interceptors.request.use((config) => {
    if (config.data instanceof FormData) {
        if (config.headers) {
            delete (config.headers as Record<string, unknown>)["Content-Type"];
            delete (config.headers as Record<string, unknown>)["content-type"];
        }
        if ((appClient.defaults.headers as Record<string, unknown>).common) {
            delete (appClient.defaults.headers.common as Record<string, unknown>)["Content-Type"];
        }
    }
    return config;
});

appClient.interceptors.response.use(
    (res) => res,
    async (error) => {
        const originalRequest = error.config as RetryableConfig;

        // Only intercept 401s that haven't been retried and are not auth calls
        // (avoids infinite loop on /api/auth/refresh itself)
        const isAuthEndpoint = originalRequest?.url?.startsWith("/api/auth/");

        if (
            error.response?.status === 401 &&
            !originalRequest?._retry &&
            !isAuthEndpoint
        ) {
            if (isRefreshing) {
                // Another refresh is in flight — queue and wait for result
                return new Promise((resolve, reject) => {
                    pendingQueue.push((success) => {
                        if (success) resolve(appClient(originalRequest));
                        else reject(error);
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Use a plain axios instance so it bypasses this interceptor
                await axios.post("/api/auth/refresh", {}, { withCredentials: true });
                flushQueue(true);
                return appClient(originalRequest);
            } catch {
                flushQueue(false);
                // Refresh token is also expired — force sign-out
                if (typeof window !== "undefined") {
                    window.location.replace("/sign-in");
                }
                return Promise.reject(error);
            } finally {
                isRefreshing = false;
            }
        }

        // Generic error logging for non-401 errors
        console.error("Frontend API Error:", {
            endpoint: originalRequest?.url,
            status: error.response?.status,
            message: error.message,
        });

        if (error.response?.data?.error) {
            error.message = error.response.data.error;
        } else if (error.response?.data?.message) {
            error.message = error.response.data.message;
        }

        return Promise.reject(error);
    }
);

export default appClient;
