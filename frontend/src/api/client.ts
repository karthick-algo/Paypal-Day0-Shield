import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Add CSRF token to mutating requests
api.interceptors.request.use((config) => {
  if (["post", "put", "patch", "delete"].includes(config.method || "")) {
    const csrf = localStorage.getItem("csrf_token");
    if (csrf) {
      config.headers["X-CSRF-Token"] = csrf;
    }
  }
  return config;
});

// Handle 401 — redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.includes("/login")) {
      localStorage.removeItem("csrf_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
