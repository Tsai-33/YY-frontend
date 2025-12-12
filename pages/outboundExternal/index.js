import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import OutboundExternalTable from "@/components/outboundExternal/outboundExternalTable";
import { setCurrentStation } from "@/redux/reducer/reducerWorkStations";
import { setOutboundExternal } from "@/redux/reducer/reducerOutboundExternal";
import { getOutboundExternal, getOutBoundExternalOrderDetailBySaleNo, sendToWMS, shiftOutByBarcode } from "../api";
import LoadingShelf from "@/components/common/loading/loading-shelf";
import Loading from "@/components/common/loading/loading";
import PageHeader from "@/components/common/pageHeader/pageHeader";
import InputFrame from "@/components/common/input/inputFrame";
import ActionBtn from "@/components/common/btns/actionBtn";
import SchematicDiagram from "@/components/diagram/schematicDiagram";
import SchematicDiagramList from "@/components/diagram/schematicDiagramList";
import { generateRandomNumber } from "@/utils/random";
import Alert from "@/components/common/alert/alert";
import { initWorkstation } from "@/redux/reducer/reducerWorkStations";

export default function OutboundExternal() {
  const dispatch = useDispatch();
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [selectedArray, setSelectedArray] = useState([]);
  const [orderDetail, setOrderDetail] = useState([]);

  // TODO 暫時不透過workspace進來
  useEffect(() => {
    if (!currentStation) {
      dispatch(initWorkstation("172.16.11.75"));
    }
  }, [currentStation, dispatch]);
  
  // 目前選擇的工作站
  const handleSwitchStation = (station) => {
    dispatch(setCurrentStation(station));
  };

  // 防止currentStation還沒好就使用會壞掉
  const currentStationSafe = currentStation || stations?.[0] || "";
  // 避免同一張單被很多站使用
  const { orderList, lackStation } = useSelector((s) => s.outboundExternal);
  const { step, screen, orderCode, order, shelf, shelfItem } = useSelector((s) => s.outboundExternal[currentStationSafe] || {});

  // =====根據銷貨單取得細節=====
  useEffect(() => {
    if (orderCode) {
      fetchOrderDetail(orderCode);
    } else {
      setOrderDetail([]);
    }
  }, [orderCode]);

  const fetchOrderDetail = async (saleNo) => {
    try {
      const res = await getOutBoundExternalOrderDetailBySaleNo(saleNo);
      if (res.data.success) {
        setOrderDetail(res.data.data || []);
      }
    } catch (error) {
      console.warn("fetchOrderDetail: ", error);
      setOrderDetail([]);
    }
  }

  // =====掃銷貨單條碼=====
  const orderBarCodeRef = useRef(null);
  const [askingOrder, setAskingOrder] = useState(false);

  const handleOrderBarCode = async (e) => {
    if (screen === "loading") return;
    if (e.key !== "Enter") return;

    const inputBarCode = e.target.value.trim();
    if (!inputBarCode) return;

    // 檢查清單中是否配對到
    const result = tableData.some((item) => item.SALE_NO === inputBarCode);
    const [value] = tableData.filter((item) => item.SALE_NO === inputBarCode);
    if (result) {
      dispatch(setOutboundExternal({ station: currentStationSafe, order: value, orderCode: inputBarCode, step: 2 }));
      orderBarCodeRef.current.value = "";
    } else {
      setAskingOrder(true);
      try {
        const dataId = generateRandomNumber();
        const data = {
          action: "ask_order",
          no: inputBarCode,
          dataid: dataId
        }
        console.log("data: ", data)
        const res = await sendToWMS(data);
        console.log("res: ", res);
        if (res.data.success && res.data.data?.result?.toUpperCase() === "OK") {
          // 重取訂單
          const tableRes = await getOutboundExternal();
          if (tableRes.data.success) {
            const newData = tableRes.data.data.filter((v) => !orderList.includes(v.OUTSTOCK_NO));
            setTableData(newData);
          
            // 再配對一次
            const newMatchedOrder = newData.find((item) => item.SALE_NO === inputBarCode);
            if (newMatchedOrder) {
              dispatch(setOutboundExternal({
                station: currentStationSafe,
                order: newMatchedOrder,
                orderCode: inputBarCode,
                step: 2
              }));
            } else {
              Alert({ text: "單號已更新但清單中找不到該筆資料，請稍後再試" });
            }
          }
        } else if (result === "NG") {
          Alert({ text: res.data.data?.message || "無此單號" });
        } else {
          Alert({ text: "查詢單號失敗" });
        }
      } catch (error) {
        console.warn("ask_order 錯誤:", error);
      } finally {
        setAskingOrder(false);
        orderBarCodeRef.current.value = "";
      }
    }
  }

  // ===== 掃外箱條碼 =====
  const boxBarcodeRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const handleBoxBarcode = async (e) => {
    if (e.key !== "Enter") return;
    
    const barcode = e.target.value.trim();
    if (!barcode) return;
    if (scanning) return;

    setScanning(true);
    try {
      // 出庫API
      const res = await shiftOutByBarcode({
        barcode,
        waveNo: order.W_ID,
        saleNo: orderCode,
        shelveId: shelf?.SHELVE_ID
      });

      if (res.data.success) {
        const { PRT_NO, PRT_NAME, outBoxNo, outPpNo } = res.data.data;
        // 找到對應的產品更新checkbox
        // const prtNo = res.data.data.PRT_NO;
        setSelectedArray(prev => [...new Set([...prev, PRT_NO])]);
        
        // 回報report_shiftout
        await sendToWMS({
          action: "report_shiftout",
          wave_no: String(order.W_ID),
          dataid: generateRandomNumber()
        });
        
        // 重新拿table資料
        await getList();
      } else {
        Alert({ text: res.data.message || "條碼不符合" });
      }
    } catch (error) {
      console.warn("handleBoxBarcode:", error);
      Alert({ text: "出庫失敗" });
    } finally {
      setScanning(false);
      boxBarcodeRef.current.value = "";
      boxBarcodeRef.current.focus();
    }
  };
  // step 3 時自動focus外箱條碼
  useEffect(() => {
    if (step === 3 && boxBarcodeRef.current) {
      boxBarcodeRef.current.focus();
    }
  }, [step]);

  // ===== 確認出庫 =====
  const handleOrderConfrim = async () => {
    setLoading(true);
    try {
      dispatch(setOutboundExternal({ station: currentStation, order: {}, waveNo: null, orderCode: "", step: 1 }));
      const dataId = generateRandomNumber();
      const data = {
        action: "ask_wave",
        dataid: dataId,
        wave_no: String(order.W_ID),
        station_no: "B"
      }
      console.log('data: ', data)
      const res = await sendToWMS(data);
      console.log('res: ', res)
      if (res.data.success && !res.data.data?.error) {
        // 存被占用的站點
        let lack_station = res.data.data.message2 || [];
        if (!Array.isArray(lack_station)) {
          try {
            // 把單引號換成雙引號後解析
            lack_station = JSON.parse(lack_station.replace(/'/g, '"'));
          } catch (error) {
            console.error("lack_station 格式錯誤:", lack_station, error);
            lack_station = [];
          }
        }
        // 把每個被占用的站點設成loading狀態
        if (lack_station.length > 0) {
          lack_station.map((station) => {
            dispatch(setOutboundExternal({ 
              station: station, 
              screen: "loading", 
              orderCode: orderCode,
              orderList: orderCode,
              waveNo: order.W_ID,
              order: order,
              lackStation:station
            }));
          });
        }
        // 拿掉已選的訂單
        setTableData((prev) => prev.filter((v) => v.SALE_NO !== orderCode));
      }
    } catch (error) {
      console.warn("出庫確認 :", error);
    } finally {
      setLoading(false);
    }
  }

  // 退回貨架
  const handleReturnShelf = async () => {
    if (!currentStation) {
      Alert({ html: "抓不到站點位置"});
      return;
    }
    setLoading(true);
    try {
      const dataId = generateRandomNumber();
      const data = {
        action: "wcstask",
        dataid: dataId,
        command: "RETURN",
        SHELVE_ID: shelf?.SHELVE_ID,
        FACE: 2,
        STATION: currentStation,
        PURPOSE: 0
      };
      const res = await sendToWMS(data);

      if (res.data.success) {
        console.log(res.data, "wcstask接收到資料");
      }
    } catch (error) {
      console.warn("handleReturnShelf", error);
    } finally {
      setLoading(false);
    }
  }; 

  // ===== table資料 =====
  useEffect(() => {
    getOutboundExternalTable();
  }, []);
  const getOutboundExternalTable = async () => {
    try {
      const res = await getOutboundExternal();
      if (res.data.success) {
        const newData = res.data.data.filter((v) => !orderList.includes(v.OUTSTOCK_NO));
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
            {/* 銷貨單條碼 */}
            <div className="flex flex-1 items-center">
              <label htmlFor="order" className="font-bold text-black">
                銷貨單條碼:
              </label>
              {step <= 2 ? (
                <div className="w-50 flex items-center gap-2">
                  <InputFrame 
                    type="text" 
                    name="orderCode" 
                    id="order" 
                    ref={orderBarCodeRef} 
                    onKeyDown={handleOrderBarCode}
                    disabled={askingOrder}
                  />
                  {askingOrder && <span className="text-orange-500">查詢中...</span>}
                </div>
              ) : (
                <span className="ml-2">{orderCode}</span>
              )}
            </div>
            {/* 外箱條碼 */}
            {step === 3 && (
              <div className="flex flex-1 items-center">
                <label className="font-bold text-black">外箱條碼:</label>
                <div className="w-50 flex items-center gap-2">
                  <InputFrame 
                    type="text" 
                    ref={boxBarcodeRef} 
                    onKeyDown={handleBoxBarcode}
                    disabled={scanning}
                  />
                  {scanning && <span className="text-orange-500">處理中...</span>}
                </div>
              </div>
            )}
          </div>
          {/* 資料 */}
          <div className="flex flex-col flex-1 bg-white p-8 pb-4">
            {/* 內容區 */}
            <div className="flex flex-col gap-8 h-100 overflow-y-auto">
              {step <= 2 ? (
                orderCode &&
                orderDetail?.map((v, i) => (
                  <SchematicDiagramList key={i}>
                    <div className="flex flex-col text-3xl">
                      <div className="flex justify-between">
                        <div>貨架編號:{v?.car}</div>
                        <div>出庫庫別:{v?.STOCK_AREA}</div>
                      </div>
                      <div className="flex justify-between">
                        <div>產品品號:{v?.PRT_NO}</div>
                        <div>棧板規格:{v?.type}</div>
                      </div>
                      <div>品名: {v?.PRT_NAME}</div>
                        <div className="flex justify-between">
                          <div>箱數: {v?.BOX_NO} 箱</div>
                          <div>包數: {v?.BOX_PACK} 包</div>
                          <div>{i + 1}/{orderDetail?.length}</div>
                        </div>
                    </div>
                  </SchematicDiagramList>
                ))
              ) : (
                <SchematicDiagram>
                  <div className="flex flex-col text-3xl">
                    <div className="flex justify-between">
                      <div>貨架編號:{shelf?.SHELVE_ID}</div>
                      <div>出庫庫別:{shelf?.STOCK_AREA}</div>
                    </div>
                  </div>
                  {shelfItem?.map((item, index) => (
                    <>
                      <div className="flex justify-between text-3xl">
                        <div>產品品號:{item?.PRT_NO}</div>
                        <div>棧板規格:{item?.type}</div>
                      </div>
                      <div className="text-3xl">
                        <div>品名: {item?.PRT_NAME}</div>
                          <div className="flex justify-between">
                          <div>箱數: {item?.BOX_NO} 箱</div>
                          <div>包數: {item?.PP_NO} 包</div>
                          <div>{index + 1}/{shelfItem?.length}</div>
                        </div>
                      </div>
                    </>
                  ))}
                </SchematicDiagram>
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
          <div key={i} className="flex-1">
            <ActionBtn 
              key={i} 
              text={`站點${i + 1}`} 
              variant={lackStation?.includes(station) ? "" : "green"} 
              disabled={currentStation === station ? true : false} 
              onClick={() => handleSwitchStation(station)} 
              className="w-80 flex justify-center"
            />
          </div>
        ))}
      </div>
      {/* loading */}
      {screen === "loading" && <LoadingShelf />}
      {loading && <Loading />}
    </>
  );
}
