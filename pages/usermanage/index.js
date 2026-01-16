import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import {
  getAllUsers,
  batchDeleteUsers,
  updateUser,
  getUserLogs,
} from "../api/userService";
import { register } from "../api/authService";
import { exportUserLogsToExcel } from "@/utils/exportExcel";
import PageHeader from "@/components/common/pageHeader/pageHeader";
import ActionBtn from "@/components/common/btns/actionBtn";
import Modal from "@/components/common/modal/modal";
import InputFrame from "@/components/common/input/inputFrame";
import Loading from "@/components/common/loading/loading";
import Alert from "@/components/common/alert/alert";

function UserManage() {
  const router = useRouter();
  const { userRole, isAuthenticated } = useSelector((state) => state.user);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [downloadTimeRange, setDownloadTimeRange] = useState({
    startTime: "",
    endTime: "",
  });
  const [downloadUserId, setDownloadUserId] = useState(null);

  // 權限映射 (英文 -> 中文顯示)
  const PERMISSION_MAP = {
    inbound: "入倉",
    transfer: "調撥",
    outboundExternal: "銷貨",
    shelfTransfer: "理貨",
    stockQuery: "庫存查詢",
    inventory: "盤點",
    outboundInternal: "領用",
  };

  // 新用户表单 (使用英文權限名稱)
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    accountNumber: "",
    role: "user",
    permissions: {
      inbound: false,
      transfer: false,
      outboundExternal: false,
      shelfTransfer: false,
      stockQuery: false,
      inventory: false,
      outboundInternal: false,
    },
  });

  // 编辑用户表单 (使用英文權限名稱)
  const [editingUser, setEditingUser] = useState({
    userId: null,
    username: "",
    email: "",
    accountNumber: "",
    role: "user",
    permissions: {
      inbound: false,
      transfer: false,
      outboundExternal: false,
      shelfTransfer: false,
      stockQuery: false,
      inventory: false,
      outboundInternal: false,
    },
  });

  // 检查是否是管理员
  useEffect(() => {
    // 如果未登錄，立即重定向到登錄頁
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    fetchUsers();
  }, [userRole, isAuthenticated, router]);

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getAllUsers();
      if (response.success) {
        setUsers(response.data.users);
      } else {
        Alert({
          title: "錯誤",
          html: response.message,
          confirmButtonColor: "#b32627",
        });
      }
    } catch (error) {
      console.warn("獲取用戶列表失敗:", error);
      Alert({
        title: "錯誤",
        html: "獲取用戶列表失敗",
        confirmButtonColor: "#b32627",
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理新用户输入
  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };
      // 如果 role 是 admin 或 manager，自動設置所有權限為 true
      if (name === "role" && (value === "admin" || value === "manager")) {
        const allPermissionsTrue = {};
        Object.keys(prev.permissions).forEach((key) => {
          allPermissionsTrue[key] = true;
        });
        updated.permissions = allPermissionsTrue;
      }
      return updated;
    });
  };

  // 处理权限变更
  const handlePermissionChange = (permissionName) => {
    // 如果 role 是 admin 或 manager，不允許修改權限
    if (newUser.role === "admin" || newUser.role === "manager") {
      return;
    }
    setNewUser((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionName]: !prev.permissions[permissionName],
      },
    }));
  };

  // 处理编辑用户输入
  const handleEditUserChange = (e) => {
    const { name, value } = e.target;
    setEditingUser((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };
      // 如果 role 是 admin 或 manager，自動設置所有權限為 true
      if (name === "role" && (value === "admin" || value === "manager")) {
        const allPermissionsTrue = {};
        Object.keys(prev.permissions).forEach((key) => {
          allPermissionsTrue[key] = true;
        });
        updated.permissions = allPermissionsTrue;
      }
      return updated;
    });
  };

  // 处理编辑权限变更
  const handleEditPermissionChange = (permissionName) => {
    // 如果 role 是 admin 或 manager，不允許修改權限
    if (editingUser.role === "admin" || editingUser.role === "manager") {
      return;
    }
    setEditingUser((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionName]: !prev.permissions[permissionName],
      },
    }));
  };

  // 權限名稱映射 (中文 -> 英文)
  const PERMISSION_CN_TO_EN = {
    入倉: "inbound",
    調撥: "transfer",
    銷貨: "outboundExternal",
    理貨: "shelfTransfer",
    庫存查詢: "stockQuery",
    盤點: "inventory",
    領出: "outboundInternal",
    領用: "outboundInternal",
  };

  // 打开编辑模态框并加载用户数据
  const handleEditUser = (user) => {
    // 解析权限 (如果权限是字符串JSON) - 轉換為英文權限名稱
    let permissions = {
      inbound: false,
      transfer: false,
      outboundExternal: false,
      shelfTransfer: false,
      stockQuery: false,
      inventory: false,
      outboundInternal: false,
    };

    try {
      if (user.Permissions) {
        const parsedPermissions =
          typeof user.Permissions === "string"
            ? JSON.parse(user.Permissions)
            : user.Permissions;

        // 轉換中文權限名稱為英文
        Object.keys(parsedPermissions).forEach((cnKey) => {
          const enKey = PERMISSION_CN_TO_EN[cnKey] || cnKey;
          if (permissions.hasOwnProperty(enKey)) {
            permissions[enKey] = parsedPermissions[cnKey];
          } else if (permissions.hasOwnProperty(cnKey)) {
            // 如果已經是英文，直接使用
            permissions[cnKey] = parsedPermissions[cnKey];
          }
        });
      }
    } catch (e) {
      console.warn("解析權限失敗:", e);
    }

    // 如果 role 是 admin 或 manager，自動設置所有權限為 true
    const finalPermissions =
      user.Role === "admin" || user.Role === "manager"
        ? Object.keys(permissions).reduce((acc, key) => {
            acc[key] = true;
            return acc;
          }, {})
        : permissions;

    setEditingUser({
      userId: user.UserId,
      username: user.Username || "",
      email: user.Email || "",
      accountNumber: user.AccountNumber || "",
      role: user.Role || "user",
      permissions: finalPermissions,
    });
    setShowEditModal(true);
  };

  // 更新用户
  const handleUpdateUser = async () => {
    // 验证输入
    if (
      !editingUser.username ||
      !editingUser.email ||
      !editingUser.accountNumber
    ) {
      Alert({
        title: "錯誤",
        html: "請填寫所有必填字段",
        confirmButtonColor: "#b32627",
      });
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editingUser.email)) {
      Alert({
        title: "錯誤",
        html: "郵箱格式不正確",
        confirmButtonColor: "#b32627",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await updateUser(editingUser.userId, {
        username: editingUser.username,
        email: editingUser.email,
        accountNumber: editingUser.accountNumber,
        role: editingUser.role,
        permissions: editingUser.permissions,
      });

      if (response.success) {
        Alert({
          title: "成功",
          html: "用戶更新成功",
          confirmButtonColor: "#008b48",
        });

        // 关闭模态框并重置表单
        setShowEditModal(false);
        setEditingUser({
          userId: null,
          username: "",
          email: "",
          accountNumber: "",
          role: "user",
          permissions: {
            inbound: false,
            transfer: false,
            outboundExternal: false,
            shelfTransfer: false,
            stockQuery: false,
            inventory: false,
            outboundInternal: false,
          },
        });

        // 刷新用户列表
        fetchUsers();
      } else {
        Alert({
          title: "更新失敗",
          html: response.message,
          confirmButtonColor: "#b32627",
        });
      }
    } catch (error) {
      console.warn("更新用戶失敗:", error);
      Alert({
        title: "更新錯誤",
        html: error.response?.data?.message || "更新用戶失敗",
        confirmButtonColor: "#b32627",
      });
    } finally {
      setLoading(false);
    }
  };

  // 下载用户日志
  const handleDownloadLogs = async () => {
    setLoading(true);
    try {
      const response = await getUserLogs({
        UserId: downloadUserId,
        StartTime: downloadTimeRange.startTime,
        EndTime: downloadTimeRange.endTime,
      });

      if (response.success && response.data) {
        if (response.data.length > 0) {
          exportUserLogsToExcel(
            response.data,
            downloadUserId,
            downloadTimeRange.startTime,
            downloadTimeRange.endTime
          );
          Alert({
            title: "成功",
            html: "下載用戶日志成功",
            confirmButtonColor: "#008b48",
          });
        } else {
          Alert({
            title: "無資料",
            html: "無資料可下載",
            confirmButtonColor: "#b32627",
          });
        }
        // 關閉 modal
        setShowDownloadModal(false);
        setDownloadTimeRange({ startTime: "", endTime: "" });
        setDownloadUserId(null);
      } else {
        Alert({
          title: "錯誤",
          html: response.message || "發生未知錯誤",
          confirmButtonColor: "#b32627",
        });
      }
    } catch (error) {
      console.warn("下載日誌失敗:", error);
      Alert({
        title: "錯誤",
       html: error.message || "下載用戶日志失敗",
        confirmButtonColor: "#b32627",
      });
    } finally {
      setLoading(false);
    }
  };

  // 创建新用户
  const handleCreateUser = async () => {
    // 验证输入
    if (!newUser.username || !newUser.email || !newUser.accountNumber) {
      Alert({
        title: "錯誤",
        html: "請填寫所有必填字段",
        confirmButtonColor: "#b32627",
      });
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      Alert({
        title: "錯誤",
       html: "郵箱格式不正確",
        confirmButtonColor: "#b32627",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await register(newUser);

      if (response.success) {
        Alert({
          title: "成功",
          html: "用戶創建成功，默認密碼已發送至郵箱",
          confirmButtonColor: "#008b48",
        });

        // 关闭模态框并重置表单
        setShowModal(false);
        setNewUser({
          username: "",
          email: "",
          accountNumber: "",
          role: "user",
          permissions: {
            inbound: false,
            transfer: false,
            outboundExternal: false,
            shelfTransfer: false,
            stockQuery: false,
            inventory: false,
            outboundInternal: false,
          },
        });

        // 刷新用户列表
        fetchUsers();
      } else {
        Alert({
          title: "創建失敗",
          html: response.message,
          confirmButtonColor: "#b32627",
        });
      }
    } catch (error) {
      console.warn("創建用戶失敗:", error);
      Alert({
        title: "創建錯誤",
        html: error.response?.data?.message || "創建用戶失敗",
        confirmButtonColor: "#b32627",
      });
    } finally {
      setLoading(false);
    }
  };

  // 批量删除用户
  const handleBatchDelete = async () => {
    if (selectedUsers.length === 0) {
      Alert({
        title: "提示",
       html: "請先選擇要刪除的用戶",
        confirmButtonColor: "#FA8350",
      });
      return;
    }

    Alert({
      title: "確認批量刪除",
      html: `確定要刪除選中的 ${selectedUsers.length} 個用戶嗎？`,
      showCancel: true,
      confirmButtonText: "確定",
      cancelButtonText: "取消",
      confirmButtonColor: "#b32627",
      onConfirm: async () => {
        setLoading(true);
        try {
          const response = await batchDeleteUsers(selectedUsers);
          if (response.success) {
            Alert({
              title: "成功",
             html: `已刪除 ${selectedUsers.length} 個用戶`,
              confirmButtonColor: "#008b48",
            });
            setSelectedUsers([]);
            fetchUsers();
          } else {
            Alert({
              title: "刪除失敗",
             html: response.message,
              confirmButtonColor: "#b32627",
            });
          }
        } catch (error) {
          console.warn("批量刪除失敗:", error);
          Alert({
            title: "刪除失敗",
           html: "批量刪除用戶失敗",
            confirmButtonColor: "#b32627",
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 切换用户选择
  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // 过滤用户列表
  const filteredUsers = users.filter(
    (user) =>
      user.Username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.AccountNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {loading && <Loading />}

      <div className="flex flex-col h-full gap-4">
        {/* 页面标题 */}
        <PageHeader title="" backTo="/workspace" />

        {/* 操作按钮 */}
        <div className="flex gap-4 px-4">
          <ActionBtn
            icon="icon-add"
            text="增加使用者"
            variant="green"
            onClick={() => setShowModal(true)}
          />
          <ActionBtn
            icon="icon-delete"
            text="從團隊移除"
            variant="green"
            onClick={handleBatchDelete}
            disabled={selectedUsers.length === 0}
          />
        </div>

        {/* 用户列表表格 */}
        <div className="flex-1 px-4 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-(--green-vivid) text-white">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedUsers.length === filteredUsers.length &&
                        filteredUsers.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredUsers.map((u) => u.UserId));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      className="w-5 h-5"
                    />
                  </th>
                  <th className="p-4 text-left text-lg">用戶名稱</th>
                  <th className="p-4 text-left text-lg">角色</th>
                  <th className="p-4 text-left text-lg">信箱</th>
                  <th className="p-4 text-left text-lg">帳號</th>
                  <th className="p-4 text-center text-lg">編輯</th>
                  <th className="p-4 text-center text-lg">下載紀錄</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.UserId}
                    className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.UserId)}
                        onChange={() => toggleUserSelection(user.UserId)}
                        className="w-5 h-5"
                      />
                    </td>
                    <td className="p-4 font-medium">{user.Username}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold $`}>
                        {user.Role === "admin"
                          ? "系統管理人員"
                          : user.Role === "manager"
                          ? "管理人員"
                          : "使用者"}
                      </span>
                    </td>
                    <td className="p-4">{user.Email}</td>
                    <td className="p-4">{user.AccountNumber}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="hover:text-(--orange-vivid) transition-colors">
                        <span className="text-2xl">
                          <i className="icon-edit"></i>
                        </span>
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => {
                          setDownloadUserId(user.UserId);
                          setShowDownloadModal(true);
                        }}
                        className="hover:text-(--red-vivid) transition-colors">
                        <span className="text-2xl">
                          <i className="icon-download"></i>
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-xl">沒有找到用戶</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 创建用户模态框 */}
      <Modal
        showModal={showModal}
        title="增加使用者"
        onClose={() => setShowModal(false)}
        onConfirm={handleCreateUser}
        width="50vw"
        height="auto">
        <div className="grid grid-cols-2 gap-6 py-4">
          {/* 左侧 - 基本信息 */}
          <div className="space-y-4">
            <div>
              <label className="block text-(--green-deep) font-bold mb-2">
                用戶名稱：
              </label>
              <InputFrame
                type="text"
                name="username"
                value={newUser.username}
                onChange={handleNewUserChange}
                placeholder="請輸入用戶名稱"
                borderColor="var(--green-vivid)"
              />
            </div>

            <div>
              <label className="block text-(--green-deep) font-bold mb-2">
                信箱：
              </label>
              <InputFrame
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleNewUserChange}
                placeholder="請輸入郵箱"
                borderColor="var(--green-vivid)"
              />
            </div>

            <div>
              <label className="block text-(--green-deep) font-bold mb-2">
                帳號：
              </label>
              <InputFrame
                type="text"
                name="accountNumber"
                value={newUser.accountNumber}
                onChange={handleNewUserChange}
                placeholder="例如: YY001"
                borderColor="var(--green-vivid)"
              />
            </div>
          </div>

          {/* 右侧 - 角色和权限设置 */}
          <div className="space-y-4">
            <div>
              <label className="block text-(--green-deep) font-bold mb-2">
                角色：
              </label>
              <select
                name="role"
                value={newUser.role}
                onChange={handleNewUserChange}
                className="w-full p-3 border-3 border-(--green-vivid) rounded-md text-lg">
                <option value="user">使用者</option>
                <option value="manager">管理人員</option>
                <option value="admin">系統管理人員</option>
              </select>
            </div>
            <div className="mt-4">
              <label className="block text-(--green-deep) font-bold mb-2 text-lg">
                權限：
              </label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.keys(newUser.permissions).map((permission) => {
                  const isDisabled =
                    newUser.role === "admin" || newUser.role === "manager";
                  return (
                    <label
                      key={permission}
                      className={`flex items-center gap-3 p-2 rounded transition-colors ${
                        isDisabled
                          ? "cursor-not-allowed opacity-60 bg-gray-100"
                          : "cursor-pointer hover:bg-gray-50"
                      }`}>
                      <input
                        type="checkbox"
                        checked={newUser.permissions[permission]}
                        onChange={() => handlePermissionChange(permission)}
                        disabled={isDisabled}
                        className="w-5 h-5"
                      />
                      <span className="text-lg">
                        {PERMISSION_MAP[permission] || permission}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* 编辑用户模态框 */}
      <Modal
        showModal={showEditModal}
        title="編輯使用者"
        onClose={() => setShowEditModal(false)}
        onConfirm={handleUpdateUser}
        width="50vw"
        height="auto">
        <div className="grid grid-cols-2 gap-6 py-4">
          {/* 左侧 - 基本信息 */}
          <div className="space-y-4">
            <div>
              <label className="block text-(--green-deep) font-bold mb-2">
                用戶名稱：
              </label>
              <InputFrame
                type="text"
                name="username"
                value={editingUser.username}
                onChange={handleEditUserChange}
                placeholder="請輸入用戶名稱"
                borderColor="var(--green-vivid)"
              />
            </div>

            <div>
              <label className="block text-(--green-deep) font-bold mb-2">
                信箱：
              </label>
              <InputFrame
                type="email"
                name="email"
                value={editingUser.email}
                onChange={handleEditUserChange}
                placeholder="請輸入郵箱"
                borderColor="var(--green-vivid)"
              />
            </div>

            <div>
              <label className="block text-(--green-deep) font-bold mb-2">
                帳號：
              </label>
              <InputFrame
                type="text"
                name="accountNumber"
                value={editingUser.accountNumber}
                onChange={handleEditUserChange}
                placeholder="例如: YY001"
                borderColor="var(--green-vivid)"
              />
            </div>
          </div>

          {/* 右侧 - 角色和权限设置 */}
          <div className="space-y-4">
            <div>
              <label className="block text-(--green-deep) font-bold mb-2">
                角色：
              </label>
              <select
                name="role"
                value={editingUser.role}
                onChange={handleEditUserChange}
                className="w-full p-3 border-3 border-(--green-vivid) rounded-md text-lg">
                <option value="user">使用者</option>
                <option value="manager">管理人員</option>
                <option value="admin">系統管理人員</option>
              </select>
            </div>
            <div className="mt-4">
              <label className="block text-(--green-deep) font-bold mb-2 text-lg">
                權限：
              </label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.keys(editingUser.permissions).map((permission) => {
                  const isDisabled =
                    editingUser.role === "admin" ||
                    editingUser.role === "manager";
                  return (
                    <label
                      key={permission}
                      className={`flex items-center gap-3 p-2 rounded transition-colors ${
                        isDisabled
                          ? "cursor-not-allowed opacity-60 bg-gray-100"
                          : "cursor-pointer hover:bg-gray-50"
                      }`}>
                      <input
                        type="checkbox"
                        checked={editingUser.permissions[permission]}
                        onChange={() => handleEditPermissionChange(permission)}
                        disabled={isDisabled}
                        className="w-5 h-5"
                      />
                      <span className="text-lg">
                        {PERMISSION_MAP[permission] || permission}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* 下載紀錄模态框 */}
      <Modal
        showModal={showDownloadModal}
        title="下載紀錄"
        onClose={() => {
          setShowDownloadModal(false);
          setDownloadTimeRange({ startTime: "", endTime: "" });
          setDownloadUserId(null);
        }}
        onConfirm={handleDownloadLogs}
        width="40vw"
        height="auto">
        <div className="py-4">
          <p className="text-center text-gray-700 mb-6">
            請輸入下載紀錄時間區間
          </p>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-(--green-deep) font-bold mb-2">
                起始年/月/日時間：
              </label>
              <InputFrame
                type="datetime-local"
                name="startTime"
                value={downloadTimeRange.startTime}
                onChange={(e) =>
                  setDownloadTimeRange((prev) => ({
                    ...prev,
                    startTime: e.target.value,
                  }))
                }
                borderColor="var(--green-vivid)"
                className="w-full"
              />
            </div>

            <span className="text-2xl text-gray-400 mt-8">~</span>

            <div className="flex-1">
              <label className="block text-(--green-deep) font-bold mb-2">
                結束年/月/日時間：
              </label>
              <InputFrame
                type="datetime-local"
                name="endTime"
                value={downloadTimeRange.endTime}
                onChange={(e) =>
                  setDownloadTimeRange((prev) => ({
                    ...prev,
                    endTime: e.target.value,
                  }))
                }
                borderColor="var(--green-vivid)"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default UserManage;
