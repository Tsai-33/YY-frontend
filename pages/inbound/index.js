import React, { useState } from "react";

import PageTitle from "@/components/common/pageTitle";
import { useSelector } from "react-redux";
import ActionBtn from "@/components/common/btns/actionBtn";
import Table from "@/components/common/table/table";
import NoCheckBoxTable from "@/components/common/table/noCheckboxTable";

export default function Inbound() {
  const currentStep = useSelector((state) => state.page.currentStep);
  const [tableData, setTableData] = useState([]);
  // ===== radio table =====
  const tableHeader = [
    { label: "訂單單號/製令單號", key: "orderId", width: `60%` },
    { label: "入庫日期", key: "inDate", width: `35%` },
  ];
  const [selected, setSelected] = useState("");
  // ===== checkbox table =====
  const tableHeader2 = [
    { label: "", key: "checkbox", width: `5%` },
    { label: "製令單號", key: "orderId", width: `60%` },
    { label: "每箱包數", key: "boxCount", width: `35%` },
  ];
  const [selectedArray, setSelectedArray] = useState([]);
  const handleSelectedOption = (name, value, idKey) => {
    const valueId = value[idKey];

    if (name === "checkbox") {
      console.log(name, valueId, "checkbox抓");
      setSelectedArray((prev) => {
        let newArray;
        if (prev.includes(valueId)) {
          newArray = prev.filter((id) => id !== valueId);
        } else {
          newArray = [...prev, valueId];
        }
        return newArray;
      });
    } else if (name === "radio") {
      console.log(name, valueId, "radio抓");
      setSelected(valueId);
    }
  };

  // ===== 假資料 =====
  const data = [
    { checkbox: false, orderId: "M510-1351050505", inDate: "20251017", boxCount: "5" },
    { checkbox: false, orderId: "M510-1351050501", inDate: "20251017", boxCount: "5" },
    { checkbox: false, orderId: "M510-1351050503", inDate: "20251017", boxCount: "5" },
    { checkbox: false, orderId: "M510-1351050506", inDate: "20251017", boxCount: "5" },
    { checkbox: false, orderId: "M510-1351050508", inDate: "20251017", boxCount: "5" },
    { checkbox: false, orderId: "M510-1351050510", inDate: "20251017", boxCount: "5" },
    { checkbox: false, orderId: "M510-1351050510", inDate: "20251017", boxCount: "5" },
    { checkbox: false, orderId: "M510-1351050510", inDate: "20251017", boxCount: "5" },
    { checkbox: false, orderId: "M510-1351050510", inDate: "20251017", boxCount: "5" },
    { checkbox: false, orderId: "M510-1351050510", inDate: "20251017", boxCount: "5" },
    { checkbox: false, orderId: "M510-1351050510", inDate: "20251017", boxCount: "5" },
    { checkbox: false, orderId: "M510-1351050510", inDate: "20251017", boxCount: "5" },
    { checkbox: false, orderId: "M510-1351050510", inDate: "20251017", boxCount: "5" },
  ];
  return (
    <>
      <div className="absolute w-full flex justify-between">
        <h1 className="sm:text-[length:var(--font-size-6xl)] px-12">入庫 {"A01"}</h1>
        <ActionBtn text="返回" icon="icon-goback" variant="darkBlue" />
      </div>
      {currentStep === 1 && <PageTitle title={`請點擊清單內工單單號或訂單單號、掃描工單或訂單條碼、外箱條碼`} />}
      {currentStep === 2 && <PageTitle title={`檢視完入庫資訊確認沒問題，請點擊確定按鈕`} />}
      {currentStep === 3 && <PageTitle title={`貨架到站點，請掃外箱條碼或點擊介面清單方框確定已將產品放上貨架`} />}
      {currentStep === 4 && <PageTitle title={`上架完請點擊退回貨架按鈕`} />}
      {currentStep === 5 && <PageTitle title={`等待無人車將貨架搬回庫區`} />}
      <div className="flex flex-1 gap-12">
        <div className="w-3/7">
          <NoCheckBoxTable headers={tableHeader} data={data} type="radio" name="inbound" variants="green" idKey="orderId" checked={selected} onChange={handleSelectedOption} />
        </div>

        <div className="w-4/7">
          <Table headers={tableHeader2} data={data} type="checkbox" name="inbound2" variants="green" idKey="orderId" checked={selectedArray} onChange={handleSelectedOption} />
        </div>
      </div>
      <div className="flex justify-between gap-2">
        <ActionBtn text="站點1" variant="green" onClick={() => onClick(station)} />
        <ActionBtn text="站點2" variant="green" onClick={() => onClick(station)} />
        <ActionBtn text="站點3" variant="green" onClick={() => onClick(station)} />
        <ActionBtn text="站點4" variant="green" onClick={() => onClick(station)} />
        <ActionBtn text="站點5" variant="green" onClick={() => onClick(station)} />
        <ActionBtn text="站點6" variant="green" onClick={() => onClick(station)} />
        <ActionBtn text="站點7" variant="green" onClick={() => onClick(station)} />
        <ActionBtn text="站點8" variant="green" onClick={() => onClick(station)} />
        <ActionBtn text="站點9" variant="green" onClick={() => onClick(station)} />
        <ActionBtn text="站點10" variant="green" onClick={() => onClick(station)} />
      </div>
    </>
  );
}
