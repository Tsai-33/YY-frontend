import { api } from "./service";

/**
 * 认证服务 API
 * Authentication Service API
 */

/**
 * 用户登录
 * @param {string} identifier - 邮箱或账号编号 (Email hoặc AccountNumber)
 * @param {string} password - 密码
 * @returns {Promise} 登录结果
 */
export const login = async (identifier, password) => {
  // Backend controller会检查 email, accountNumber, 或 identifier 字段
  // 使用 email 字段名以保持向后兼容，backend会查找 Email 或 AccountNumber
  const response = await api.post("/auth/login", { 
    email: identifier, // Backend会使用此值查找 Email 或 AccountNumber
    password: password, // 密码字段
  });
  return response.data;
};

/**
 * 用户注册 (Admin功能)
 * @param {Object} userData - 用户数据
 * @returns {Promise} 注册结果
 */
export const register = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

/**
 * 修改密码
 * @param {string} oldPassword - 旧密码
 * @param {string} newPassword - 新密码
 * @param {string} confirmPassword - 确认密码
 * @returns {Promise} 修改结果
 */
export const changePassword = async (
  oldPassword,
  newPassword,
  confirmPassword
) => {
  const response = await api.post("/auth/change-password", {
    oldPassword,
    newPassword,
    confirmPassword,
  });
  return response.data;
};

/**
 * 忘记密码 - 发送重置链接
 * @param {string} email - 邮箱
 * @returns {Promise} 发送结果
 */
export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

/**
 * 重置密码
 * @param {string} token - 重置token
 * @param {string} newPassword - 新密码
 * @param {string} confirmPassword - 确认密码
 * @returns {Promise} 重置结果
 */
export const resetPassword = async (token, newPassword, confirmPassword) => {
  const response = await api.post("/auth/reset-password", {
    token,
    newPassword,
    confirmPassword,
  });
  return response.data;
};

/**
 * 刷新访问令牌
 * @param {string} refreshToken - 刷新令牌
 * @returns {Promise} 新的访问令牌
 */
export const refreshAccessToken = async (refreshToken) => {
  const response = await api.post("/auth/refresh-token", { refreshToken });
  return response.data;
};

/**
 * 获取当前用户信息
 * @returns {Promise} 用户信息
 */
export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

/**
 * 登出
 * @returns {Promise} 登出结果
 */
export const logout = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

