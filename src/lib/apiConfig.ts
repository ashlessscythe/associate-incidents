import axios, { AxiosInstance } from "axios";
import { Authorizer } from "@authorizerdev/authorizer-js";

const authorizer = new Authorizer({
  authorizerURL: import.meta.env.VITE_AUTHORIZER_URL,
  clientID: import.meta.env.VITE_AUTHORIZER_CLIENT_ID,
  redirectURL: window.location.origin,
});

const api: AxiosInstance = axios.create({
  baseURL: "/zapi",
});

// Add a request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      // Get the access token from Authorizer
      const session = await authorizer.getSession();
      const accessToken = session?.data?.access_token;

      if (accessToken) {
        // Add JWT token to Authorization header
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      return config;
    } catch (error) {
      console.error("Error in request interceptor:", error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Get a fresh token from Authorizer
        const session = await authorizer.getSession();
        const accessToken = session?.data?.access_token;

        // Retry the original request with the new token
        if (accessToken) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Handle refresh failure (e.g., redirect to login)
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    console.error("API Error Response:", error.response?.data);
    console.error("API Error Status:", error.response?.status);
    return Promise.reject(error);
  }
);

export default api;
