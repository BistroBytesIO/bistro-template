import axios from "axios";

const adminApi = axios.create({
  // baseURL: "http://localhost:8080/api",
    baseURL: import.meta.env.VITE_BASE_API_URL // Ensure this is correct
});

// Attach token to every request if available in localStorage
adminApi.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    } else {
      console.warn("No authentication token found.");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default adminApi;
