import React, { useEffect, useRef, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import OutboundExternalTable from "@/components/outboundExternal/outboundExternalTable";
import { setCurrentStation, setCurrentJob, updateLackStation } from "@/redux/reducer/reducerWorkStations";
import { setOutboundExternal, clearPushButton, updateLackStation as updateOutboundLackStation, updateOrderList } from "@/redux/reducer/reducerOutboundExternal";
import { resetoutboundInternal } from "@/redux/reducer/reducerOutboundInternal";
import { getOutboundExternal, getOutBoundExternalOrderDetailBySaleNo, sendToWMS, shiftOutOnReturn, updateStatusForOutboundCallCar, decryptBarcode, getOrder, clearNodePosGGROUP } from "@/pages/api";
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
import { checkTask_out, addTask_out, deleteTask_out, confrimList_out } from "@/components/outboundExternal/outboundExternalFunction";

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

  // 進入頁面時清除所有站點的殘留 pushButton
  const hasCleanedPushButton = useRef(false);
  // 防止多個站點同時按下 push_button 時重複顯示「出庫完成」Alert
  const hasCompletedRef = useRef(false);
  useEffect(() => {
    if (!hasCleanedPushButton.current && stations.length > 0) {
      hasCleanedPushButton.current = true;
      stations.forEach((stationId) => {
        dispatch(clearPushButton({ station: stationId }));
      });
    }
  }, [stations]);

  // 目前選擇的工作站
  const handleSwitchStation = (station) => {
    dispatch(setCurrentStation(station));
  };

  // 防止currentStation還沒好就使用會壞掉
  const currentStationSafe = currentStation || stations?.[0] || "";
  // 避免同一張單被很多站使用
  const outboundExternalState = useSelector((s) => s.outboundExternal);
  const { orderList, lackStation } = outboundExternalState;

  // 用 ref 追蹤最新的 outboundExternalState 避免全站點顯示資料被影響
  const outboundExternalStateRef = useRef(outboundExternalState);
  useEffect(() => {
    outboundExternalStateRef.current = outboundExternalState;
  }, [outboundExternalState]);
  const { step, screen, orderCode, order, shelf, shelfItem, selected, waveNo, pushButton } = outboundExternalState[currentStationSafe] || {};
  // eslint-disable-next-line no-console
  console.log("[W_ID-1] 解構 order.W_ID:", order?.W_ID, "waveNo:", waveNo, "station:", currentStationSafe);

  // =====根據銷貨單取得細節=====
  useEffect(() => {
    if (order?.SALE_NO) {
      fetchOrderDetail(order.SALE_NO);
    } else {
      setOrderDetail([]);
    }
  }, [order?.SALE_NO]);

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

    const inputBarCode = e.target.value.trim().toUpperCase();
    if (!inputBarCode) return;

    // 檢查是否含有中文字或全形字 (Regex: /[^\x00-\xff]/ 匹配雙位元字元)
    if (/[^\x00-\xff]/.test(inputBarCode)) {
      Alert({ title: "偵測到非預期字元，請確保為英文輸入模式" });
      return;
    }

    // 如果已經點擊選擇會檢查掃的條碼是否匹配
    if (orderCode && orderCode === inputBarCode) {
      dispatch(setOutboundExternal({ station: currentStationSafe, step: 2 }));
      return;
    }

    // 檢查清單中是否配對到
    const result = tableData.some((item) => item.OUTSTOCK_NO === inputBarCode);
    const [value] = tableData.filter((item) => item.OUTSTOCK_NO === inputBarCode);
    if (result) {
      dispatch(setOutboundExternal({ station: currentStationSafe, order: value, orderCode: inputBarCode, waveNo: value.W_ID, step: 2 }));
    } else {
      // 本地沒找到 → 呼叫 WMS 查詢（不管有沒有已選訂單）
      setAskingOrder(true);
      try {
        const dataId = generateRandomNumber();
        const data = {
          action: "ask_order",
          NO: inputBarCode,
          dataid: dataId,
        };
        const res = await sendToWMS(data);

        if (res.data.success && res.data.data?.result?.toUpperCase() === "OK") {
          const tableRes = await getOutboundExternal();
          if (tableRes.data.success) {
            const newData = tableRes.data.data.filter((v) => !orderList.includes(v.OUTSTOCK_NO));
            setTableData(newData);

            // 再配對一次
            const newMatchedOrder = newData.find((item) => item.OUTSTOCK_NO === inputBarCode);
            if (newMatchedOrder) {
              dispatch(
                setOutboundExternal({
                  station: currentStationSafe,
                  order: newMatchedOrder,
                  orderCode: inputBarCode,
                  waveNo: newMatchedOrder.W_ID,
                  step: 2,
                }),
              );
            } else {
              Alert({ title: "單號已更新但清單中找不到該筆資料，請稍後再試" });
            }
          }
        } else if (res.data.data?.result?.toUpperCase() === "NG") {
          Alert({ title: res.data.data?.message || "無此單號" });
        } else {
          Alert({ title: "查詢單號失敗" });
        }
      } catch (error) {
        console.warn("ask_order 錯誤:", error);
        Alert({ title: "查詢單號失敗" });
      } finally {
        setAskingOrder(false);
        orderBarCodeRef.current.value = "";
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
          const decryptedData = decryptRes?.data?.data || decryptRes?.data;
          if (decryptedData && typeof decryptedData === 'string') {
            decryptedBarcode = decryptedData;
          }
        } catch (decryptError) {
          console.warn("解密失敗，使用原始條碼:", decryptError);
        }
      }
      // 測試 wuc3LX4mNgiArT+JvMQBIFz8SMkpNlmd
      console.log("原始條碼：", barcode);
      console.log("解密後：", decryptedBarcode);

      // 如果解密後是 pipe 分隔格式，轉換成 MAKE_NO 格式
      let makeNo = decryptedBarcode;
      if (decryptedBarcode.includes("|")) {
        const parts = decryptedBarcode.split("|");
        if (parts.length >= 3) {
          makeNo = `${parts[0]}-${parts[1]}-${parts[2]}`;
        }
      }
      console.log("轉換後 MAKE_NO：", makeNo);

      // 從 ORDER_DETAIL 找對應的產品 (有 MAKE_NO) 逗號分隔
      let matchedItem = detailTableData?.find((item) => {
        if (!item.MAKE_NO) return false;
        const makeNos = item.MAKE_NO.split(',').map(m => m.trim());
        return makeNos.includes(makeNo);
      });

      // 從 shelfItem (WMS) 找對應的 PALLET_NO
      const matchedShelfItem = (shelfItem || []).find((item) => {
        const shelfMakeNos = item.MAKE_NO ? item.MAKE_NO.split(',').map(m => m.trim()) : [];
        return shelfMakeNos.includes(makeNo);
      });

      // 如果 detailTableData 找不到，從 shelfItem 找
      if (!matchedItem && matchedShelfItem) {
        matchedItem = matchedShelfItem;
      }

      console.log("比對到的資料:", matchedItem);
      console.log("比對到的貨架資料 (shelfItem):", matchedShelfItem);
      console.log("當前站點 shelfItem:", shelfItem);

      if (matchedItem) {
        // 先檢查這個 MAKE_NO 是否屬於當前站點的貨架
        const currentShelfItem = shelfItem || [];
        const isInCurrentShelf = currentShelfItem.some((item) => {
          if (!item.MAKE_NO) return false;
          const makeNos = item.MAKE_NO.split(',').map(m => m.trim());
          return makeNos.includes(makeNo);
        });

        // 如果不在當前站點的貨架，檢查其他站點
        if (!isInCurrentShelf) {
          const latestState = outboundExternalStateRef.current;
          for (const stationId of stations) {
            if (stationId === currentStationSafe) continue;
            const stationState = latestState[stationId];
            if (stationState?.step !== 3 || stationState?.screen !== "working") continue;

            const otherShelfItem = stationState?.shelfItem || [];
            const isInOtherShelf = otherShelfItem.some((item) => {
              if (!item.MAKE_NO) return false;
              const makeNos = item.MAKE_NO.split(',').map(m => m.trim());
              return makeNos.includes(makeNo);
            });

            if (isInOtherShelf) {
              // 找到了，切換到那個站點並勾選該 MAKE_NO
              const otherSelected = stationState?.selected || [];
              const alreadyScannedInOther = otherSelected.some((p) => p.MAKE_NO === makeNo);

              // 從其他站點的 shelfItem 找到對應的資料
              const otherMatchedShelfItem = otherShelfItem.find((item) => {
                if (!item.MAKE_NO) return false;
                const makeNos = item.MAKE_NO.split(',').map(m => m.trim());
                return makeNos.includes(makeNo);
              });

              if (!alreadyScannedInOther) {
                dispatch(
                  setOutboundExternal({
                    station: stationId,
                    selected: [
                      ...otherSelected,
                      {
                        PRT_NO: matchedItem.PRT_NO,
                        MAKE_NO: makeNo,
                        outBoxNo: 1,
                        outPpNo: otherMatchedShelfItem?.BOX_PACK || matchedItem.BOX_PACK || 0,
                        ABNORMAL: matchedItem.ABNORMAL || 0,
                        PALLET_NO: otherMatchedShelfItem?.PALLET_NO || null,
                      },
                    ],
                  }),
                );
                Alert({ title: `此箱號屬於 ${stationId}，已切換站點並勾選`, icon: "success", timer: 1500 });
              } else {
                Alert({ title: `此箱號屬於 ${stationId}，已切換站點（已勾選過）`, icon: "info", timer: 1500 });
              }
              dispatch(setCurrentStation(stationId));
              return;
            }
          }
        }

        const alreadyScanned = (selected || []).some((p) => p.MAKE_NO === makeNo);

        if (alreadyScanned) {
          Alert({ title: `已掃描過: ${makeNo}`, icon: "warning", timer: 1000 });
        } else {
          dispatch(
            setOutboundExternal({
              station: currentStationSafe,
              selected: [
                ...(selected || []),
                {
                  PRT_NO: matchedItem.PRT_NO,
                  MAKE_NO: makeNo,
                  outBoxNo: 1,
                  outPpNo: matchedShelfItem?.BOX_PACK || matchedItem.BOX_PACK || 0,
                  ABNORMAL: matchedItem.ABNORMAL || 0,
                  PALLET_NO: matchedShelfItem?.PALLET_NO || null,
                },
              ],
            }),
          );
          Alert({ title: `已掃描: ${makeNo}`, icon: "success", timer: 1000 });
        }
      } else {
        // 在 detailTableData 和當前站點 shelfItem 都找不到，檢查其他站點
        const latestState = outboundExternalStateRef.current;
        for (const stationId of stations) {
          if (stationId === currentStationSafe) continue;
          const stationState = latestState[stationId];
          if (stationState?.step !== 3 || stationState?.screen !== "working") continue;

          const otherShelfItem = stationState?.shelfItem || [];
          const matchedOtherShelfItem = otherShelfItem.find((item) => {
            if (!item.MAKE_NO) return false;
            const makeNos = item.MAKE_NO.split(',').map(m => m.trim());
            return makeNos.includes(makeNo);
          });

          if (matchedOtherShelfItem) {
            // 找到後切換到那個站點並勾選該 MAKE_NO
            const otherSelected = stationState?.selected || [];
            const alreadyScannedInOther = otherSelected.some((p) => p.MAKE_NO === makeNo);

            if (!alreadyScannedInOther) {
              dispatch(
                setOutboundExternal({
                  station: stationId,
                  selected: [
                    ...otherSelected,
                    {
                      PRT_NO: matchedOtherShelfItem.PRT_NO,
                      MAKE_NO: makeNo,
                      outBoxNo: 1,
                      outPpNo: matchedOtherShelfItem.BOX_PACK || 0,
                      ABNORMAL: matchedOtherShelfItem.ABNORMAL || 0,
                      PALLET_NO: matchedOtherShelfItem.PALLET_NO || null,
                    },
                  ],
                }),
              );
              Alert({ title: `此箱號屬於 ${stationId}，已切換站點並勾選`, icon: "success", timer: 1500 });
            } else {
              Alert({ title: `此箱號屬於 ${stationId}，已切換站點（已勾選過）`, icon: "info", timer: 1500 });
            }
            dispatch(setCurrentStation(stationId));
            return;
          }
        }
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

    // 檢查庫區是否為 F02
    // const invalidStockArea = orderDetail?.find(item => item.STOCK_AREA !== "F02");
    // if (invalidStockArea) {
    //   Alert({ title: `庫區錯誤：貨架 ${invalidStockArea.SHELVE_ID} 的庫區為 ${invalidStockArea.STOCK_AREA}，非 F02` });
    //   return;
    // }

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
        const insufficientItems = [];
        for (const prtNo of Object.keys(demandByPrtNo)) {
          const demand = demandByPrtNo[prtNo];
          const stock = stockByPrtNo[prtNo] || { PP_NO: 0, BOX_NO: 0 };
          if (stock.PP_NO < demand.PP_NO || stock.BOX_NO < demand.BOX_NO) {
            insufficientItems.push({
              prtNo,
              demandBox: demand.BOX_NO,
              demandPp: demand.PP_NO,
              stockBox: stock.BOX_NO,
              stockPp: stock.PP_NO,
            });
          }
        }

        // 如果有庫存不足的產品 - 直接阻止
        if (insufficientItems.length > 0) {
          const insufficientText = insufficientItems
            .map((item) => `產品 ${item.prtNo}: 需求 ${item.demandBox}箱${item.demandPp}包 / 庫存 ${item.stockBox}箱${item.stockPp}包`)
            .join("\n");

          Alert({
            title: "庫存不足，無法出庫",
            text: insufficientText,
          });
          return;
        }

        // // 如果有庫存不足的產品 - 警告但可繼續
        // if (insufficientItems.length > 0) {
        //   const insufficientText = insufficientItems
        //     .map((item) => `產品 ${item.prtNo}: 需求 ${item.demandBox}箱${item.demandPp}包 / 庫存 ${item.stockBox}箱${item.stockPp}包`)
        //     .join("\n");
        //
        //   const result = await Alert({
        //     title: "庫存不足提醒",
        //     text: `以下產品庫存不足：\n${insufficientText}\n\n是否仍要繼續出庫？`,
        //     showCancel: true,
        //     confirmButtonText: "繼續出庫",
        //     cancelButtonText: "取消",
        //   });
        //
        //   if (!result.isConfirmed) {
        //     return;
        //   }
        // }
      }
    } catch (error) {
      console.warn("檢查庫存失敗:", error);
      Alert({ title: "檢查庫存失敗" });
      return;
    }

    const stationNo = currentStation?.charAt(0);
    const res = await confrimList_out(setLoading, order, stationNo);

    // 檢查 LabVIEW 回傳結果
    if (res?.success) {
      const resiveData = res?.data?.data;
      if (resiveData?.result?.toUpperCase() === "OK") {
        // 清空該站的資料
        // eslint-disable-next-line no-console
        console.log("[W_ID-2] 確認出庫前 order.W_ID:", order.W_ID);
        dispatch(setOutboundExternal({ station: currentStation, order: {}, waveNo: null, orderCode: "", step: 1 }));

        await updateStatusForOutboundCallCar({ W_ID: order.W_ID, OUTSTOCK_NO: order.OUTSTOCK_NO });
        // 存被占用的站點
        let lack_station = resiveData.message2 || [];
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
            // eslint-disable-next-line no-console
            console.log("[W_ID-3] lack_station設定", station, "order.W_ID:", order.W_ID);
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
        Alert({ title: resiveData?.message || "出庫確認失敗" });
      }
    } else {
      // 超時處理
      if (res?.code === "ECONNABORTED") {
        Alert({ title: "連線逾時，請稍後再試或確認 WMS 狀態" });
      } else {
        Alert({ title: res?.error?.message || "伺服器有問題，請稍後再試。" });
      }
    }
  };

  // ====== 退回貨架 ======
  // 接收實體按鈕訊號
  // 監聽所有站點的 pushButton
  useEffect(() => {
    const handlePushButton = async (stationId) => {
      const stationState = outboundExternalState[stationId];
      if (!stationState?.pushButton || stationState?.step !== 3) return;

      try {
        // 使用該站點的資料執行退回
        await handleReturnShelfByStation(stationId);
      } catch (err) {
        console.warn("handlePushButton error:", stationId, err);
      } finally {
        dispatch(clearPushButton({ station: stationId }));
      }
    };

    // 檢查所有站點
    stations.forEach((stationId) => {
      const stationState = outboundExternalState[stationId];
      if (stationState?.pushButton && stationState?.step === 3) {
        handlePushButton(stationId);
      }
    });
  }, [JSON.stringify(stations.map(s => outboundExternalState[s]?.pushButton))]);

  // 根據指定站點執行退回貨架
  const handleReturnShelfByStation = async (stationId) => {
    // 使用 ref 取得最新的 state，避免 stale closure
    const latestState = outboundExternalStateRef.current;
    const stationState = latestState[stationId];
    const stationShelf = stationState?.shelf;
    const stationShelfItem = stationState?.shelfItem;
    const stationSelected = stationState?.selected;
    const stationOrder = stationState?.order;
    const stationOrderCode = stationState?.orderCode;
    console.log("stationOrder: ", stationOrder)

    if (!stationId) {
      Alert({ title: "抓不到站點位置" });
      return;
    }
    if (!stationShelf?.SHELVE_ID) {
      Alert({ title: "找不到貨架資訊" });
      return;
    }
    if (!stationOrder?.W_ID) {
      Alert({ title: "找不到訂單資訊" });
      return;
    }

    setLoading(true);
    try {
      const noItemsSelected = (stationSelected || []).length === 0;

      // 沒有勾選時，詢問是否直接退回貨架
      if (noItemsSelected) {
        const confirmResult = await Alert({
          title: "沒有勾選任何產品",
          text: "是否直接退回貨架？",
          showCancel: true,
          confirmButtonText: "是",
          cancelButtonText: "否",
        });
        if (!confirmResult.isConfirmed) {
          setLoading(false);
          return;
        }
      }

      const itemsToShift = stationSelected || [];

      // 2. 判斷是否為最後一台（決定後端要不要更新ORDER狀態）
      const preCheckState = outboundExternalStateRef.current;
      const preCheckOthers = stations.filter((sid) => {
        if (sid === stationId) return false;
        const sState = preCheckState[sid];
        return sState?.step === 3 && sState?.screen === "working";
      });
      const isLastStation = preCheckOthers.length === 0;

      // 3. 扣庫存（沒勾選時 items 為空，扣的都是 0）
      const shiftRes = await shiftOutOnReturn({
        items: itemsToShift,
        waveNo: stationOrder.W_ID,
        saleNo: stationOrder.SALE_NO,
        shelveId: stationShelf.SHELVE_ID,
        station: stationId,
        isFullPallet: false,
        isLastStation,
      });

      if (!shiftRes.data.success) {
        Alert({ title: shiftRes.data.message || "出庫失敗" });
        setLoading(false);
        return;
      }

      // 4. 退回貨架
      const dataId = generateRandomNumber();
      const data = {
        action: "wcstask",
        dataid: dataId,
        command: "RETURN",
        SHELVE_ID: stationShelf?.SHELVE_ID,
        FACE: 2,
        STATION: stationId,
        PURPOSE: 0,
      };
      console.log("data1: ", data)
      const res = await sendToWMS(data);
      if (res.data.success) {
        // RETURN 成功後清除 NODE_POS 的 GGROUP（只有最後一台才清）
        if (isLastStation) {
          try {
            await clearNodePosGGROUP({ waveNo: stationOrder.W_ID });
          } catch (err) {
            console.warn("clearNodePosGGROUP error:", err);
          }
        }

        // 先同步更新 ref，將當前站點標記為已退回（loading）
        // 這樣並行執行的其他站點函數就能看到這個站點已經退回
        const currentRefState = outboundExternalStateRef.current;
        outboundExternalStateRef.current = {
          ...currentRefState,
          [stationId]: {
            ...currentRefState[stationId],
            screen: "loading",
          }
        };

        // 檢查其他站點是否還有在工作（還沒退回）的
        const latestState = outboundExternalStateRef.current;
        const otherWorkingStations = stations.filter((sid) => {
          if (sid === stationId) return false;
          const sState = latestState[sid];
          // 只有 screen === "working" 且 step === 3 的才是還沒退回的
          return sState?.step === 3 && sState?.screen === "working";
        });

        if (otherWorkingStations.length > 0) {
          dispatch(
            setOutboundExternal({
              station: stationId,
              screen: "loading",
              shelf: {},
              shelfItem: [],
              selected: [],
            }),
          );
          Alert({ title: `還有 ${otherWorkingStations.length} 個工作站未完成退回貨架` });
        } else {
          // 所有工作站都完成了 - 檢查是否已經有其他站點處理過完成邏輯
          if (hasCompletedRef.current) {
            // 已經有站點處理過了，只清理自己的狀態
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
            return;
          }
          hasCompletedRef.current = true;

          stations.forEach((sid) => {
            dispatch(
              setOutboundExternal({
                station: sid,
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
          dispatch(updateOutboundLackStation({ type: "clear" }));
          dispatch(updateOrderList({ order: stationOrderCode, type: "sub" }));
          await deleteTask_out(stations);
          dispatch(resetoutboundInternal());
          await getOutboundExternalTable();
          Alert({ title: "出庫完成" });
          // 重置 flag，讓下一次出庫可以正常顯示
          hasCompletedRef.current = false;
        }
      }
    } catch (error) {
      console.warn("handleReturnShelfByStation", error);
    } finally {
      setLoading(false);
    }
  };

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
      const noItemsSelected = (selected || []).length === 0;

      // 沒有勾選時，詢問是否直接退回貨架
      if (noItemsSelected) {
        const confirmResult = await Alert({
          title: "沒有勾選任何產品",
          text: "是否直接退回貨架？",
          showCancel: true,
          confirmButtonText: "是",
          cancelButtonText: "否",
        });
        if (!confirmResult.isConfirmed) {
          setLoading(false);
          return;
        }
      }

      const itemsToShift = selected || [];

      // 2. 判斷是否為最後一台（決定後端要不要更新ORDER狀態）
      const preCheckState2 = outboundExternalStateRef.current;
      const preCheckOthers2 = stations.filter((sid) => {
        if (sid === currentStation) return false;
        const sState = preCheckState2[sid];
        return sState?.step === 3 && sState?.screen === "working";
      });
      const isLastStation2 = preCheckOthers2.length === 0;

      // 3. 扣庫存（沒勾選時 items 為空，扣的都是 0）
      // eslint-disable-next-line no-console
      console.log("[W_ID-4] handleReturnShelf order.W_ID:", order?.W_ID, "waveNo:", waveNo, "isLastStation:", isLastStation2);
      const shiftRes = await shiftOutOnReturn({
        items: itemsToShift,
        waveNo: order.W_ID,
        saleNo: order.SALE_NO,
        shelveId: shelf.SHELVE_ID,
        station: currentStation,
        isFullPallet: false,
        isLastStation: isLastStation2,
      });

      if (!shiftRes.data.success) {
        Alert({ title: shiftRes.data.message || "出庫失敗" });
        setLoading(false);
        return;
      }

      // 4. 退回貨架
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
      console.log("data2: ", data)
      const res = await sendToWMS(data);
      if (res.data.success) {
        console.log("RETURN_RES: ", res);

        // RETURN 成功後清除 NODE_POS 的 GGROUP（只有最後一台才清）
        if (isLastStation2) {
          try {
            await clearNodePosGGROUP({ waveNo: order.W_ID });
          } catch (err) {
            console.warn("clearNodePosGGROUP error:", err);
          }
        }

        // 先同步更新 ref，將當前站點標記為已退回（loading）
        // 這樣並行執行的其他站點函數就能看到這個站點已經退回
        const currentRefState = outboundExternalStateRef.current;
        outboundExternalStateRef.current = {
          ...currentRefState,
          [currentStation]: {
            ...currentRefState[currentStation],
            screen: "loading",
          }
        };

        // 檢查其他站點是否還有在工作（還沒退回）的
        const latestState = outboundExternalStateRef.current;
        const otherWorkingStations = stations.filter((stationId) => {
          if (stationId === currentStation) return false;
          const stationState = latestState[stationId];
          // 只有 screen === "working" 且 step === 3 的才是還沒退回的
          return stationState?.step === 3 && stationState?.screen === "working";
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
          // 4. 所有工作站都完成了 - 檢查是否已經有其他站點處理過完成邏輯
          if (hasCompletedRef.current) {
            // 已經有站點處理過了，只清理自己的狀態
            dispatch(
              setOutboundExternal({
                station: currentStation,
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
            return;
          }
          hasCompletedRef.current = true;

          // 清空所有站點的資料(出庫會佔滿所有站點)
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
          // 重置 flag，讓下一次出庫可以正常顯示
          hasCompletedRef.current = false;
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

  // ============================
  // ⭐ 產生隨機訂單號 (後續需刪除)
  // ============================
  const handleTest = () => {
    // ===== 前綴隨機 =====
    const prefixes = ["M561"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

    // ===== 民國年月日 =====
    const date = new Date();
    const year = date.getFullYear() - 1911;
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    // ===== 3 碼序號 =====
    const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");

    const passSN = `${prefix}-${year}${month}${day}${seq}`;

    orderBarCodeRef.current.value = passSN;
  };

  // ============================
  // ⭐ 測試解密條碼
  // ============================
  const [testBarcode, setTestBarcode] = useState("");
  const [decryptResult, setDecryptResult] = useState("");
  const handleTestDecrypt = async () => {
    if (!testBarcode.trim()) return;
    try {
      const res = await decryptBarcode({ text: testBarcode.trim() });
      setDecryptResult(res.data.data || "無結果");
    } catch (error) {
      setDecryptResult("解密失敗: " + error.message);
    }
  };

  return (
    <>
      {/* 測試按鈕 */}
      {/* {step <= 2 && <ActionBtn text="測試用-產生單據" className="absolute top-0 right-50 z-25" variant="yellow" onClick={handleTest} />} */}
      {/* 測試解密條碼 */}
      {/* <div className="absolute top-0 right-100 z-25 flex gap-2 items-center bg-white p-2 rounded shadow">
        <input
          type="text"
          placeholder="輸入條碼測試解密"
          value={testBarcode}
          onChange={(e) => setTestBarcode(e.target.value)}
          className="border px-2 py-1 w-60"
          onKeyDown={(e) => e.key === "Enter" && handleTestDecrypt()}
        />
        <button onClick={handleTestDecrypt} className="bg-blue-500 text-white px-3 py-1 rounded">解密</button>
        {decryptResult && <span className="text-green-600 font-bold">{decryptResult}</span>}
      </div> */}
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
                dataid: 22844,
                STATION: currentStationSafe,
                QTY: 0,
                WALLPOS: 5,
                pageno: "",
                finish: "ON"
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
        <div className="w-[53%] flex flex-col overflow-hidden">
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
          <div className="flex flex-col bg-white p-8 pb-4 h-full justify-between overflow-hidden">
            <div className="custom-scrollbar " style={{ "--scrollbar-thumb-color": `var(--green-vivid)` }}>
              {/* 內容區 */}
              {step <= 2 ? (
                orderCode &&
                groupedOrderDetail?.map((shelveGroup, index) => (
                  <div className="pb-4">
                    <SchematicDiagramList key={shelveGroup.SHELVE_ID}>
                      {/* 貨架編號、庫別 */}
                      <div className="flex justify-between items-center">
                        <div>貨架編號:{shelveGroup.SHELVE_ID}</div>
                        <div>出庫庫別:{shelveGroup.STOCK_AREA}</div>
                      </div>
                      {/* 該貨架的所有產品 */}
                      {shelveGroup.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="border-t border-[#c4a57b] pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0">
                          <div className="flex flex-col">
                            <div className="flex justify-between">
                              <div>產品品號:{item?.PRT_NO}</div>
                              {/* <div>棧板規格:{item?.type}</div> */}
                            </div>
                          </div>
                          <div>品名: {item?.PRT_NAME}</div>
                          <div className="flex gap-16">
                            <div>箱數: {item?.BOX_NO} 箱</div>
                            <div>包數: {item?.PP_NO} 包</div>
                          </div>
                        </div>
                      ))}
                      {/* 進度 */}
                      <div className="text-right">
                        {index + 1}/{groupedOrderDetail?.length}
                      </div>
                    </SchematicDiagramList>
                  </div>
                ))
              ) : (
                <SchematicDiagram>
                  <div className="flex flex-col">
                    <div className="flex justify-between">
                      <div>貨架編號:{shelf?.SHELVE_ID}</div>
                      <div>出庫庫別:{shelf?.area || orderDetail?.[0]?.STOCK_AREA}</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-16">
                    {shelfItem?.map((item, index) => (
                      <div key={index} className="flex flex-col">
                        <div className="flex justify-between text-3xl">
                          <div>產品品號:{item?.PRT_NO}</div>
                          {/* <div>棧板規格:{item?.type}</div> */}
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
                  </div>
                </SchematicDiagram>
              )}
            </div>
            {/* 按鈕區 */}
            <div className="flex flex-1 flex-col justify-end items-center p-4">
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
