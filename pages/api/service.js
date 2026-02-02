import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3947",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================
// Auto-Refresh Token 機制
// ============================================================
let isRefreshing = false;      // 標記是否正在刷新 token
let failedQueue = [];          // 等待刷新完成的請求隊列

/**
 * 處理等待隊列中的請求
 * @param {Error|null} error - 如果刷新失敗，傳入錯誤
 * @param {string|null} token - 如果刷新成功，傳入新 token
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ============================================================
// 請求攔截器 - 自動添加 token
// ============================================================
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
            if (token && typeof token === "string") {
              while (token.startsWith('"') && token.endsWith('"')) {
                token = token.slice(1, -1);
              }
            }
          } catch (err) {
            console.warn("Error parsing persist:user:", err);
          }
        }
      }

      // 將 header 設定到當前請求的 config 中
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

// ============================================================
// 響應攔截器 - 統一處理錯誤和 Auto-Refresh Token
// ============================================================
api.interceptors.response.use(
  (response) => {
    return {
      success: true,
      data: response.data,
    };
  },

  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const message = error.response?.data?.message || error.message || "Unknown error";

    // ============================================================
    // ⚠️ 優先級最高: Session 已被登出 (Auto Logout Job / Force Login)
    // 這種情況不需要嘗試 refresh，直接導向登入頁
    // ============================================================
    if (code === "SESSION_LOGGED_OUT" || code === "NO_SESSION" || code === "INVALID_TOKEN") {
      handleSessionLoggedOut();
      return new Promise(() => {});
    }

    // ============================================================
    // 403: Access Token 過期 → 嘗試 Auto-Refresh
    // ============================================================
    if (status === 403 && !originalRequest._retry) {
      // 如果正在刷新，將請求加入等待隊列
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // 標記此請求已嘗試過 refresh，避免無限循環
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        console.log("🔄 [Auto-Refresh] Attempting to refresh access token...");

        // 直接使用 axios 調用 refresh API (避免觸發 interceptor)
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh-token`,
          { refreshToken },
          { timeout: 5000 }
        );

        const result = response.data;

        // 檢查 refresh 是否成功
        if (result?.success && result?.data?.accessToken) {
          const newAccessToken = result.data.accessToken;
          const newRefreshToken = result.data.refreshToken; // ← 新的 refresh token

          console.log("✅ [Auto-Refresh] Tokens refreshed successfully");

          // 保存新 tokens 到 localStorage
          localStorage.setItem("accessToken", newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken);
          }

          // 更新 persist:user 中的 tokens (如果存在)
          try {
            const persistUser = localStorage.getItem("persist:user");
            if (persistUser) {
              const parsed = JSON.parse(persistUser);
              parsed.accessToken = JSON.stringify(newAccessToken);
              if (newRefreshToken) {
                parsed.refreshToken = JSON.stringify(newRefreshToken);
              }
              localStorage.setItem("persist:user", JSON.stringify(parsed));
            }
          } catch (e) {
            console.warn("[Auto-Refresh] Failed to update persist:user:", e);
          }

          // 處理等待隊列中的請求
          processQueue(null, newAccessToken);

          // 使用新 token 重新發送原始請求
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } else {
          // Refresh 失敗 (可能是 session 已被登出)
          throw new Error(result?.message || "Refresh token failed");
        }
      } catch (refreshError) {
        console.warn("❌ [Auto-Refresh] Failed:", refreshError.message);

        // 處理等待隊列中的請求 (全部 reject)
        processQueue(refreshError, null);

        // 檢查是否是 session 已登出的情況
        const refreshCode = refreshError.response?.data?.code;
        if (
          refreshCode === "SESSION_LOGGED_OUT" ||
          refreshCode === "NO_SESSION" ||
          refreshCode === "INVALID_TOKEN"
        ) {
          handleSessionLoggedOut();
        } else {
          // 其他情況 (refresh token 過期等)
          handleTokenExpired();
        }

        return new Promise(() => {});
      } finally {
        isRefreshing = false;
      }
    }

    // ============================================================
    // 401: 未授權 (token 無效)
    // ============================================================
    if (status === 401) {
      handleUnauthorized();
      return new Promise(() => {});
    }

    // ============================================================
    // 網路超時
    // ============================================================
    if (error?.code === "ECONNABORTED") {
      return Promise.reject(error);
    }

    // ============================================================
    // 其他錯誤
    // ============================================================
    handleApiError(error);

    return Promise.resolve({
      success: false,
      data: null,
      error: {
        status,
        message,
        raw: error,
      },
    });
  }
);

// ============================================================
// 錯誤處理函數
// ============================================================

/**
 * 處理 Session 已登出 (Auto Logout Job / Force Login)
 * 優先級最高，不嘗試 refresh
 */
function handleSessionLoggedOut() {
  if (typeof window === "undefined") return;
  console.warn("🚫 [Session] Session has been logged out");
  clearAuth();
  sessionStorage.setItem("logoutReason", "session_expired");
  window.location.replace("/auth/login?reason=session_expired");
}

/**
 * 處理 Token 過期且無法 refresh
 */
function handleTokenExpired() {
  if (typeof window === "undefined") return;
  console.warn("🚫 [Token] Token expired and refresh failed");
  clearAuth();
  sessionStorage.setItem("logoutReason", "token_expired");
  window.location.replace("/auth/login?reason=token_expired");
}

/**
 * 處理未授權 (401)
 */
function handleUnauthorized() {
  if (typeof window === "undefined") return;
  console.warn("🚫 [Auth] Unauthorized access");
  clearAuth();
  sessionStorage.setItem("logoutReason", "unauthorized");
  window.location.replace("/auth/login?reason=unauthorized");
}

/**
 * 處理一般 API 錯誤
 */
function handleApiError(error) {
  const status = error.response?.status;
  switch (status) {
    case 400:
      console.warn("Bad request:", error.response.data);
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
      console.warn("Server error:", error.response.data);
      break;
    default:
      if (!error.response) {
        console.warn("Network error");
      }
      break;
  }
}

/**
 * 清除認證資料
 */
function clearAuth() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("persist:user");
  }
}
