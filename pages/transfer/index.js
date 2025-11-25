import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentStation } from "@/redux/reducer/reducerWorkStations";
import ActionBtn from "@/components/common/btns/actionBtn";
import PageHeader from "@/components/common/pageHeader/pageHeader";
import NoCheckBoxTable from "@/components/common/table/noCheckBoxTable";
import Table from "@/components/common/table/table";
import InputFrame from "@/components/common/input/inputFrame";
import { getTransfer } from "../api";
import Swal from "sweetalert2";
import Alert from "@/components/common/alert/alert";

export default function Transfer() {
  const dispatch = useDispatch();
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const { step } = useSelector((state) => state.transfer);

  const handleSwitchStation = (station) => {
    dispatch(setCurrentStation(station));
  };
  // ===== loading =====
  const [loading, setLoading] = useState(false);

  // ===== 左側資訊 =====
  // radio table
  const tableHeader = [
    { label: "調撥單號", key: "orderId", width: `50%` },
    { label: "來源庫區", key: "sources", width: `20%` },
    { label: "目的庫區", key: "area", width: `20%` },
  ];
  const [selected, setSelected] = useState("");
  // checkbox table
  const tableHeader2 = [
    { label: "", key: "checkbox", width: `5%` },
    { label: "產品品號", key: "orderId", width: `60%` },
    { label: "每箱包數", key: "boxCount", width: `35%` },
  ];
  const [selectedArray, setSelectedArray] = useState([]);
  const handleSelectedOption = (name, value, idKey) => {
    // 選單
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
  useEffect(() => {
    if (!selected) return;
    // 選擇要的調撥單後顯示此調撥單的資訊
    getTransferByIdData(selected);
  }, [selected]);
  const getTransferByIdData = async () => {
    setLoading(true);
    try {
      const res = await getTransferByIdData(selected);
      if (res.data.success) {
      }
    } catch (err) {
      console.warn("getTransferByIdData :", err);
    } finally {
      setLoading(false);
    }
  };

  // ===== 假資料 =====
  const data = [
    { checkbox: false, orderId: "M510-1351050505", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1", sources: "S01" },
    { checkbox: false, orderId: "M510-1351050501", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1", sources: "S01" },
    { checkbox: false, orderId: "M510-1351050503", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1", sources: "S01" },
    { checkbox: false, orderId: "M510-1351050506", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1", sources: "S01" },
    { checkbox: false, orderId: "M510-1351050508", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1", sources: "S01" },
    { checkbox: false, orderId: "M510-1351050510", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1", sources: "S01" },
    { checkbox: false, orderId: "M510-1351050511", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1", sources: "S01" },
    { checkbox: false, orderId: "M510-1351050512", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1", sources: "S01" },
    { checkbox: false, orderId: "M510-1351050513", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1", sources: "S01" },
    { checkbox: false, orderId: "M510-1351050514", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1", sources: "S01" },
    { checkbox: false, orderId: "M510-1351050515", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1", sources: "S01" },
    { checkbox: false, orderId: "M510-1351050516", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1", sources: "S01" },
    { checkbox: false, orderId: "M510-1351050517", inDate: "20251017", boxCount: "5", shelf: "R0001", product: "Y01TSK025100YB", productName: "黑色束帶100條/包,250包", area: "D01", count: 5, box: 9, rule: "美規1/1", sources: "S01" },
  ];

  // ==== 取得調撥單資訊 ====
  const [tableData, setTableData] = useState([]);
  useEffect(() => {
    getTransferData();
  }, []);
  const getTransferData = async () => {
    setLoading(true);
    try {
      const res = await getTransfer();
      if (res.data.success) {
        setTableData(res.data.data)
      }
    } catch (err) {
      console.warn("getTransferData :", err);
    } finally {
      setLoading(false);
    }
  };
  // ===== 確認調撥單 =====
  const handleOrderConfrim = async () => {
    if (!selected) Alert({ title: "請選擇調撥單" });

    try {
      // const res = await sendToWMS();
      // if(res.data.success){
      // 切換畫面按鈕
      // }
    } catch (err) {}
  };
  return (
    <>
      {/* 頂部區域 */}
      {step === 1 && <PageHeader title={`請點擊清單內的調撥單號或掃調撥單條碼`} backTo="/workspace" />}
      {step === 2 && <PageHeader title={`檢視調撥單內容後，請點擊確定`} />}
      {step === 3 && <PageHeader title={`貨架到站點，請掃外箱條碼或點擊介面清單方框，標示已將產品放上貨架`} />}
      {step === 4 && <PageHeader title={`完成調撥後請點擊退回貨架按鈕，將貨架退回庫區`} />}
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
            <div className="flex items-center">
              <label htmlFor="order" className="font-bold text-black">
                調撥單號:
              </label>
              <InputFrame type="text" name="orderCode" id="order" value="" onChange="" />
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
