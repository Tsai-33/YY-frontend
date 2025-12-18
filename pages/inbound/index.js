import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import ActionBtn from "@/components/common/btns/actionBtn";
import { setCurrentStation } from "@/redux/reducer/reducerWorkStations";
import { initStation, } from "@/redux/reducer/reducerInbound";
import LoadingShelf from "@/components/common/loading/loading-shelf";
import Loading from "@/components/common/loading/loading";
import InboundTitle from "@/components/inbound/inboundTitle";
import InboundContext from "@/components/inbound/inboundContext";

export default function Inbound() {
  const dispatch = useDispatch();
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const [loading, setLoading] = useState(false);

  // 目前選擇的工作站
  const handleSwitchStation = (station) => {
    dispatch(setCurrentStation(station));
  };
  const currentStationSafe = currentStation || stations?.[0] || "";
  const { orderList, lackStation } = useSelector((s) => s.inbound);
  const { step, screen, orderCode, order, shelf, shelfItem, selected, waveNo } = useSelector((s) => s.inbound[currentStationSafe] || {});

  // =========== 生成站點
  useEffect(() => {
    // 一次性初始化所有站台
    stations.forEach((s) => {
      dispatch(initStation(s));
    });
  }, [stations]);

  // =========== 測試單亂數產生
  const handleTest = () => {
    // ===== 前綴隨機 =====
    const prefixes = ["M560", "M540"];
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
    barCodeRef.current.focus();
  };
  return (
    <>
      <InboundTitle />
      {/* <InboundContext /> */}
      {/* 底部按鈕區域 */}
      <div className="w-full flex justify-between z-15">
        {stations.map((station, i) => (
          <ActionBtn key={i} text={station} variant={lackStation?.includes(station) ? "orange" : "green"} disabled={currentStation === station ? true : false} onClick={() => handleSwitchStation(station)} />
        ))}
      </div>
      {/* loading */}
      {screen === "loading" && <LoadingShelf />}
      {loading && <Loading />}

      {/* 測試按鈕 */}
      {step <= 2 && <ActionBtn text="測試用-產生單據" className="absolute top-0 right-50" variant="yellow" onClick={handleTest} />}
    </>
  );
}
