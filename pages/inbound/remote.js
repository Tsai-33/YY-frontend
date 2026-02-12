"use client";

import React, { useState, useEffect, useRef } from "react";
import { getOrderWave, getStationStatus } from "../api";
import { selectTask } from "@/components/taskFunction";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { logout } from "@/redux/reducer/reducerUser";
import { logout as logoutAPI } from "@/pages/api/authService";

export default function Remote() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [status, setStatus] = useState("IDLE"); // IDLE, LOADING, OK, NG
  const [station, setStation] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [barCode, setBarCode] = useState("");
  const barCodeRef = useRef(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [stationStatuses, setStationStatuses] = useState({});

  // 測試時我們可以暫時關閉「強制聚焦」，方便您點擊輸入框
  useEffect(() => {
    barCodeRef.current?.focus();
  }, [status]);

  const fetchStationStatus = async () => {
    try {
      const res = await getStationStatus();
      if (res?.data?.success) {
        setStationStatuses(res?.data?.data);
      }
    } catch (err) {
      console.warn("自動更新站點狀態失敗");
    }
  };

  // 每 10 秒自動更新一次
  useEffect(() => {
    fetchStationStatus(); // 初始抓取
    const timer = setInterval(fetchStationStatus, 10000);
    return () => clearInterval(timer); // 卸載時清除
  }, []);

  const addHistory = (barcode, status, station) => {
    const newLog = {
      time: new Date().toLocaleTimeString(),
      barcode,
      status,
      station: station || "N/A",
    };
    // 保留最近 10 筆
    setScanHistory((prev) => [newLog, ...prev].slice(0, 10));
  };

  const handleProcessScan = async (e) => {
    e.preventDefault();

    // 1. 取得並清理字串
    const barCode = barCodeRef.current.value.trim().toUpperCase();

    // 2. 基本防呆
    if (!barCode) return;

    // 3. 檢查字元 (偵測中文字、全形符號)
    if (/[^\x00-\xff]/.test(barCode)) {
      setStatus("NG");
      setErrorMsg("偵測到非預期字元，請確保為英文輸入模式");
      barCodeRef.current.value = ""; // 清空輸入框
      return;
    }

    // 4. 通過檢查，開始呼叫後端 API
    setStatus("LOADING");
    try {
      const taskRes = await selectTask({ stations: "A01" });

      let canProceed = false;
      if (taskRes?.success) {
        // 檢查是否含有 inbound 或是空白的狀態，代表該站點目前可作業
        const hasTask = taskRes.data?.data?.some(
          (item) => item.location === "inbound" || item.location === "",
        );

        if (hasTask) {
          canProceed = true;
        } else {
          // 站點被佔用中
          setErrorMsg("站點 A01 有其他項目正在進行中，請稍候再試");
          setStatus("NG");
          return; // 中斷流程，不執行 getOrderWave
        }
      } else {
        setErrorMsg("無法取得站點狀態，請檢查網路");
        setStatus("NG");
        return;
      }

      if (canProceed) {
        const res = await getOrderWave({ barCode: barCode });
        const targetData = res.data?.data;
        if (targetData?.status === "OK") {
          const rawStations = targetData.station;
          const stationArray = Array.isArray(rawStations)
            ? rawStations
            : [rawStations];

          setStation(stationArray.join(", "));
          setStatus("OK");
          setBarCode("");
          addHistory(barCode, "OK", targetData.station);
          barCodeRef.current.value = "";

          // 成功後 5 秒自動跳回待命 (IDLE)
          setTimeout(() => {
            setStatus("IDLE");
            setStation(""); // 清空站點文字
          }, 5000);
        } else {
          setErrorMsg(targetData?.message || "ERP 驗證失敗");
          setStatus("NG");
          addHistory(barCode, "NG", null);
        }
      }
    } catch (err) {
      console.error("處理出錯:", err);
      setErrorMsg("系統處理錯誤");
      setStatus("NG");
    }
  };

  const handleLogout = async () => {
    try {
      // 調用後端 API (可選)
      await logoutAPI();
    } catch (error) {
      console.warn("Logout API error:", error);
    } finally {
      // 清除 Redux 和 localStorage
      dispatch(logout());
      // 跳轉到登入頁
      router.push("/auth/login");
    }
  };

  return (
    <div
      className={`h-full w-full flex flex-row transition-colors duration-500 ${
        status === "OK"
          ? "bg-green-700"
          : status === "NG"
            ? "bg-red-700"
            : "bg-slate-900"
      }`}>
      {/* 左側：主作業區 (佔 75%) */}
      <div className="flex-3 flex flex-col border-r border-white/10">
        {/* 頂部輸入區 */}
        <div className="p-6 flex justify-center bg-black/10">
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md w-full max-w-md border border-white/20">
            <form onSubmit={handleProcessScan} className="flex gap-2">
              <input
                ref={barCodeRef}
                type="text"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                  }
                }}
                className="flex-1 px-4 py-3 rounded-xl text-xl font-bold bg-white/90 text-slate-900 focus:outline-none"
                placeholder="請掃描單據條碼..."
                disabled={status === "LOADING"}
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all">
                啟動
              </button>
            </form>
          </div>
        </div>

        {/* 中央主結果顯示 */}
        <div className="flex-1 flex flex-col items-center justify-center text-white px-5 h-[380px] overflow-hidden relative">
          {/* 使用動畫容器包裹，確保切換時平滑且不跳動 */}
          <div className="w-full flex flex-col items-center justify-center transition-all duration-300">
            {status === "IDLE" && (
              <div className="text-center opacity-20 animate-in fade-in">
                <p className="text-5xl font-black tracking-[1em] ml-[1em]">
                  READY
                </p>
                <p className="text-xl mt-4">等待掃描中...</p>
              </div>
            )}

            {status === "LOADING" && (
              <div className="flex flex-col items-center animate-in fade-in">
                <div className="w-20 h-20 border-8 border-white/20 border-t-white rounded-full animate-spin"></div>
                <p className="mt-6 text-2xl font-bold tracking-widest">
                  系統查詢中
                </p>
              </div>
            )}

            {status === "OK" && (
              <div className="text-center animate-in zoom-in duration-300 flex flex-col items-center">
                <p className="text-4xl font-bold mb-6 text-green-200">
                  驗證成功
                </p>
                {/* 使用 leading-none 避免行高撐開容器 */}
                <p className="text-[14rem] font-black leading-none drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                  {station}
                </p>
                <div className="w-full max-w-md border-t-2 border-white/30 mt-8 pt-4">
                  <p className="text-4xl font-bold uppercase tracking-[0.5em]">
                    站點作業中
                  </p>
                </div>
              </div>
            )}

            {status === "NG" && (
              <div className="text-center animate-in shake-in duration-200">
                <div className="text-9xl mb-6">⚠️</div>
                <p className="text-5xl font-black mb-6">驗證失敗</p>
                {/* 固定 Error Box 的高度或寬度，防止長文字撐爆 */}
                <div className="text-xl bg-black/40 px-8 py-4 rounded-2xl border border-white/20 max-w-2xl wrap-break-word line-clamp-3">
                  {errorMsg}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部 10 站地圖 (暫時註解 getStationStatus) */}
        <div className="p-6 grid grid-cols-5 gap-4 bg-black/40 backdrop-blur-md">
          {[...Array(9)].map((_, i) => {
            const stationId = `A${(i + 1).toString().padStart(2, "0")}`;
            const currentStatus = stationStatuses[stationId] || "idle"; // 取得忙碌狀態
            const isMatched = station?.includes(
              (i + 1).toString().padStart(2, "0"),
            );

            return (
              <div
                key={i}
                className={`relative ... ${
                  isMatched
                    ? "bg-white text-green-700" // 當前掃描命中
                    : currentStatus === "busy"
                      ? "bg-amber-500/20 text-amber-500 border-amber-500/40" // 忙碌中
                      : "bg-white/5 text-slate-500" // 空閒
                }`}>
                {/* 狀態圓點燈 */}
                <div
                  className={`absolute top-3 right-3 w-3 h-3 rounded-full ${
                    isMatched
                      ? "bg-green-500 animate-ping"
                      : currentStatus === "busy"
                        ? "bg-amber-500 shadow-[0_0_8px_#f59e0b]"
                        : "bg-green-500/20"
                  }`}
                />

                <span className="text-4xl font-black">{i + 1}</span>
                <span className="text-[10px] mt-1 font-bold opacity-40">
                  {currentStatus === "busy" ? "BUSY" : "AVAILABLE"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 右側：作業履歷 (佔 25%) */}
      <div className="w-[25%] bg-slate-950/80 backdrop-blur-2xl flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)] h-full">
        {/* 固定的標頭 - 不會隨滾動消失 */}
        <div className="shrink-0 p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
          <h2 className="text-white font-black tracking-tighter text-xl">
            歷史紀錄
          </h2>
          <span className="bg-white/10 text-white/50 text-xs px-2 py-1 rounded">
            最多10筆
          </span>
        </div>

        {/* 滾動內容區 - 這是防止跑版的關鍵 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide custom-scrollbar">
          {scanHistory.length === 0 ? (
            <div className="h-full flex items-center justify-center text-white/10 italic text-base">
              暫無作業紀錄
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {scanHistory.map((log) => (
                <div
                  key={log.id}
                  className={`shrink-0 p-4 rounded-xl border-l-4 transition-all animate-in slide-in-from-right duration-300 ${
                    log.status === "OK"
                      ? "bg-green-500/5 border-green-500"
                      : "bg-red-500/5 border-red-500"
                  }`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono text-white/40">
                      {log.time}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        log.status === "OK"
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                      }`}>
                      {log.status}
                    </span>
                  </div>
                  <div
                    className="text-white font-mono text-sm truncate mb-1"
                    title={log.barcode}>
                    {log.barcode}
                  </div>
                  {log.status === "OK" && (
                    <div className="text-green-400 font-bold text-sm">
                      ➜ <span className="text-xs opacity-60">Target:</span>{" "}
                      {log.station}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 固定的底部狀態欄 */}
        <button
          type="button"
          onClick={handleLogout}
          className="shrink-0 w-full p-6 bg-red-600/20 hover:bg-red-600 text-white transition-all duration-300 flex items-center justify-center gap-3 border-t border-white/10 group active:scale-95">
          <i className="icon-logout text-xl opacity-70 group-hover:opacity-100"></i>
          <div className="flex flex-col items-start">
            <span className="text-sm font-bold tracking-widest">登出系統</span>
            <span className="text-[10px] opacity-50 uppercase font-mono">
              Logout Session
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
