import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import Link from "next/link";
import ActionBtn from "../common/btns/actionBtn";
import { logout } from "@/redux/reducer/reducerUser";
import { logout as logoutAPI } from "@/pages/api/authService";
import ProtectedRoute from "../common/ProtectedRoute";
import InboundManager from "../inbound/inboundManager";
import OutboundExternalManager from "../outboundExternal/outboundExternalManager";


// 控制面板

// 頁面標題配置
const PAGE_TITLES = {
  "/workspace": "工作站工作列表",
  "/outboundExternal": "銷貨",
  "/outboundInternal": "領用",
  "/shelfTransfer": "理貨",
  "/inbound": "入倉",
  "/stockQuery": "庫存查詢",
  "/transfer": "調撥",
  "/inventory": "盤點",
  default: "",
};

// 常數定義
const LOGO_PATH = "/common/YY-Logo.svg";

export default function Layout({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isAuthenticated, userName, userRole } = useSelector((state) => state.user);

  const path = router.pathname;

  const mainClass =
    path === "/" ? "flex-1" : "flex-1 flex flex-col gap-2 my-5 mx-4 relative";


  // 處理登出
  const handleLogout = async () => {
    try {
      // 調用後端 API (可選)
      await logoutAPI();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // 清除 Redux 和 localStorage
      dispatch(logout());
      // 跳轉到登入頁
      router.push("/auth/login");
    }
  };

  // 處理登入
  const handleLogin = () => {
    router.push("/auth/login");
  };


  // ====== 控制面板 =====
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const listener = (e) => {
      if (e.key === "F2") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* 頂部導航欄 */}
      <header className="shrink-0 h-19 w-full max-w-full px-4 bg-white flex items-center justify-between z-20">
        {/* Logo */}
        <Link href="/">
          <img
            src={LOGO_PATH}
            alt="YOHO Logo"
            className="h-12 w-auto object-contain"
          />
        </Link>

        {/* 登入/登出按鈕 */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {userName && (() => {
                const role = userRole;
                if (role !== "user") {
                  return (
                    <Link href="/usermanage">
                      <span className="text-gray-700 font-medium cursor-pointer hover:underline">
                      <i className="icon-user"></i>{userName}
                      </span>
                    </Link>
                  );
                }else{
                  return (
                    <span className="text-gray-700 font-medium">
                      <i className="icon-user "></i>{userName}
                    </span>
                  );  
                }
              })()}
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-red-600 font-medium transition-colors cursor-pointer"
              >
                登出 Logout
              </button>
            </>
          ) : (
            <button
              onClick={handleLogin}
              className="text-gray-700 hover:text-[var(--green-vivid)] font-medium transition-colors cursor-pointer"
            >
              登入 Login
            </button>
          )}
        </div>
      </header>
      {/* 主內容區域 */}
      <main className={mainClass}>
        <ProtectedRoute>{children}</ProtectedRoute>
      </main>

      {/* 依照路由渲染不同面板 */}
      {path.startsWith("/inbound") && (
        <InboundManager isOpen={open} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}