import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import ActionBtn from "@/components/common/btns/actionBtn";
import { setCurrentStation } from "@/redux/reducer/reducerWorkStations";
import LoadingShelf from "@/components/common/loading/loading-shelf";
import Loading from "@/components/common/loading/loading";
import TransferTitle from "@/components/transfer/transferTitle";
import TransferContext from "@/components/transfer/transferContext";
import { initStation } from "@/redux/reducer/reducerTransfer";

/**
 * 過帳主頁面組件 (Transfer Component)
 * 負責處理工作站切換、條碼掃描上下文以及測試單據生成
 * @returns {JSX.Element}
 */

export default function Transfer() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const barCodeRef = useRef(null);

  const { stations, currentStation } = useSelector((s) => s.workstation);
  const currentStationSafe = currentStation || stations?.[0] || "";
  const { step } = useSelector((s) => s.transfer);
  const { screen } = useSelector((s) => s.transfer[currentStationSafe] || {});

  /**
   * 安全取得當前工作站，若無則預設取第一個
   * 使用 useMemo 優化，避免每次 re-render 重新計算
   */


  /**
   * 切換當前工作站站點
   * @param {string} station - 目標站點名稱
   */
  const handleSwitchStation = (station) => {
    dispatch(setCurrentStation(station));
  };

  /**
   * 初始化所有工作站數據狀態
   * 當站點清單更新時觸發
   */
  useEffect(() => {
    stations.forEach((s) => {
      dispatch(initStation(s));
    });
  }, [stations]);

  /**
   * 測試用：自動產生隨機測試單號 (SN)
   * 格式範例：F120-1130120001 (前綴-民國年月日序號)
   */
  const handleTest = () => {
    // ===== 前綴隨機 =====
    const prefixes = ["F120"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

    // ===== 民國年月日 =====
    const date = new Date();
    const year = date.getFullYear() - 1911;
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    // ===== 3 碼序號 =====
    const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");

    const passSN = `${prefix}-${year}${month}${day}${seq}`;

    barCodeRef.current.value = passSN;
  };
    // 此處到時候要刪除
    const [isDebugVisible, setIsDebugVisible] = useState(false);
    useEffect(() => {
      const handleKeyDown = (event) => {
        // 檢查是否同時按下 Alt 鍵和 F3 鍵
        if (event.altKey && event.key === "F3") {
          event.preventDefault(); // 防止觸發瀏覽器預設行為
          setIsDebugVisible((prev) => !prev);
        }
      };
  
      window.addEventListener("keydown", handleKeyDown);
  
      // 組件卸載時移除監聽器，避免記憶體洩漏
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, []);

  return (
    <>
      <TransferTitle />
      <TransferContext barCodeRef={barCodeRef} setLoading={setLoading} />
      <div className="w-full flex justify-between gap-4 z-20">
        {stations.map((station, i) => (
          <ActionBtn key={i} text={station} variant={i === 0 ? "blue" : "green"} className="flex-1" disabled={currentStation === station ? true : false} onClick={() => handleSwitchStation(station)} />
        ))}
      </div>
      {screen === "loading" && <LoadingShelf />}
      {loading && <Loading />}
      {/* 測試按鈕 */}
      {isDebugVisible && step <= 2 && <ActionBtn text="測試用-產生單據" className="absolute top-0 right-50 gle" variant="yellow" onClick={handleTest} />}
    </>
  );
}
