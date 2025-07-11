import axios from "axios";

const api = axios.create({
  baseURL: "http://64.225.86.126/api-gate/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
