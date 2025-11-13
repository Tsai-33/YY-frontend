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
const LOGO_PATH = "/common/YY-Logo.svg";

export default function Layout({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();

  const path = router.pathname;

  const mainClass =
    path === "/" ? "flex-1" : "flex-1 flex flex-col gap-2 my-5 mx-4 relative";

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
    </div>
  );
}
