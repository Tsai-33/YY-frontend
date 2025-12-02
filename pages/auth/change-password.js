import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { changePassword as changePasswordAPI } from "../api/authService";
import InputFrame from "@/components/common/input/inputFrame";
import ActionBtn from "@/components/common/btns/actionBtn";
import Loading from "@/components/common/loading/loading";
import Alert from "@/components/common/alert/alert";
import PageHeader from "@/components/common/pageHeader/pageHeader";

export default function ChangePassword() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, userName } = useSelector(
    (state) => state.user
  );

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  // 检查是否已登录
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

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

  // 处理修改密码
  const handleChangePassword = async (e) => {
    e.preventDefault();

    // 验证输入
    if (
      !formData.oldPassword ||
      !formData.newPassword ||
      !formData.confirmPassword
    ) {
      Alert({
        title: "錯誤",
        text: "請填寫所有字段",
        confirmButtonColor: "#b32627",
      });
      return;
    }

    // 验证新密码强度
    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      Alert({
        title: "密碼強度不足",
        text: passwordError,
        confirmButtonColor: "#b32627",
      });
      return;
    }

    // 验证两次密码是否一致
    if (formData.newPassword !== formData.confirmPassword) {
      Alert({
        title: "錯誤",
        text: "新密碼和確認密碼不一致",
        confirmButtonColor: "#b32627",
      });
      return;
    }

    // 验证新旧密码不能相同
    if (formData.oldPassword === formData.newPassword) {
      Alert({
        title: "錯誤",
        text: "新密碼不能與舊密碼相同",
        confirmButtonColor: "#b32627",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await changePasswordAPI(
        formData.oldPassword,
        formData.newPassword,
        formData.confirmPassword
      );

      if (response.success) {
        Alert({
          title: "成功",
          text: "密碼修改成功！",
          confirmButtonColor: "#008b48",
          onConfirm: () => {
            // 跳转到工作站页面
            router.push("/workspace");
          },
        });
      } else {
        Alert({
          title: "修改失敗",
          text: response.message || "修改密碼失敗，請重試",
          confirmButtonColor: "#b32627",
        });
      }
    } catch (error) {
      console.error("修改密码错误:", error);
      Alert({
        title: "修改失敗",
        text: error.response?.data?.message || "舊密碼錯誤或網絡異常",
        confirmButtonColor: "#b32627",
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

  return (
    <>
      {loading && <Loading />}

      <div className="flex flex-col h-full">
        {/* 页面标题 */}
        <PageHeader title="修改密碼" backTo="/workspace" />

        {/* 主内容 */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">

            {/* 修改密码表单 */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-[var(--green-vivid)]">
              <h2 className="text-3xl font-bold text-[var(--green-deep)] mb-2 text-center">
                修改密碼
              </h2>
              <p className="text-center text-gray-600 mb-6">
                {userName && `用戶：${userName}`}
              </p>

              <form onSubmit={handleChangePassword} className="space-y-6">
                {/* 旧密码 */}
                <div>
                  <label
                    htmlFor="oldPassword"
                    className="block text-[var(--green-deep)] font-bold mb-2 text-lg">
                    舊密碼
                  </label>
                  <div className="relative">
                    <InputFrame
                      type={showPasswords.old ? "text" : "password"}
                      name="oldPassword"
                      id="oldPassword"
                      value={formData.oldPassword}
                      onChange={handleChange}
                      placeholder="請輸入舊密碼"
                      borderColor="var(--green-vivid)"
                      className="text-lg pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("old")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--green-deep)] hover:text-[var(--green-vivid)] transition-colors">
                      <span className="text-2xl">
                        {showPasswords.old ? "👁️" : "👁️‍🗨️"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* 新密码 */}
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-[var(--green-deep)] font-bold mb-2 text-lg">
                    新密碼
                  </label>
                  <div className="relative">
                    <InputFrame
                      type={showPasswords.new ? "text" : "password"}
                      name="newPassword"
                      id="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="請輸入新密碼"
                      borderColor="var(--green-vivid)"
                      className="text-lg pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("new")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--green-deep)] hover:text-[var(--green-vivid)] transition-colors">
                      <span className="text-2xl">
                        {showPasswords.new ? "👁️" : "👁️‍🗨️"}
                      </span>
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    密碼要求：至少8位，包含大小寫字母和數字
                  </p>
                </div>

                {/* 确认密码 */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-[var(--green-deep)] font-bold mb-2 text-lg">
                    確認新密碼
                  </label>
                  <div className="relative">
                    <InputFrame
                      type={showPasswords.confirm ? "text" : "password"}
                      name="confirmPassword"
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="請再次輸入新密碼"
                      borderColor="var(--green-vivid)"
                      className="text-lg pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("confirm")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--green-deep)] hover:text-[var(--green-vivid)] transition-colors">
                      <span className="text-2xl">
                        {showPasswords.confirm ? "👁️" : "👁️‍🗨️"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* 按钮组 */}
                <div className="flex gap-4 pt-4">
                  <ActionBtn
                    text="取消"
                    variant="rose"
                    onClick={() => router.push("/workspace")}
                    className="flex-1 py-4 text-xl justify-center"
                  />
                  <ActionBtn
                    text="確認修改"
                    variant="green"
                    onClick={handleChangePassword}
                    disabled={loading}
                    className="flex-1 py-4 text-xl justify-center"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

