import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true, // needed for refresh token cookie
});

// Attach JWT on every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 — try to refresh; if that fails, redirect to /login
let refreshing = null;
client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const requestUrl = original?.url ?? "";
    const isRefreshCall = requestUrl.includes("/auth/refresh");

    // Never try to refresh a refresh request; this can deadlock and leave UI stuck on loading.
    if (isRefreshCall) {
      localStorage.removeItem("access_token");
      return Promise.reject(err);
    }

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = client.post("/auth/refresh").finally(() => { refreshing = null; });
        }
        const { data } = await refreshing;
        localStorage.setItem("access_token", data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return client(original);
      } catch {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

export default client;
