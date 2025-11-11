import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { resetUser } from "@/redux/reducer/reducerUser";
import Link from "next/link";
import ActionBtn from "../common/btns/actionBtn";

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
const COMPANY_NAME = "優好生活，呵護健康  Live better,stay healthy";
const LOGO_PATH = "/common/YOHOlogo1.svg";

export default function Layout({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();
  // const isInventoryPage = router.pathname.startsWith("/inventory");

  const path = router.pathname;

  const [showNavbar, setShowNavbar] = useState(true);

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

  useEffect(() => {
    setShowNavbar(router.pathname !== "/" && router.pathname !== "/login");
  }, [router.pathname]);

  const getCurrentPageTitle = () => {
    return PAGE_TITLES[router.pathname] || PAGE_TITLES.default;
  };

  // 不顯示功能列
  const excludedPaths = ["/workspace"];

  // ========== 驗證身分 ==========
  const noAuthPaths = ["/", "/login"];

  useEffect(() => {
    if (noAuthPaths.includes(router.pathname)) return;
    fetchUser();
  }, [router.pathname]);

  const fetchUser = async () => {
    try {
      const res = await checkUser();
      if (res.data.success) {
        console.log("驗證身分成功");
      }
    } catch (err) {
      console.log("驗證身分失敗", err);

      const token = localStorage.getItem("token");
      if (token) {
        try {
          // 解析 JWT payload
          const base64Url = token.split(".")[1];
          if (base64Url) {
            // 將 Base64URL 轉成標準 Base64
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split("")
                .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
                .join("")
            );
            const payload = JSON.parse(jsonPayload);

            const now = Math.floor(Date.now() / 1000);
            if (payload.exp < now) {
              dispatch(resetUser());
              console.log("清除 token 資料");
            }
          }
        } catch (decodeError) {
          dispatch(resetUser());
        }
      }

      router.push("/login");
    }
  };

  if (!showNavbar) {
    return <>{children}</>;
  }

  if (router.pathname === "/centralpanel" || router.pathname === "/centralpanel/detail") {
    return (
      <div className="min-h-screen">
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* 頂部導航欄 */}
      <header className="shrink-0 w-full h-30 max-w-full px-12 flex items-center justify-between nav">
        {/* Logo */}
        <Link href="/">
          <img src={LOGO_PATH} alt="YOHO Logo" className="h-16 w-auto object-contain" />
        </Link>
        {/* 導航區域 */}
        <nav className="w-[33vw] flex items-center justify-between">
          {!excludedPaths.includes(router.pathname)? (
            <Link href="/workspace">
              <ActionBtn icon="icon-setting" text="功能列表" variant="darkBlue" />
            </Link>
          ) : (
            <div className="w-[10px]" />
          )}
          <h1 className="text-[length:var(--large-fontSize)] text-[var(--blue-dark)] font-semibold">{getCurrentPageTitle()}</h1>
        </nav>
      </header>
      {/* 主內容區域 */}
      <main className={`flex-1 flex flex-col gap-2 mt-4 md:mt-6 xl:mt-8 mx-5 xl:mx-12 relative`}>{children}</main>
      {/* 底部公司名稱 */}
      <footer className="shrink-0 px-12 flex justify-end items-end text-[length:var(--small-fontSize)] leading-[var(--middle-lineHeight)] font-bold text-[var(--blue-dark)]">{COMPANY_NAME}</footer>

      {/* 依照路由渲染不同面板 */}
      {/* {path.startsWith("/outbound") && <OutboundManager isOpen={open} onClose={() => setOpen(false)} />} */}
      {/* {path.startsWith("/inventory") && <ControlPanel isOpen={open} onClose={() => setOpen(false)} />} */}
      {/* {path.startsWith("/inbound") && <InboundManager isOpen={open} onClose={() => setOpen(false)} />} */}
    </div>
  );
}
