import axios from "axios";

const api = axios.create({
  // baseURL: "http://localhost:8080/api", // Update if your backend is at a different URL
  baseURL: import.meta.env.VITE_BASE_API_URL // Update if your backend is at a different URL
});

export default api;
