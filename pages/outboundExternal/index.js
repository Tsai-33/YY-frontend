import React, { useEffect, useRef, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import OutboundExternalTable from "@/components/outboundExternal/outboundExternalTable";
import { setCurrentStation, setCurrentJob, updateLackStation } from "@/redux/reducer/reducerWorkStations";
import { setOutboundExternal, clearPushButton, updateLackStation as updateOutboundLackStation, updateOrderList } from "@/redux/reducer/reducerOutboundExternal";
import { resetoutboundInternal } from "@/redux/reducer/reducerOutboundInternal";
import { getOutboundExternal, getOutBoundExternalOrderDetailBySaleNo, sendToWMS, shiftOutOnReturn, updateStatusForOutboundCallCar, decryptBarcode } from "@/pages/api";
import LoadingShelf from "@/components/common/loading/loading-shelf";
import Loading from "@/components/common/loading/loading";
import PageHeader from "@/components/common/pageHeader/pageHeader";
import InputFrame from "@/components/common/input/inputFrame";
import ActionBtn from "@/components/common/btns/actionBtn";
import SchematicDiagram from "@/components/diagram/schematicDiagram";
import SchematicDiagramList from "@/components/diagram/schematicDiagramList";
import { generateRandomNumber } from "@/utils/random";
import Alert from "@/components/common/alert/alert";
import Modal from "@/components/common/modal/modal";
import { initWorkstation } from "@/redux/reducer/reducerWorkStations";
import { getOutBoundExternalOrderDetailByWID } from "@/pages/api";
import { checkTask_out, addTask_out, deleteTask_out } from "@/components/outboundExternal/outboundExternalFunction";

export default function OutboundExternal() {
  const dispatch = useDispatch();
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [orderDetail, setOrderDetail] = useState([]);
  const [confirmModal, setConfirmModal] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [orderInput, setOrderInput] = useState("");

  // TODO 暫時不透過workspace進來
  useEffect(() => {
    // if (!currentStation) {
    //   dispatch(initWorkstation("172.16.11.75"));
    // }
    dispatch(setCurrentJob("銷貨"));
  }, [currentStation, dispatch]);

  // 目前選擇的工作站
  const handleSwitchStation = (station) => {
    dispatch(setCurrentStation(station));
  };

  // 防止currentStation還沒好就使用會壞掉
  const currentStationSafe = currentStation || stations?.[0] || "";
  // 避免同一張單被很多站使用
  const outboundExternalState = useSelector((s) => s.outboundExternal);
  const { orderList, lackStation } = outboundExternalState;
  const { step, screen, orderCode, order, shelf, shelfItem, selected, waveNo, pushButton } = outboundExternalState[currentStationSafe] || {};

  // =====根據銷貨單取得細節=====
  useEffect(() => {
    if (orderCode) {
      fetchOrderDetail(orderCode);
    } else {
      setOrderDetail([]);
    }
  }, [orderCode]);

  // 同步 orderCode 到 orderInput
  useEffect(() => {
    setOrderInput(orderCode || "");
  }, [orderCode]);

  const fetchOrderDetail = async (saleNo) => {
    try {
      const res = await getOutBoundExternalOrderDetailBySaleNo(saleNo);
      if (res.data.success) {
        console.log("setOrderDetail: ", res.data.data);
        setOrderDetail(res.data.data || []);
      }
    } catch (error) {
      console.warn("fetchOrderDetail: ", error);
      setOrderDetail([]);
    }
  };

  // =====根據相同的SHELVE_ID資料分組=====
  const groupedOrderDetail = useMemo(() => {
    const grouped = {};

    orderDetail.forEach((item) => {
      const id = item.SHELVE_ID;
      if (!grouped[id]) {
        grouped[id] = {
          SHELVE_ID: id,
          STOCK_AREA: item.STOCK_AREA,
          SHELVE_TYPE: item.type,
          items: [],
        };
      }
      grouped[id].items.push(item);
    });
    return Object.values(grouped);
  }, [orderDetail]);

  // =====掃銷貨單條碼=====
  const orderBarCodeRef = useRef(null);
  const [askingOrder, setAskingOrder] = useState(false);

  const handleOrderBarCode = async (e) => {
    if (screen === "loading") return;
    if (e.key !== "Enter") return;

    const inputBarCode = e.target.value.trim();
    if (!inputBarCode) return;

    // 如果已經點擊選擇會檢查掃的條碼是否匹配
    if (orderCode && orderCode === inputBarCode) {
      dispatch(setOutboundExternal({ station: currentStationSafe, step: 2 }));
      return;
    }

    // 檢查清單中是否配對到
    const result = tableData.some((item) => item.SALE_NO === inputBarCode);
    const [value] = tableData.filter((item) => item.SALE_NO === inputBarCode);
    if (result) {
      dispatch(setOutboundExternal({ station: currentStationSafe, order: value, orderCode: inputBarCode, waveNo: value.W_ID, step: 2 }));
    } else if (orderCode && orderCode !== inputBarCode) {
      // 已選擇但條碼不匹配
      Alert({ title: "條碼與選擇的銷貨單不符" });
      setOrderInput(orderCode || "");
    } else {
      setAskingOrder(true);
      try {
        const dataId = generateRandomNumber();
        const data = {
          action: "ask_order",
          no: inputBarCode,
          dataid: dataId,
        };
        const res = await sendToWMS(data);

        if (res.data.success && res.data.data?.result?.toUpperCase() === "OK") {
          // 重取訂單
          const tableRes = await getOutboundExternal();
          if (tableRes.data.success) {
            const newData = tableRes.data.data.filter((v) => !orderList.includes(v.OUTSTOCK_NO));
            setTableData(newData);

            // 再配對一次
            const newMatchedOrder = newData.find((item) => item.SALE_NO === inputBarCode);
            if (newMatchedOrder) {
              dispatch(
                setOutboundExternal({
                  station: currentStationSafe,
                  order: newMatchedOrder,
                  orderCode: inputBarCode,
                  step: 2,
                }),
              );
            } else {
              Alert({ title: "單號已更新但清單中找不到該筆資料，請稍後再試" });
            }
          }
        } else if (result === "NG") {
          Alert({ title: res.data.data?.message || "無此單號" });
        } else {
          Alert({ title: "查詢單號失敗" });
        }
      } catch (error) {
        console.warn("ask_order 錯誤:", error);
      } finally {
        setAskingOrder(false);
      }
    }
  };

  // ===== 根據波次取得明細 =====
  const [detailTableData, setDetailTableData] = useState([]);
  useEffect(() => {
    if (!waveNo || step < 3) return;
    fetchDetailData();
  }, [waveNo, step]);

  const fetchDetailData = async () => {
    try {
      const res = await getOutBoundExternalOrderDetailByWID(waveNo);
      if (res.data.success) {
        setDetailTableData(res.data.data || []);
      }
    } catch (error) {
      console.warn("fetchDetailData:", error);
    }
  };

  // ===== 掃外箱條碼 =====
  const boxBarcodeRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const handleBoxBarcode = async (e) => {
    if (e.key !== "Enter") return;

    const barcode = e.target.value.trim();
    if (!barcode) return;
    if (scanning) return;

    setScanning(true); // 防重複掃描

    try {
      let decryptedBarcode = barcode;
      // 如果條碼已經是MAKE_NO(M開頭 + 數字)就不解密
      const isMakeNoFormat = /^M\d{3}-\d+(-\d+)?$/.test(barcode);

      if (!isMakeNoFormat) {
        try {
          const decryptRes = await decryptBarcode({ text: barcode });
          if (decryptRes.data.data) {
            decryptedBarcode = decryptRes.data.data;
          }
        } catch (decryptError) {
          console.warn("解密失敗，使用原始條碼:", decryptError);
        }
      }
      // 測試 wuc3LX4mNgiArT+JvMQBIFz8SMkpNlmd
      console.log("原始條碼：", barcode);
      console.log("解密後：", decryptedBarcode);

      // 從orderDetail取數量
      const detailItem = orderDetail?.find((item) => item.MAKE_NO === decryptedBarcode || item.MAKE_NO?.includes(decryptedBarcode));
      // 找對應的產品
      const matchedItem = detailTableData?.find((item) => item.MAKE_NO === decryptedBarcode);

      // const matchedItem = shelfItem?.find(item =>
      //   item.MAKE_NO?.includes(decryptedBarcode)
      // );

      if (matchedItem) {
        const alreadyScanned = (selected || []).some((p) => p.MAKE_NO === decryptedBarcode || p.MAKE_NO?.includes(decryptedBarcode));

        if (alreadyScanned) {
          Alert({ title: `已掃描過: ${decryptedBarcode}`, icon: "warning", timer: 1000 });
        } else {
          dispatch(
            setOutboundExternal({
              station: currentStationSafe,
              selected: [
                ...(selected || []),
                {
                  PRT_NO: matchedItem.PRT_NO,
                  MAKE_NO: decryptedBarcode,
                  outBoxNo: matchedItem.BOX_NO,
                  outPpNo: matchedItem.PP_NO,
                },
              ],
            }),
          );
          Alert({ title: `已掃描: ${decryptedBarcode}`, icon: "success", timer: 1000 });
        }
      } else {
        Alert({ title: "條碼不符合，找不到對應箱號" });
      }
    } catch (error) {
      console.warn("解密失敗:", error);
      Alert({ title: "條碼解密失敗", icon: "error" });
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

  // ===== 確認出庫單 =====
  const handleOrderConfrim = async () => {
    // 確認是否有其他任務
    const task = await checkTask_out(stations);
    if (!task?.success) return;
    const hasTask = task?.data?.data?.some((item) => item.location === "outboundExternal" || item.location === "");
    if (!hasTask) {
      Alert({ title: "目前有其他任務正在執行" });
      return;
    }

    // TODO: 暫時註解掉檢查，等流程跑完再打開
    // 檢查庫區是否為 F01
    console.log("orderDetail: ", orderDetail);
    const invalidStockArea = orderDetail?.find((item) => item.STOCK_AREA !== "F01");
    if (invalidStockArea) {
      Alert({ title: `庫區錯誤：貨架 ${invalidStockArea.SHELVE_ID} 的庫區為 ${invalidStockArea.STOCK_AREA}，非 F01` });
      return;
    }

    // 檢查庫存是否足夠
    try {
      const detailRes = await getOutBoundExternalOrderDetailByWID(order.W_ID);
      if (detailRes.data.success) {
        const demandData = detailRes.data.data || [];

        // 將需求按 PRT_NO 分組加總
        const demandByPrtNo = {};
        demandData.forEach((item) => {
          const prtNo = item.PRT_NO;
          if (!demandByPrtNo[prtNo]) {
            demandByPrtNo[prtNo] = { PP_NO: 0, BOX_NO: 0 };
          }
          demandByPrtNo[prtNo].PP_NO += item.PP_NO || 0;
          demandByPrtNo[prtNo].BOX_NO += item.BOX_NO || 0;
        });

        // 將 WMS 庫存按 PRT_NO 分組加總
        const stockByPrtNo = {};
        orderDetail?.forEach((item) => {
          const prtNo = item.PRT_NO;
          if (!stockByPrtNo[prtNo]) {
            stockByPrtNo[prtNo] = { PP_NO: 0, BOX_NO: 0 };
          }
          stockByPrtNo[prtNo].PP_NO += item.PP_NO || 0;
          stockByPrtNo[prtNo].BOX_NO += item.BOX_NO || 0;
        });

        // 比較每個 PRT_NO 的庫存是否足夠
        for (const prtNo of Object.keys(demandByPrtNo)) {
          const demand = demandByPrtNo[prtNo];
          const stock = stockByPrtNo[prtNo] || { PP_NO: 0, BOX_NO: 0 };
          if (stock.PP_NO < demand.PP_NO || stock.BOX_NO < demand.BOX_NO) {
            Alert({
              title: `庫存不足：產品 ${prtNo}`,
              text: `需求: ${demand.BOX_NO} 箱 ${demand.PP_NO} 包\n庫存: ${stock.BOX_NO} 箱 ${stock.PP_NO} 包`,
            });
            return;
          }
        }
      }
    } catch (error) {
      console.warn("檢查庫存失敗:", error);
      Alert({ title: "檢查庫存失敗" });
      return;
    }

    setLoading(true);
    try {
      const dataId = generateRandomNumber();
      const stationNo = currentStation?.charAt(0);
      const data = {
        action: "ask_wave",
        dataid: dataId,
        wave_no: String(order.W_ID),
        station_no: stationNo,
      };
      console.log("data: ", data);
      const res = await sendToWMS(data);
      console.log("res: ", res);
      const resiveData = res.data.data;

      // 檢查 LabVIEW 回傳結果
      if (resiveData?.result === "NG") {
        Alert({ title: `${resiveData?.message}` });
      } else if (resiveData?.message2?.length > 0) {
        // 清空該站的資料
        dispatch(setOutboundExternal({ station: currentStation, order: {}, waveNo: null, orderCode: "", step: 1 }));

        await updateStatusForOutboundCallCar({ W_ID: order.W_ID });
        // 存被占用的站點
        let lack_station = resiveData.message2;
        if (!Array.isArray(lack_station)) {
          try {
            // 把單引號換成雙引號後解析
            lack_station = JSON.parse(lack_station.replace(/'/g, '"'));
          } catch (error) {
            console.warn("lack_station 格式錯誤:", lack_station, error);
            lack_station = [];
          }
        }
        // 把每個被占用的站點設成loading狀態
        if (lack_station.length > 0) {
          lack_station.map((station) => {
            dispatch(
              setOutboundExternal({
                station: station,
                screen: "loading",
                orderCode: orderCode,
                waveNo: order.W_ID,
                order: order,
                orderList: orderCode,
                lackStation: station,
              }),
            );
          });
        }
        // 拿掉已選的訂單
        setTableData((prev) => prev.filter((v) => v.OUTSTOCK_NO !== orderCode && v.STATUS === 0));

        // 寫入任務紀錄
        await addTask_out(stations);
      } else {
        Alert({ title: "伺服器有問題，請稍後再試。" });
      }
    } catch (error) {
      console.warn("出庫確認 :", error);
      Alert({ title: "出庫確認失敗", text: error?.message || "發生錯誤" });
    } finally {
      setLoading(false);
    }
  };

  // ====== 退回貨架 ======
  // 接收實體按鈕訊號
  useEffect(() => {
    if (!pushButton || step !== 3) return;
    const handlePushButton = async () => {
      await handleReturnShelf();
      // 清掉避免再觸發
      dispatch(clearPushButton({ station: currentStationSafe }));
    };
    handlePushButton();
  }, [pushButton]);

  const handleReturnShelf = async () => {
    if (!currentStation) {
      Alert({ title: "抓不到站點位置" });
      return;
    }
    if (!shelf?.SHELVE_ID) {
      Alert({ title: "找不到貨架資訊" });
      return;
    }

    setLoading(true);
    try {
      // 1.判斷是整板還是零散
      let itemsToShift = [];

      if ((selected || []).length > 0) {
        // 零散掃條碼
        itemsToShift = selected;
      } else {
        // 整板出貨
        itemsToShift =
          shelfItem?.map((item) => ({
            PRT_NO: item.PRT_NO,
            MAKE_NO: item.MAKE_NO,
            outBoxNo: item.BOX_NO,
            outPpNo: item.PP_NO,
          })) || [];
      }

      if (itemsToShift.length === 0) {
        Alert({ title: "沒有出庫的產品" });
        setLoading(false);
        return;
      }

      // 2. 扣庫存
      const shiftRes = await shiftOutOnReturn({
        items: itemsToShift,
        waveNo: order.W_ID,
        saleNo: orderCode,
        shelveId: shelf.SHELVE_ID,
        isFullPallet: (selected || []).length === 0,
      });

      if (!shiftRes.data.success) {
        Alert({ title: shiftRes.data.message || "出庫失敗" });
        setLoading(false);
        return;
      }

      // 3. 退回貨架
      const dataId = generateRandomNumber();
      const data = {
        action: "wcstask",
        dataid: dataId,
        command: "RETURN",
        SHELVE_ID: shelf?.SHELVE_ID,
        FACE: 2,
        STATION: currentStation,
        PURPOSE: 0,
      };
      const res = await sendToWMS(data);
      if (res.data.success) {
        console.log("RETURN_RES: ", res);

        // 檢查其他站點是否還在工作（screen === "working" 且 step === 3）
        const otherWorkingStations = stations.filter((stationId) => {
          if (stationId === currentStation) return false;
          const stationState = outboundExternalState[stationId];
          return stationState?.screen === "working" && stationState?.step === 3;
        });

        if (otherWorkingStations.length > 0) {
          // 還有其他站點在工作，只把當前站點設為 loading
          dispatch(
            setOutboundExternal({
              station: currentStation,
              screen: "loading",
              shelf: {},
              shelfItem: [],
              selected: [],
            }),
          );
          Alert({ title: `還有 ${otherWorkingStations.length} 個工作站未完成退回貨架` });
        } else {
          // 4. 所有工作站都完成了清空所有站點的資料(出庫會佔滿所有站點)
          stations.forEach((stationId) => {
            dispatch(
              setOutboundExternal({
                station: stationId,
                step: 1,
                screen: "idle",
                orderCode: "",
                waveNo: null,
                order: {},
                shelf: {},
                shelfItem: [],
                selected: [],
              }),
            );
          });

          // 5. 清空 lackStation
          dispatch(updateOutboundLackStation({ type: "clear" }));

          // 6. 從orderList刪除該訂單
          dispatch(updateOrderList({ order: orderCode, type: "sub" }));

          // 7. 刪除任務紀錄
          await deleteTask_out(stations);

          dispatch(resetoutboundInternal());

          await getOutboundExternalTable();

          Alert({ title: "出庫完成" });
        }
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
  };
  return (
    <>
      {/* 頂部區域 */}
      {step === 1 && <PageHeader title={`請點擊清單銷貨單號、銷貨單條碼`} backTo="/workspace" />}
      {orderCode && step === 2 && <PageHeader title={`檢視完出庫資訊確認沒問題，請點擊確定按鈕`} />}
      {step === 3 && <PageHeader title={`整板拉走後或揀選完請點擊實體站點按鈕或介面退回貨架按鈕`} />}
      {/*{step === 3 && (
        <button
          onClick={() => {
            // 模擬 socket 收到 push_button
            dispatch(setOutboundExternal({
              station: currentStationSafe,
              pushButton: {
                action: "push_button",
                STATION: currentStationSafe,
                PURPOSE: 0
              }
            }));
          }}
          className="bg-red-500 text-white p-2 rounded"
        >
          測試實體按鈕
        </button>
      )}*/}
      {/* 主要內容區域 */}
      <div className="flex gap-4 py-2 items-stretch h-[72vh]">
        {/* 左側 */}
        <div className="w-[47%] flex flex-col">
          <div className="flex-1 min-h-0">
            <OutboundExternalTable
              data={tableData}
              selectedArray={selected || []}
              setSelectedArray={(updater) => {
                const newSelected = typeof updater === "function" ? updater(selected || []) : updater;
                dispatch(setOutboundExternal({ station: currentStationSafe, selected: newSelected }));
              }}
              detailTableData={detailTableData}
              setDetailTableData={setDetailTableData}
            />
          </div>
        </div>
        {/* 右側 */}
        <div className="w-[53%] flex flex-col">
          {/* 條碼 */}
          <div className="flex space-x-4">
            {/* 銷貨單條碼 */}
            <div className="flex items-center p-4">
              <label htmlFor="order">
                銷貨單條碼<span className="text-lg px-1">:</span>
              </label>
              <div className="w-80 flex items-center gap-2">
                <InputFrame type="text" name="orderCode" id="order" ref={orderBarCodeRef} onKeyDown={handleOrderBarCode} value={orderInput} onChange={(e) => setOrderInput(e.target.value)} />
                {askingOrder && <span className="text-orange-500">查詢中...</span>}
              </div>
            </div>
            {/* 外箱條碼 */}
            {step === 3 && (
              <div className="flex flex-1 items-center">
                <label className="font-bold text-black">外箱條碼:</label>
                <div className="w-50 flex items-center gap-2">
                  <InputFrame type="text" ref={boxBarcodeRef} onKeyDown={handleBoxBarcode} disabled={scanning} />
                  {scanning && <span>處理中...</span>}
                </div>
              </div>
            )}
          </div>
          {/* 資料 */}
          <div className="flex flex-col flex-1 min-h-0 bg-white p-8 pb-4">
            {/* 內容區 */}
            {step <= 2 ? (
              orderCode &&
              groupedOrderDetail?.map((shelveGroup, index) => (
                <SchematicDiagramList key={shelveGroup.SHELVE_ID}>
                  {/* 貨架編號、庫別 */}
                  <div className="flex justify-between items-center mb-4 text-3xl">
                    <div>貨架編號:{shelveGroup.SHELVE_ID}</div>
                    <div>出庫庫別:{shelveGroup.STOCK_AREA}</div>
                  </div>
                  {/* 該貨架的所有產品 */}
                  {shelveGroup.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="border-t border-[#c4a57b] pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0">
                      <div className="flex justify-between text-3xl">
                        <div>產品品號:{item?.PRT_NO}</div>
                        <div>棧板規格:{item?.type}</div>
                      </div>
                      <div className="text-3xl">品名: {item?.PRT_NAME}</div>
                      <div className="flex justify-between text-3xl">
                        <div>箱數: {item?.BOX_NO} 箱</div>
                        <div>包數: {item?.PP_NO} 包</div>
                      </div>
                    </div>
                  ))}
                  {/* 進度 */}
                  <div className="text-3xl text-right mt-4">
                    {index + 1}/{groupedOrderDetail?.length}
                  </div>
                </SchematicDiagramList>
              ))
            ) : (
              <SchematicDiagram>
                <div className="flex flex-col text-3xl">
                  <div className="flex justify-between">
                    <div>貨架編號:{shelf?.SHELVE_ID}</div>
                    <div>出庫庫別:{shelf?.area}</div>
                  </div>
                </div>
                {shelfItem?.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-3xl">
                      <div>產品品號:{item?.PRT_NO}</div>
                      <div>棧板規格:{item?.type}</div>
                    </div>
                    <div className="text-3xl">
                      <div>品名: {item?.PRT_NAME}</div>
                      <div className="flex justify-between">
                        <div>箱數: {item?.BOX_NO} 箱</div>
                        <div>包數: {item?.PP_NO} 包</div>
                        <div>
                          {index + 1}/{shelfItem?.length}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </SchematicDiagram>
            )}
            {/* 按鈕區 */}
            <div className="flex flex-1 flex-col justify-end items-center  p-4">
              {step <= 2 && <ActionBtn text="確定" variant="orange" onClick={() => setConfirmModal(true)} disabled={!waveNo} />}
              {step > 2 && <ActionBtn icon="" text="退回貨架" variant="orange" onClick={() => setReturnModal(true)} />}
            </div>
          </div>
        </div>
      </div>
      {/* 站點 */}
      <div className="w-full flex justify-between gap-4 z-20">
        {stations.map((station, i) => (
          <ActionBtn key={i} text={station} variant={lackStation?.includes(station) ? "green" : "green"} disabled={currentStation === station ? true : false} onClick={() => handleSwitchStation(station)} className="flex-1" />
        ))}
      </div>
      {/* loading */}
      {screen === "loading" && <LoadingShelf />}
      {loading && <Loading />}

      {/* Modal - 確認出庫 */}
      <Modal
        showModal={confirmModal}
        title="確認出庫"
        onClose={() => setConfirmModal(false)}
        onConfirm={() => {
          setConfirmModal(false);
          handleOrderConfrim();
        }}
        width="30vw"
        height="auto"
      >
        <div className="text-xl text-center">
          <p>確定要出庫此訂單嗎？</p>
          <p className="font-bold mt-2">{orderCode}</p>
        </div>
      </Modal>

      {/* Modal - 退回貨架 */}
      <Modal
        showModal={returnModal}
        title="退回貨架"
        onClose={() => setReturnModal(false)}
        onConfirm={() => {
          setReturnModal(false);
          handleReturnShelf();
        }}
        width="30vw"
        height="auto"
      >
        <div className="text-xl text-center">
          <p>確定要退回貨架嗎？</p>
          <p className="font-bold mt-2">貨架編號：{shelf?.SHELVE_ID}</p>
        </div>
      </Modal>
    </>
  );
}
