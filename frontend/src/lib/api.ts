import axios from "axios";
// import Cookies from 'js-cookie'

// Base Backend API
const backendUrl = import.meta.env.VITE_BACKEND_URL?.trim();
const api = axios.create({
  baseURL: backendUrl || '',
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      alert("Session expired. Please login again!");
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);


export default api;