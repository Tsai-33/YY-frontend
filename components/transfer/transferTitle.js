import React from "react";
import { useSelector } from "react-redux";
import PageHeader from "@/components/common/pageHeader/pageHeader";

export default function TransferTitle() {
  const { step } = useSelector((s) => s.transfer);
  return (
    <>
      {step === 1 && <PageHeader title={`請點擊清單內的調撥單號或掃調撥單條碼`} close={false} backTo="/workspace" />}
      {step === 2 && <PageHeader title={`檢視調撥單內容後，請點擊確定 `} close={false} backTo="/workspace" />}
      {step === 3 && <PageHeader title={`貨架到站點，請掃外箱條碼或點擊介面清單方框，標示已將產品放上貨架`} close={true} />}
      {step === 4 && <PageHeader title={`完成調撥後請點擊退回貨架按鈕，將貨架退回庫區`} close={true} />}
    </>
  );
}
