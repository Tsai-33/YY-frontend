import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { loginSuccess } from "@/redux/reducer/reducerUser";
import { login as loginAPI } from "../api/authService";
import InputFrame from "@/components/common/input/inputFrame";
import Loading from "@/components/common/loading/loading";
import Alert from "@/components/common/alert/alert";
import Link from "next/link";
import ActionBtn from "@/components/common/btns/actionBtn";
import { initWorkstation } from "@/redux/reducer/reducerWorkStations";

export default function Login() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({
    email: "", // 支持Email或AccountNumber
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 如果已登录，重定向到工作站页面
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/workspace");
    }
  }, [isAuthenticated, router]);

  // ✅ Kiểm tra lý do logout (session hết hạn, auto logout, v.v.)
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Kiểm tra query params
      const reason = router.query.reason;
      const logoutReason = sessionStorage.getItem("logoutReason");

      if (reason || logoutReason) {
        sessionStorage.removeItem("logoutReason");

        let title = "登入已過期";
        let text = "請重新登入";

        switch (reason || logoutReason) {
          case "session_expired":
            title = "Session 已過期";
            text = "系統已自動登出。請重新登入";
            break;
          case "token_expired":
            title = "Token 已過期";
            text = "登入憑證已過期，請重新登入";
            break;
          case "unauthorized":
            title = "未授權";
            text = "您沒有權限訪問該資源，請重新登入";
            break;
          default:
            title = "需要重新登入";
            text = "請重新登入以繼續使用";
        }

        // Hiển thị alert
        Alert({
          title,
          text,
          icon: "info",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "確定",
        });

        // Clear query params để không lặp lại alert khi refresh
        router.replace("/auth/login", undefined, { shallow: true });
      }
    }
  }, [router.query]);

  // 处理输入变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 处理登录
  const handleLogin = async (e) => {
    e.preventDefault();

    // 验证输入
    if (!formData.email || !formData.password) {
      Alert({
        title: "錯誤",
        text: "請輸入帳號（帳號編號或郵箱）和密碼",
        confirmButtonColor: "#b32627",
      });
      return;
    }

    setLoading(true);

    try {
      // 调用登录API
      const response = await loginAPI(formData.email, formData.password);

      if (response.success) {
        const { user, accessToken, refreshToken } = response.data;

        // 保存到Redux
        dispatch(
          loginSuccess({
            user,
            accessToken,
            refreshToken,
          })
        );

        dispatch(initWorkstation(user.ipAddress));

        // 显示成功消息
        Alert({
          title: "登入成功",
          text: `歡迎回來，${user.username}！`,
          timer: 1500,
          showConfirm: false,
          confirmButtonColor: "#008b48",
        });

        // 跳转到工作站页面
        setTimeout(() => {
          router.push("/workspace");
        }, 1500);
      } else {
        Alert({
          title: "登入失敗",
          text: response.message || "登入失敗，請重試",
          confirmButtonColor: "#b32627",
        });
      }
    } catch (error) {
      console.warn("登录错误:", error);
      Alert({
        title: "登入失敗",
        text: error.response?.data?.message || "帳號或密碼錯誤",
        confirmButtonColor: "#b32627",
      });
    } finally {
      setLoading(false);
    }
  };

  // 按Enter键登录
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin(e);
    }
  };

  //
  const handleWriteIn = (email, password) => {
    setFormData({
      email: email,
      password: password,
    });
  };

  return (
    <>
      {loading && <Loading />}

      <div className="flex items-center justify-center flex-1 min-h-0">
        <div className="w-full max-w-md">
          {/* 登录表单 */}
          <div>
            {/* 标题 */}
            <h2 className="mb-8 text-center">
              登入 Login
              {/* 暫時使用--- 上線後刪除 */}
              <ActionBtn text="測帳密1" variant="yellow" className="absolute top-0 left-50" onClick={() => handleWriteIn("ADMIN001", "admin")} />
              <ActionBtn text="測帳密2" variant="rose" className="absolute top-0 left-100" onClick={() => handleWriteIn("ADMIN002", "admin")} />
              <ActionBtn text="測帳密3" variant="violet" className="absolute top-0 left-150" onClick={() => handleWriteIn("ADMIN003", "admin")} />
              {/* 暫時使用--- 上線後刪除 */}
            </h2>

            <form onSubmit={handleLogin}>
              {/* 帳號输入 (支持帳號編號或郵箱) */}
              <div className="pb-8">
                <InputFrame
                  type="text"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="帳號 Account Number"
                  className="w-full h-[70px] py-4 pl-6 pr-14 rounded-2xl bg-white shadow-sm border-none text-lg outline-none
                              transition-all duration-200
                              
                              placeholder:text-slate-600 
                              placeholder:font-medium 
                              placeholder:opacity-100
                              
                              focus:placeholder:text-black
                              focus:placeholder:font-normal
                              focus:placeholder:opacity-30
                  "
                />
              </div>
              {/* 密码输入 */}
              <div className="relative">
                <InputFrame
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="密碼 Password"
                  borderColor="none"
                  className="w-full h-[70px] py-4 pl-6 pr-14 rounded-2xl bg-white shadow-sm border-none text-lg outline-none
                              transition-all duration-200
                              
                              placeholder:text-slate-600 
                              placeholder:font-medium 
                              placeholder:opacity-100
                              
                              focus:placeholder:text-black
                              focus:placeholder:font-normal
                              focus:placeholder:opacity-30
                              "
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-4 top-1/2 -translate-y-1/2 text-black hover:text-gray-500 transition-colors ${showPassword ? "mt-1" : "mt-2"}`}>
                  {showPassword ? <span className="icon-openEye text-4xl"></span> : <span className="icon-closeEye text-4xl"></span>}
                </button>
              </div>
              {/* 忘记密码链接 - 右对齐 */}
              <div className="flex justify-end pr-2 pt-2 pb-8">
                <Link href="/auth/forgot-password" className="text-(--green-deep) hover:text-(--green-fresh) text-sm transition-colors">
                  忘記密碼 Forgot your password?
                </Link>
              </div>

              {/* 登录按钮 - 確定 */}
              <ActionBtn text="確定" type="submit" disabled={loading} className="w-full py-3 bg-(--primary-color) hover:bg-(--green-fresh) text-white disabled:opacity-50 disabled:cursor-not-allowed" />
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
