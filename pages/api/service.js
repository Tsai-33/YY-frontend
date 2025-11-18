import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 請求前自動加 token
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// 可加攔截器統一處理錯誤
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);
