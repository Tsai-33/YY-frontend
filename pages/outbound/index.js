import React, { useState } from "react";
import OutboundTable from "@/components/outbound/outboundTable";
import { CountAbnormalModal } from "@/components/common/modal/modal-list";
import Alert from "@/components/common/alert/alert";
import PageTitle from "@/components/common/pageTitle";
import { useSelector } from "react-redux";
import ActionBtn from "@/components/common/btns/actionBtn";

export default function Outbound() {
  const currentStep = useSelector((state) => state.page.currentStep);
  return (
    <OutboundTable />
    // <>
    //   <div className="flex justify-between">
    //     <h1 className="sm:text-[length:var(--font-size-6xl)] px-12">入庫</h1>
    //     {currentStep === 1 && <PageTitle title={`請點擊清單內工單單號或訂單單號、掃描工單或訂單條碼、外箱條碼`} />}
    //     {currentStep === 2 && <PageTitle title={`檢視完入庫資訊確認沒問題，請點擊確定按鈕`} />}
    //     {currentStep === 3 && <PageTitle title={`貨架到站點，請掃外箱條碼或點擊介面清單方框確定已將產品放上貨架`} />}
    //     {currentStep === 4 && <PageTitle title={`上架完請點擊退回貨架按鈕`} />}
    //     {currentStep === 5 && <PageTitle title={`等待無人車將貨架搬回庫區`} />}
    //     <ActionBtn text="返回" icon="icon-goback" variant="darkBlue" />
    //   </div>
    //   <div></div>
    //   <div className="flex justify-between gap-2">
    //     {Array.from({ length: 10 }, (_, i) => i + 1).map((station) => (
    //       <button key={station} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition" onClick={() => onClick(station)}>
    //         站點 {station}
    //       </button>
    //     ))}
    //   </div>
    // </>
  );
}
