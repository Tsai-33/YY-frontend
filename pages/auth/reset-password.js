import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { resetPassword as resetPasswordAPI } from "../api/authService";
import InputFrame from "@/components/common/input/inputFrame";
import Loading from "@/components/common/loading/loading";
import Alert from "@/components/common/alert/alert";
import Link from "next/link";

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });
  const [tokenValid, setTokenValid] = useState(true);

  // 检查token是否存在
  useEffect(() => {
    if (router.isReady && !token) {
      setTokenValid(false);
      Alert({
        title: "錯誤",
        html: "無效的重置鏈接",
        confirmButtonColor: "#b32627",
        onConfirm: () => {
          router.push("/auth/login");
        },
      });
    }
  }, [router.isReady, token, router]);

  // 处理输入变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 验证密码强度
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (password.length < minLength) {
      return "密碼至少需要8個字符";
    }
    if (!hasUpperCase) {
      return "密碼必須包含至少一個大寫字母";
    }
    if (!hasLowerCase) {
      return "密碼必須包含至少一個小寫字母";
    }
    if (!hasNumber) {
      return "密碼必須包含至少一個數字";
    }
    return null;
  };

  // 处理重置密码
  const handleResetPassword = async (e) => {
    e.preventDefault();

    // 验证输入
    if (!formData.newPassword || !formData.confirmPassword) {
      Alert({
        title: "錯誤",
        html: "請填寫所有字段",
        confirmButtonColor: "#b32627",
      });
      return;
    }

    // 验证密码强度
    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      Alert({
        title: "密碼強度不足",
        html: passwordError,
        confirmButtonColor: "#b32627",
      });
      return;
    }

    // 验证两次密码是否一致
    if (formData.newPassword !== formData.confirmPassword) {
      Alert({
        title: "錯誤",
        html: "兩次輸入的密碼不一致",
        confirmButtonColor: "#b32627",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await resetPasswordAPI(token, formData.newPassword, formData.confirmPassword);

      if (response.success) {
        Alert({
          title: "成功",
          html: "密碼重置成功！請使用新密碼登入",
          confirmButtonColor: "#008b48",
          onConfirm: () => {
            router.push("/auth/login");
          },
        });
      } else {
        Alert({
          title: "重置失敗",
          html: response.message || "密碼重置失敗，請重試",
          confirmButtonColor: "#b32627",
        });
      }
    } catch (error) {
      console.warn("重置密码错误:", error);
      const errorMessage = error.response?.data?.message || "重置鏈接無效或已過期";

      Alert({
        title: "重置失敗",
        html: errorMessage,
        confirmButtonColor: "#b32627",
        onConfirm: () => {
          if (errorMessage.includes("無效") || errorMessage.includes("過期")) {
            router.push("/auth/forgot-password");
          }
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // 切换密码显示
  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (!tokenValid) {
    return null;
  }

  return (
    <>
      {loading && <Loading />}

      <div className="flex items-center justify-center flex-1 min-h-0">
        <div className="w-full max-w-md">
          {/* 表单 */}
          <div>
            <h2 className="text-2xl font-bold text-black mb-8 text-center">設置新密碼 Reset Password</h2>

            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* 新密码 */}
              <div>
                <div className="relative">
                  <InputFrame
                    type={showPasswords.new ? "text" : "password"}
                    name="newPassword"
                    id="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="新密碼 New Password"
                    borderColor=""
                    className="w-full h-[70px] py-4 pl-6 pr-14 rounded-2xl bg-white shadow-sm border-none outline-none
                              transition-all duration-200
                              
                              placeholder:text-slate-600 
                              placeholder:font-medium 
                              placeholder:opacity-100
                              
                              focus:placeholder:text-black
                              focus:placeholder:font-normal
                              focus:placeholder:opacity-30
                              "
                  />
                                <button type="button" onClick={() => togglePasswordVisibility("new")} className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors ${showPasswords.new ? "mt-1" : "mt-2"}`}>
                    {showPasswords.new ? <span className="icon-openEye text-4xl"></span> : <span className="icon-closeEye text-4xl"></span>}
                  </button>
                </div>
              </div>

              {/* 确认密码 */}
              <div>
                <div className="relative">
                  <InputFrame
                    type={showPasswords.confirm ? "text" : "password"}
                    name="confirmPassword"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="確認新密碼 Confirm New Password"
                    borderColor=""
                    className="w-full h-[70px] py-4 pl-6 pr-14 rounded-2xl bg-white shadow-sm border-none outline-none
                              transition-all duration-200
                              
                              placeholder:text-slate-600 
                              placeholder:font-medium 
                              placeholder:opacity-100
                              
                              focus:placeholder:text-black
                              focus:placeholder:font-normal
                              focus:placeholder:opacity-30
                              "
                  />
                  <button type="button" onClick={() => togglePasswordVisibility("confirm")} className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors ${showPasswords.confirm ? "mt-1" : "mt-2"}`}>
                    {showPasswords.confirm ? <span className="icon-openEye text-4xl"></span> : <span className="icon-closeEye text-4xl"></span>}
                  </button>
                </div>
              </div>

              {/* 按钮 */}
              <div className="pt-2">
                <button type="submit" disabled={loading} className="w-full py-3 bg-[#008b48] hover:bg-[#007a3f] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  重置密碼
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
