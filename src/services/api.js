import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api", // Update if your backend is at a different URL
  // baseURL: "http://192.168.1.37:8080/api", // Update if your backend is at a different URL
});

export default api;
