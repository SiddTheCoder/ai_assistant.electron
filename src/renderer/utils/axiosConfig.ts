import axios from "axios";
import { toast } from "sonner";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token to headers
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await window.electronApi.getToken("access_token")
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle errors globally
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      toast.error(`Error: ${error.response.data.message || "An error occurred"}`);
    } else {
      toast.error("Network Error: Please check your connection.");
    }
    return Promise.reject(error);
  }
)

export default axiosInstance;

// Exporting the axios instance for use in other parts of the application
export { axiosInstance };