import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3947",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 請求攔截器 - 自動添加 token
api.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 響應攔截器 - 統一處理錯誤和 token 過期
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 如果是 401 錯誤且不是登錄請求，嘗試刷新 token
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/login")
    ) {
      originalRequest._retry = true;

      try {
        // 嘗試使用 refresh token 獲取新的 access token
        if (typeof window !== "undefined") {
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            const response = await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3947"}/auth/refresh-token`,
              { refreshToken }
            );

            if (response.data.success) {
              const newAccessToken = response.data.data.accessToken;
              localStorage.setItem("accessToken", newAccessToken);

              // 重試原始請求
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return api(originalRequest);
            }
          }
        }
      } catch (refreshError) {
        // Refresh token 也過期了，清除所有 token 並跳轉到登錄頁
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/auth/login";
        }
        return Promise.reject(refreshError);
      }
    }

    // 如果是 403 錯誤 (token 過期)，清除 token 並跳轉登錄
    if (error.response?.status === 403) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/auth/login";
      }
    }

    console.warn("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);
