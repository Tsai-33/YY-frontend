import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentStation } from "@/redux/reducer/reducerWorkStations";
import ActionBtn from "@/components/common/btns/actionBtn";
import PageHeader from "@/components/common/pageHeader/pageHeader";
import NoCheckBoxTable from "@/components/common/table/noCheckBoxTable";
import Table from "@/components/common/table/table";
import InputFrame from "@/components/common/input/inputFrame";

export default function Inbound() {
  const dispatch = useDispatch();
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const currentStep = useSelector((state) => state.page.currentStep);

  const handleSwitchStation = (station) => {
    dispatch(setCurrentStation(station));
  };

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
    { checkbox: false, orderId: "M510-1351050505", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1" },
    { checkbox: false, orderId: "M510-1351050501", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1" },
    { checkbox: false, orderId: "M510-1351050503", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1" },
    { checkbox: false, orderId: "M510-1351050506", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1" },
    { checkbox: false, orderId: "M510-1351050508", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1" },
    { checkbox: false, orderId: "M510-1351050510", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1" },
    { checkbox: false, orderId: "M510-1351050511", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1" },
    { checkbox: false, orderId: "M510-1351050512", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1" },
    { checkbox: false, orderId: "M510-1351050513", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1" },
    { checkbox: false, orderId: "M510-1351050514", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1" },
    { checkbox: false, orderId: "M510-1351050515", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1" },
    { checkbox: false, orderId: "M510-1351050516", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1" },
    { checkbox: false, orderId: "M510-1351050517", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1" },
  ];
  // ===== 行為 =====
  const handleOrderConfrim = ()=>{
    console.log(selected,'選擇的訂單')
  }
  return (
    <>
      {/* 頂部區域 */}
      {currentStep === 1 && <PageHeader title={`請點擊清單內工單單號或訂單單號、掃描工單或訂單條碼、外箱條碼`} backTo="/workspace" />}
      {currentStep === 2 && <PageHeader title={`檢視完入庫資訊確認沒問題，請點擊確定按鈕`} />}
      {currentStep === 3 && <PageHeader title={`貨架到站點，請掃外箱條碼或點擊介面清單方框確定已將產品放上貨架`} />}
      {currentStep === 4 && <PageHeader title={`上架完請點擊退回貨架按鈕`} />}
      {currentStep === 5 && <PageHeader title={`等待無人車將貨架搬回庫區`} />}
      {/* 主要內容區域 */}
      <div className="flex flex-1 gap-4 px-2 py-8 items-stretch">
        {/* 左側 */}
        <div className="w-3/7">
          <NoCheckBoxTable headers={tableHeader} data={data} type="radio" name="inbound" variants="green" idKey="orderId" checked={selected} onChange={handleSelectedOption} />
          {/* <Table headers={tableHeader2} data={data} type="checkbox" name="inbound2" variants="green" idKey="orderId" checked={selectedArray} onChange={handleSelectedOption} /> */}
        </div>
        {/* 右側 */}
        <div className="w-4/7 font-bold text-black p-4 flex flex-col">
          {/* 條碼 */}
          <div className="flex space-x-4 pb-4">
            <div className="flex flex-1 items-center">
              <label htmlFor="order" className="font-bold text-black">
                訂單/工單條碼:
              </label>
              <InputFrame type="text" name="orderCode" id="order" value="" onChange="" />
            </div>
            <div className="flex flex-1 items-center">
              <label htmlFor="box">外箱條碼:</label>
              <InputFrame type="text" name="boxCode" id="box" value="" onChange="" />
            </div>
          </div>
          {/* 資料 */}
          <div className="flex flex-col flex-1 bg-white p-8 pb-4">
            <div></div>
            <div className="flex flex-1 flex-col justify-end items-center">
              <ActionBtn text="確定" variant="orange" onClick={handleOrderConfrim} />
            </div>
          </div>
        </div>
      </div>
      {/* 底部按鈕區域 */}
      <div className="w-full flex justify-between">
        {stations.map((station) => (
          <ActionBtn text={station} variant="green" disabled={currentStation === station ? true : false} onClick={() => handleSwitchStation(station)} />
        ))}
      </div>
    </>
  );
}
