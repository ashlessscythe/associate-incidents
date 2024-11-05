import axios, { AxiosInstance } from "axios";
import { getApiKey } from "./authUtils";

const api: AxiosInstance = axios.create({
  baseURL: "/zapi",
});

// Add a request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const apiKey = await getApiKey();
      console.log("Generated API key:", apiKey); // Debug log
      // Modify the url to include the API key
      config.url = `/${apiKey}${config.url}`;
      console.log("Final request URL:", config.url); // Debug log
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

// Add a response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error Response:", error.response?.data);
    console.error("API Error Status:", error.response?.status);
    return Promise.reject(error);
  }
);

export default api;
