import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import OutboundExternalTable from "@/components/outboundExternal.js/outboundExternalTable";
import { setCurrentStation } from "@/redux/reducer/reducerWorkStations";
import { setOutboundExternal } from "@/redux/reducer/reducerOutboundExternal";
import { getOutboundExternal } from "../api";
import LoadingShelf from "@/components/common/loading/loading-shelf";
import Loading from "@/components/common/loading/loading";
import PageHeader from "@/components/common/pageHeader/pageHeader";
import InputFrame from "@/components/common/input/inputFrame";
import ActionBtn from "@/components/common/btns/actionBtn";
import SchematicDiagram from "@/components/diagram/schematicDiagram";

export default function OutboundExternal() {
  const dispatch = useDispatch();
  const { area, ip, stations, jobs, currentStation, currentJob } = useSelector((s) => s.workstation);
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [selectedArray, setSelectedArray] = useState([]);

  // 目前選擇的工作站
  const handleSwitchStation = (station) => {
    dispatch(setCurrentStation(station));
  };

  // 防止currentStation還沒好就使用會壞掉
  const currentStationSafe = currentStation || stations?.[0] || "B01"; // TODO
  // 避免同一張單被很多站使用
  const { orderList } = useSelector((s) => s.outboundExternal);
  const { step = 1, screen, orderCode, taskdone } = useSelector((s) => s.outboundExternal[currentStationSafe] || {});

  // =====掃銷貨單條碼=====
  const orderBarCodeRef = useRef(null);
  const handleOrderBarCode = (e) => {
    if (screen === "loading") return;
    if (e.key !== "Enter") return;
    const inputBarCode = e.target.value.trim();
    const result = tableData.some((item) => item.SALE_NO === inputBarCode);
    if (result) {
      dispatch(setOutboundExternal({ station: currentStationSafe, orderCode: inputBarCode, step: 2 }));
      orderBarCodeRef.current.value = "";
    }
  }

  // ===== 確認出庫 =====
  const handleOrderConfrim = async () => {
    setLoading(true);
    try {
      // const res = await sendToWms(selected)
      dispatch(setOutboundExternal({ station: currentStation, screen: "loading", orderList: orderCode }));
      setTableData((prev) => prev.filter((v) => v.SALE_NO))
    } catch (error) {
      console.warn("出庫確認 :", err);
    } finally {
      setLoading(false);
    }
  }
  const handleConfirmShelf = async () => {}; // 確定貨架
  const handleReturnShelf = async () => {}; // 退回貨架

  // ===== table資料 =====
  useEffect(() => {
    getOutboundExternalTable();
  }, []);
  const getOutboundExternalTable = async () => {
    try {
      const res = await getOutboundExternal();
      if (res.data.success) {
        const newData = res.data.data.recordset.filter((v) => !orderList.includes(v.SALE_NO));
        setTableData(newData);
        orderBarCodeRef?.current?.focus();
      }
    } catch (error) {
      console.warn(`getOutboundExternalTable:`, error);
    }
  }
  return (
    <>
      {/* 頂部區域 */}
      {step === 1 && <PageHeader title={`請點擊清單銷貨單號、銷貨單條碼`} backTo="/workspace" />}
      {orderCode && step === 2 && <PageHeader title={`檢視完出庫資訊確認沒問題，請點擊確定按鈕`} />}
      {step === 3 && <PageHeader title={`整板拉走後或揀選完請點擊實體站點按鈕或介面退回貨架按鈕`} />}
      {/* 主要內容區域 */}
      <div className="flex flex-1 gap-4 px-2 py-8 items-stretch">
        {/* 左側 */}
        <div className="w-3/7">
          <OutboundExternalTable data={tableData} selectedArray={selectedArray} setSelectedArray={setSelectedArray} />
        </div>
        {/* 右側 */}
        <div className="w-4/7 font-bold text-black p-4 flex flex-col">
          {/* 條碼 */}
          <div className="flex space-x-4 pb-4">
            <div className="flex flex-1 items-center">
              <label htmlFor="order" className="font-bold text-black">
                銷貨單條碼:
              </label>
              {step <= 2 ? (
                <div className="w-75">
                  <InputFrame type="text" name="orderCode" id="order" ref={orderBarCodeRef} onKeyDown={handleOrderBarCode} />
                </div>
              ) : (
                orderCode
              )}
            </div>
          </div>
          {/* 資料 */}
          <div className="flex flex-col flex-1 bg-white p-8 pb-4">
            {/* 內容區 */}
            <div className="flex flex-col gap-8 h-100 overflow-y-auto">
              {step <= 2 && (
                orderCode &&
                tableData.map((v, i) => (
                  <SchematicDiagram key={i}>
                    <div className="flex flex-col">
                      <div className="flex justify-between">
                        <div>貨架編號:{v?.car}</div>
                        <div>出庫庫別:{v?.area}</div>
                      </div>
                      <div className="flex justify-between">
                        <div>產品品號:{v?.product}</div>
                        <div>棧板規格:{v?.rule}</div>
                      </div>
                      {v?.products?.map((p, idx) => (
                        <div key={idx} className="mt-2 p-2 border-gray-300">
                          <div>品名: {p?.productName}</div>
                          <div className="flex justify-between">
                            <div>箱數: {p?.bag}</div>
                            <div>包數: {p?.count}</div>
                            <div>1/1</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SchematicDiagram>
                ))
              )}
            </div>
            {/* 按鈕區 */}
            <div className="flex flex-1 flex-col justify-end items-center">
              {step <= 2 && <ActionBtn text="確定" variant="orange" onClick={handleOrderConfrim} />}
              {step > 2 && (
                <ActionBtn icon="" text="退回貨架" variant="orange" onClick={handleReturnShelf} />
              )}
            </div>
          </div>
        </div>
      </div>
      {/* 站點 */}
      <div className="w-full flex justify-between z-15">
        {stations.map((station, i) => (
          <ActionBtn key={i} text={station} variant="green" disabled={currentStation === station ? true : false} onClick={() => handleSwitchStation(station)} />
        ))}
      </div>
      {/* loading */}
      {screen === "loading" && <LoadingShelf />}
      {loading && <Loading />}
    </>
  );
}
