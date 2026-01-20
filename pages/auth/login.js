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

  // 測試選站 上市後刪掉)
  const [thisStation, setThisStation] = useState("");
  const handleChangeStation = (e) => {
    setThisStation(e.target.value);
  };
  // 測試選站 上市後刪掉)

  // 如果已登录，重定向到工作站页面
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/workspace");
    }
  }, [isAuthenticated, router]);

  // ✅ 檢查登出原因 (session 過期、自動登出等)
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 檢查 query 參數
      const reason = router.query.reason;
      const logoutReason = sessionStorage.getItem("logoutReason");

      if (reason || logoutReason) {
        sessionStorage.removeItem("logoutReason");

        let title = "登入已過期";
        let html = "請重新登入";

        switch (reason || logoutReason) {
          case "session_expired":
            title = "Session 已過期";
            html = "系統已自動登出。請重新登入";
            break;
          case "token_expired":
            title = "Token 已過期";
            html = "登入憑證已過期，請重新登入";
            break;
          case "unauthorized":
            title = "未授權";
            html = "您沒有權限訪問該資源，請重新登入";
            break;
          default:
            title = "需要重新登入";
            html = "請重新登入以繼續使用";
        }

        // 顯示 alert
        Alert({
          title,
          html,
          icon: "info",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "確定",
        });

        // 清除 query 參數以避免刷新時重複顯示 alert
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
        html: "請輸入帳號（帳號編號或郵箱）和密碼",
        confirmButtonColor: "#b32627",
      });
      return;
    }

    setLoading(true);

    try {
      // 调用登录API
      const response = await loginAPI(formData.email, formData.password);
      console.log(response, "user");
      if (response.success) {
        const { user, accessToken, refreshToken } = response.data;

        // 保存到Redux
        dispatch(
          loginSuccess({
            user,
            accessToken,
            refreshToken,
          }),
        );
        // dispatch(initWorkstation(user.ipAddress));
        dispatch(initWorkstation(thisStation ? thisStation : user.ipAddress)); // 暫時使用 上線後砍掉

        // 显示成功消息
        Alert({
          title: "登入成功",
          html: `歡迎回來，${user.username}！`,
          timer: 1500,
          showConfirm: false,
          confirmButtonColor: "#008b48",
        });

        // 跳转到工作站页面
        setTimeout(() => {
          router.push("/workspace");
        }, 1500);
      } else if (response.code === "ALREADY_LOGGED_IN") {
        // ✅ 已在其他設備登入 → 顯示強制登入選項
        Alert({
          title: "帳號已在其他設備登入",
          html: response.message,
          showConfirm: true,
          showCancel: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6",
          confirmButtonText: "強制登入",
          cancelButtonText: "取消",
          onConfirm: async () => {
            // 執行強制登入
            setLoading(true);
            try {
              const forceResponse = await loginAPI(formData.email, formData.password, true);
              if (forceResponse.success) {
                const { user, accessToken, refreshToken } = forceResponse.data;
                dispatch(loginSuccess({ user, accessToken, refreshToken }));
                dispatch(initWorkstation(thisStation ? thisStation : user.ipAddress));

                Alert({
                  title: "登入成功",
                  html: `已登出其他設備，歡迎回來，${user.username}！`,
                  timer: 1500,
                  showConfirm: false,
                  confirmButtonColor: "#008b48",
                });
                setTimeout(() => router.push("/workspace"), 1500);
              } else {
                Alert({
                  title: "登入失敗",
                  html: forceResponse.message || "強制登入失敗",
                  confirmButtonColor: "#b32627",
                });
              }
            } catch (err) {
              Alert({
                title: "登入失敗",
                html: err.response?.data?.message || "強制登入失敗",
                confirmButtonColor: "#b32627",
              });
            } finally {
              setLoading(false);
            }
          },
        });
      } else {
        Alert({
          title: "登入失敗",
          html: response.message || "登入失敗，請重試",
          confirmButtonColor: "#b32627",
        });
      }
    } catch (error) {
      console.warn("登录错误:", error);
      Alert({
        title: "登入失敗",
        html: error.response?.data?.message || "帳號或密碼錯誤",
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
              <div className="max-w-sm absolute top-0 left-200">
                <label for="quantity" class="block text-sm font-medium text-gray-700 mb-1">
                  選擇目前測試站點
                </label>
                <div class="relative">
                  <select
                    id="quantity"
                    className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-gray-700 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-50"
                    onChange={handleChangeStation}
                  >
                    <option value="" disabled hidden>
                      請選擇
                    </option>
                    <option value={process.env.NEXT_PUBLIC_IP_A}>A01~A10</option>
                    <option value={process.env.NEXT_PUBLIC_IP_B}>B01~B05</option>
                    <option value={process.env.NEXT_PUBLIC_IP_C}>C01~C05</option>
                    <option value={process.env.NEXT_PUBLIC_IP_D}>D01~D04</option>
                  </select>

                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
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
