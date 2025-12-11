import { api } from "./service";

/**
 * 用户管理服务 API (Admin功能)
 * User Management Service API
 */

/**
 * 获取所有用户列表
 * @param {Object} params - 查询参数 {page, pageSize, role, isActive, search}
 * @returns {Promise} 用户列表
 */
export const getAllUsers = async (params = {}) => {
  const response = await api.get("/users", { params });
  
  return response.data;
};

/**
 * 获取单个用户详情
 * @param {number} userId - 用户ID
 * @returns {Promise} 用户详情
 */
export const getUserById = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

/**
 * 更新用户信息
 * @param {number} userId - 用户ID
 * @param {Object} userData - 用户数据
 * @returns {Promise} 更新结果
 */
export const updateUser = async (userId, userData) => {
  const response = await api.put(`/users/${userId}`, userData);
  return response.data;
};


/**
 * 批量删除用户
 * @param {Array} userIds - 用户ID数组
 * @returns {Promise} 删除结果
 */
export const batchDeleteUsers = async (userIds) => {
  const response = await api.post("/users/batch-delete", { userIds });
  return response.data;
};



/**
 * 获取用户统计信息
 * @returns {Promise} 统计信息
 */
export const getUserStats = async () => {
  const response = await api.get("/users/stats");
  return response.data;
};

/**
 * 获取用户操作日志
 * @param {Object} params - 查询参数 {userId, startTime, endTime, page, pageSize}
 * @returns {Promise} 用户日志列表
 */
export const getUserLogs = async (params = {}) => {
  const response = await api.get("/users/logs", { params });
  return response.data;
};

