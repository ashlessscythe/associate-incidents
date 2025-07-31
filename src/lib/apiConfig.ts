import axios, { AxiosInstance } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: "/zapi",
});

// Add a request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      // Get the access token from localStorage
      const accessToken = localStorage.getItem('authToken');

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

      // Clear the token and redirect to login
      localStorage.removeItem('authToken');
      window.location.href = "/";
      return Promise.reject(error);
    }

    console.error("API Error Response:", error.response?.data);
    console.error("API Error Status:", error.response?.status);
    return Promise.reject(error);
  }
);

export default api;
