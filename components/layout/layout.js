import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import Link from "next/link";
import ActionBtn from "../common/btns/actionBtn";
import { logout } from "@/redux/reducer/reducerUser";
import { logout as logoutAPI } from "@/pages/api/authService";
import ProtectedRoute from "../common/ProtectedRoute";

// 控制面板

// 頁面標題配置
const PAGE_TITLES = {
  "/workspace": "工作站工作列表",
  "/outbound": "揀貨出庫",
  "/inbound": "補貨上架",
  "/warehousing": "儲位調整",
  "/warehousing/shelfInventory": "貨架位置調整",
  "/warehousing/binInventory": "儲位位置調整",
  "/warehousing/shelfBinAdjust": "貨架儲位調整",
  "/shelveSetting": "貨架設定",
  "/shelveSetting/createType": "建立貨架類型",
  "/shelveSetting/typeSettings": "貨架類型設定",
  "/shelveSetting/shelveList": "貨架清單",
  "/inventory": "庫存盤點",
  "/inventory/fullCheck": "全區盤點",
  "/inventory/cycleCheck": "波動盤點",
  "/inventory/abnormalCheck": "異常盤點清單",
  "/packageMaterial": "包材零件",
  "/packageMaterial/stockOut": "包材零件出庫",
  "/packageMaterial/stockIn": "包材零件入庫",
  "/stockQuery": "庫存查詢",
  "/centralpanel": "中央控制面板",
  "/centralpanel/detail": "中控頁面詳細",
  default: "",
};

// 常數定義
const LOGO_PATH = "/common/YY-Logo.svg";

export default function Layout({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isAuthenticated, userName } = useSelector((state) => state.user);

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

  return (
    <div className="flex flex-col h-screen">
      {/* 頂部導航欄 */}
      <header className="shrink-0 h-19 w-full max-w-full px-4 bg-white flex items-center justify-between">
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
                const role = typeof window !== "undefined" ? localStorage.getItem('role') : null;
                if (role !== "user") {
                  return (
                    <Link href="/usermanage">
                      <span className="text-gray-700 font-medium  cursor-pointer hover:underline">
                      <i className="icon-user"></i>{userName}
                      </span>
                    </Link>
                  );
                }
                return (
                  <span className="text-gray-700 font-medium text-2xl">
                    <i className="icon-user "></i> {userName}
                  </span>
                );
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
    </div>
  );
}