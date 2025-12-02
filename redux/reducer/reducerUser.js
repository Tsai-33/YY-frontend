import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userId: "",
  userIP: "",
  userName: "",
  userEmail: "",
  userRole: "",
  accountNumber: "",
  permissions: {},
  isAuthenticated: false,
  isFirstLogin: false,
  accessToken: null,
  refreshToken: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // 设置用户信息
    setUser: (state, action) => {
      const { id, name, email, role, accountNumber, permissions, isFirstLogin } = action.payload;
      if (id !== undefined) state.userId = id;
      if (name !== undefined) state.userName = name;
      if (email !== undefined) state.userEmail = email;
      if (role !== undefined) state.userRole = role;
      if (accountNumber !== undefined) state.accountNumber = accountNumber;
      if (permissions !== undefined) state.permissions = permissions;
      if (isFirstLogin !== undefined) state.isFirstLogin = isFirstLogin;
    },
    
    // 设置IP地址
    setIP: (state, action) => {
      state.userIP = action.payload;
    },
    
    // 登录成功 - 设置完整用户信息和token
    loginSuccess: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.userId = user.userId;
      state.userName = user.username;
      state.userEmail = user.email;
      state.userRole = user.role;
      state.accountNumber = user.accountNumber;
      state.permissions = user.permissions || {};
      state.isFirstLogin = user.isFirstLogin;
      state.isAuthenticated = true;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      
      // 保存到 localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
      }
    },
    
    // 登出
    logout: (state) => {
      // 清除 localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }
      
      // 重置状态
      return {
        ...initialState,
        userIP: state.userIP, // 保留IP地址
      };
    },
    
    // 更新token
    updateTokens: (state, action) => {
      const { accessToken, refreshToken } = action.payload;
      if (accessToken) {
        state.accessToken = accessToken;
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", accessToken);
        }
      }
      if (refreshToken) {
        state.refreshToken = refreshToken;
        if (typeof window !== "undefined") {
          localStorage.setItem("refreshToken", refreshToken);
        }
      }
    },

    
    // 更新权限
    updatePermissions: (state, action) => {
      state.permissions = action.payload;
    },
    
    // 重置用户信息（保留IP）
    resetUser: (state) => {
      return {
        ...initialState,
        userIP: state.userIP,
      };
    },
  },
});

export const {
  setUser,
  setIP,
  loginSuccess,
  logout,
  updateTokens,
  updatePermissions,
  resetUser,
} = userSlice.actions;

export default userSlice.reducer;
