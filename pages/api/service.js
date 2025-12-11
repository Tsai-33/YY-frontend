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
    if (typeof window !== "undefined") {
      let token = null;
      
      // 優先從 localStorage 直接讀取
      token = localStorage.getItem("accessToken");

      if (!token) {
        const persistUser = localStorage.getItem("persist:user");
        if (persistUser) {
          try {
            const parsed = JSON.parse(persistUser);
            token = parsed?.accessToken || parsed?.user?.accessToken;
            
            // 處理雙引號 token
            if (token && typeof token === 'string') {
              while (token.startsWith('"') && token.endsWith('"')) {
                token = token.slice(1, -1);
              }
            }
          } catch (err) {
            console.error("Error parsing persist:user:", err);
          }
        }
      }
      
      // 將 header 設定到當前請求的 config 中 (重要!)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn("⚠️ No token found in localStorage or persist:user");
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 響應攔截器 - 統一處理錯誤和 token 過期
api.interceptors.response.use(
  (response) => {
    return {
      success: true,
      data: response.data,
    };
  },

  async (error) => {
    handleApiError(error);

    const status = error.response?.status;
    const message =error.response?.data?.message ||error.message || "Unknown error";
    return Promise.resolve({
      success: false,
      data: null,
      error: {
        status,
        message,
        raw: error,
      }
    });
  
  }
);

function handleApiError(error) {
  const status = error.response?.status;  

  switch (status) {
    case 400:
      console.warn("Bad request:", error.response.data);
      break;

    case 401:
      clearAuth();
      break;

    case 403:
      clearAuth();
      window.location.href = "/auth/login";
      break;

    case 404:
      console.warn("API not found");
      break;

    case 422:
      console.warn("Validation error:", error.response.data?.errors);
      break;

    case 429:
      console.warn("Too many requests, retry later");
      break;

    case 500:
      console.error("Server error:", error.response.data);
      break;

    default:
      if (!error.response) {
        console.error("Network error");
      }
      break;
  }
}

// Clear token
function clearAuth() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("persist:user");
  }
}

