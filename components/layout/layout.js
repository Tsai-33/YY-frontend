import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import Link from "next/link";
import ActionBtn from "../common/btns/actionBtn";
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

  const path = router.pathname;

  const mainClass =
    path === "/" ? "flex-1" : "flex-1 flex flex-col gap-2 my-5 mx-4 relative";

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
      <header className="shrink-0 h-19 w-full max-w-full px-4 bg-white flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <img
            src={LOGO_PATH}
            alt="YOHO Logo"
            className="h-12 w-auto object-contain"
          />
        </Link>
      </header>
      {/* 主內容區域 */}
      <main className={mainClass}>{children}</main>

      {/* 依照路由渲染不同面板 */}
      {path.startsWith("/inbound") && (
        <InboundManager isOpen={open} onClose={() => setOpen(false)} />
      )}
      {path.startsWith("/outboundExternal") && (
        <OutboundExternalManager isOpen={open} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
