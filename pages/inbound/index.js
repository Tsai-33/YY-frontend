import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import ActionBtn from "@/components/common/btns/actionBtn";
import PageHeader from "@/components/common/pageHeader/pageHeader";
import InputFrame from "@/components/common/input/inputFrame";
import {  setCurrentStation } from "@/redux/reducer/reducerWorkStations";
import { setInbound } from "@/redux/reducer/reducerInbound";
import { getInbound } from "../api";
import SchematicDiagram from "../../components/diagram/schematicDiagram";
import LoadingShelf from "@/components/common/loading/loading-shelf";
import InboundTable from "@/components/inbound/inboundTable";
import Loading from "@/components/common/loading/loading";
import SchematicDiagramList from "@/components/diagram/schematicDiagramList";

export default function Inbound() {
  const dispatch = useDispatch();
  const { area, ip, stations, jobs, currentStation, currentJob } = useSelector((s) => s.workstation);
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [selectedArray, setSelectedArray] = useState([]);

  // 目前選擇的工作站
  const handleSwitchStation = (station) => {
    dispatch(setCurrentStation(station));
  };
  const currentStationSafe = currentStation || stations?.[0] || "";
  const { orderList } = useSelector((s) => s.inbound);
  const { step, screen, orderCode, taskdone } = useSelector((s) => s.inbound[currentStationSafe] || {});

  // 掃描 QR code
  const barCodeRef = useRef(null);
  const handleBarCode = (e) => {
    if (screen === "loading") return;
    if (e.key !== "Enter") return;
    const inputBarCode = e.target.value.trim();
    const result = tableData.some((item) => item.orderId === inputBarCode);
    if (result) {
      dispatch(setInbound({ station: currentStation, orderCode: inputBarCode, step: 2 }));
      barCodeRef.current.value = "";
    }
  };

  // 確認此入庫單
  const handleConfrim = async () => {
    setLoading(true);
    try {
      // 傳給WMS
      // const res = await sendToWms()
      // if(res.data.success){
      // 應該會告訴我有哪些station被占用，這裡可能是map方式全部設定
      dispatch(setInbound({ station: currentStation, screen: "loading", orderList: orderCode }));
      setTableData((prev) => prev.filter((v) => v.orderId !== orderCode)); // 把已選定單排除
      // }
    } catch (err) {
      console.warn("handleConfrim :", err);
    } finally {
      setLoading(false);
    }
  };
  const handleAddShelf = async () => {};
  const handleConfrimShelf = async () => {};
  const handleReturnShelf = async () => {};

  // =============== 初入畫面 =============== 
  useEffect(() => {
    getInboundTable();
  }, []);
  const getInboundTable = async () => {
    try {
      const res = await getInbound();
      if (res.data.success) {
        // 排除掉重複訂單
        const newData = res.data.data.filter((v) => !orderList.includes(v.orderId));
        setTableData(newData);
        barCodeRef?.current?.focus();
      }
    } catch (err) {
      console.warn(`getInboundTable:`, err);
    }
  };

  return (
    <>
      {/* 頂部區域 */}
      {step === 1 && <PageHeader title={`請點擊清單內入倉單號、掃描入倉單條碼`} close={false} backTo="/workspace" />}
      {orderCode && step === 2 && <PageHeader title={`檢視完入庫資訊確認沒問題，請點擊確定按鈕`} close={false}  />}
      {step === 3 && <PageHeader title={`貨架到站點，請掃外箱條碼或點擊介面清單方框確定已將產品放上貨架`} close={true} />}
      {step === 4 && <PageHeader title={`上架完請點擊退回貨架按鈕`} close={true} />}
      {step === 5 && <PageHeader title={`等待無人車將貨架搬回庫區`} close={true} />}
      {/* 主要內容區域 */}
      <div className="flex flex-1 gap-4 px-2 py-8 items-stretch">
        {/* 左側 */}
        <div className="w-3/7">
          <InboundTable data={tableData} selectedArray={selectedArray} setSelectedArray={setSelectedArray} />
        </div>
        {/* 右側 */}
        <div className="w-4/7 font-bold text-black p-4 flex flex-col">
          {/* 條碼 */}
          <div className="flex space-x-4 pb-4">
            <div className="flex flex-1 items-center">
              <label htmlFor="order" className="font-bold text-black">
                訂單/工單條碼:
              </label>
              {step <= 2 ? (
                <div className="w-75">
                  <InputFrame type="text" name="orderCode" id="order" ref={barCodeRef} onKeyDown={handleBarCode} />
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
              {step <= 2 ? (
                orderCode &&
                tableData.map((v, i) => {
                  if (orderCode !== v.orderId) return;
                  return (
                    <SchematicDiagramList key={i}>
                      <div className="flex flex-col">
                        <div className="flex justify-between">
                          <div>入倉單單號:{v?.orderId}</div>
                          <div>入庫庫別:{v?.area}</div>
                        </div>
                        <div className="flex justify-between">
                          <div>產品品號:{v?.product}</div>
                        </div>
                        {v?.products?.map((p, idx) => (
                          <div key={idx} className="mt-2 border-gray-300">
                            <div>品名: {p?.productName}</div>
                            <div className="w-50 flex justify-between">
                              <div>箱數: {p?.bag}</div>
                              <div>單位: {p?.count}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </SchematicDiagramList>
                  );
                })
              ) : (
                <SchematicDiagram>
                  <div className="flex flex-col">
                    <div className="flex justify-between">
                      <div>貨架編號:</div>
                      <div>出庫庫別:</div>
                    </div>
                    <div className="flex justify-between">
                      <div>產品品號:</div>
                      <div>棧板規格:</div>
                    </div>
                    <div className="mt-2 p-2 border-gray-300">
                      <div>品名:</div>
                      <div className="flex justify-between">
                        <div>箱數:</div>
                        <div>包數:</div>
                        <div>1/1</div>
                      </div>
                    </div>
                  </div>
                </SchematicDiagram>
              )}
            </div>
            {/* 按鈕區 */}
            <div className="flex flex-1 flex-col justify-end items-center">
              {step <= 2 && <ActionBtn text="確定" variant="orange" onClick={handleConfrim} />}
              {step > 2 && (
                <div className="w-full flex justify-between">
                  <ActionBtn icon="" text="新增貨架" variant="orange" onClick={handleAddShelf} />
                  <ActionBtn icon="" text="確定上架" variant="orange" onClick={handleConfrimShelf} disabled={selectedArray.length <= 0} />
                  <ActionBtn icon="" text="退回貨架" variant="orange" onClick={handleReturnShelf} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* 底部按鈕區域 */}
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
