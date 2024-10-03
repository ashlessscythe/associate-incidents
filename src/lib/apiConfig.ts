import axios, { AxiosInstance } from "axios";
import { getApiKey } from "./authUtils";

const api: AxiosInstance = axios.create({
  baseURL: "/zapi",
});

// Add a request interceptor
api.interceptors.request.use(
  async (config) => {
    const apiKey = await getApiKey();
    // Modify the url to include the API key
    config.url = `/${apiKey}${config.url}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;