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
      {step === 3 && <PageHeader title={`貨架到站點後，請點勾選介面左側清單方框將產品放上貨架`} close={true} />}
      {step === 4 && <PageHeader title={`此貨架上架完，請點擊確定上架按鈕`} close={true} />}
      {step === 5 && <PageHeader title={`此入倉單上架完，請點擊入倉單完成按鈕`} close={true} />}
    </>
  );
}
