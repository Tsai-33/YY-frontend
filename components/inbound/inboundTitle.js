import React from "react";
import { useSelector } from "react-redux";
import PageHeader from "../common/pageHeader/pageHeader";

export default function InboundTitle() {
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const currentStationSafe = currentStation || stations?.[0] || "";
  const { step, orderCode } = useSelector((s) => s.inbound[currentStationSafe] || {});

  return (
    <>
      {step === 1 && <PageHeader title={`請掃描入倉單條碼，點擊左側清單內入倉單號`} close={false} backTo="/workspace" />}
      {orderCode && step === 2 && <PageHeader title={`檢視完入倉資訊確認沒問題，請點擊確定按鈕`} close={false} backTo="/workspace"  />}
      {step === 3 && <PageHeader title={`貨架到站點，請掃外箱條碼或點擊介面清單方框確定已將產品放上貨架`} close={true} />}
      {step === 4 && <PageHeader title={`上架完請點擊退回貨架按鈕`} close={true} />}
      {step === 5 && <PageHeader title={`等待無人車將貨架搬回庫區`} close={true} />}
    </>
  );
}
