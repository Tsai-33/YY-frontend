import React, { useEffect, useRef, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import OutboundExternalNewTable from "@/components/outboundExternalNew/outboundExternalNewTable";
import { setCurrentStation, setCurrentJob, updateLackStation } from "@/redux/reducer/reducerWorkStations";
import { setOutboundExternalNew, selectShelf, clearSelectedShelves, clearPushButton, updateLackStation as updateOutboundLackStation, updateOrderList } from "@/redux/reducer/reducerOutboundExternalNew";
import { resetOutboundExternalNew } from "@/redux/reducer/reducerOutboundExternalNew";
import { getOutboundExternal, getOutBoundExternalOrderDetailBySaleNo, sendToWMS, shiftOutOnReturn, updateStatusForOutboundCallCar, decryptBarcode, clearNodePosGGROUP, getRemarkByShelveIds, updateRemark } from "@/pages/api";
import LoadingShelf from "@/components/common/loading/loading-shelf";
import Loading from "@/components/common/loading/loading";
import PageHeader from "@/components/common/pageHeader/pageHeader";
import InputFrame from "@/components/common/input/inputFrame";
import ActionBtn from "@/components/common/btns/actionBtn";
import SchematicDiagram from "@/components/diagram/schematicDiagram";
import SchematicDiagramList from "@/components/diagram/schematicDiagramList";
import { generateRandomNumber } from "@/utils/random";
import Alert from "@/components/common/alert/alert";
import { FaTrashAlt } from "react-icons/fa";
import Modal from "@/components/common/modal/modal";
import { getOutBoundExternalOrderDetailByWID } from "@/pages/api";
import { checkTask_out, addTask_out, deleteTask_out, confrimList_out } from "@/components/outboundExternalNew/outboundExternalNewFunction";

export default function OutboundExternalNew() {
  const dispatch = useDispatch();
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [orderDetail, setOrderDetail] = useState([]);
  const [confirmModal, setConfirmModal] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [orderInput, setOrderInput] = useState("");

  useEffect(() => {
    dispatch(setCurrentJob("銷貨"));
  }, [currentStation, dispatch]);

  const handleSwitchStation = (station) => {
    dispatch(setCurrentStation(station));
  };

  const currentStationSafe = currentStation || stations?.[0] || "";
  const outboundExternalNewState = useSelector((s) => s.outboundExternalNew);
  const { orderList, lackStation } = outboundExternalNewState;

  const outboundExternalNewStateRef = useRef(outboundExternalNewState);
  useEffect(() => {
    outboundExternalNewStateRef.current = outboundExternalNewState;
  }, [outboundExternalNewState]);
  const { step, screen, orderCode, order, shelf, shelfItem, selected, selectedShelves, waveNo, pushButton, remark } = outboundExternalNewState[currentStationSafe] || {};

  // =====根據銷貨單取得細節=====
  useEffect(() => {
    if (order?.SALE_NO && order?.W_ID) {
      fetchOrderDetail(order.SALE_NO, order.W_ID);
    } else {
      setOrderDetail([]);
    }
  }, [order?.SALE_NO, order?.W_ID]);

  useEffect(() => {
    setOrderInput(orderCode || "");
  }, [orderCode]);

  // =====進入step3時 從WMS表抓對應貨架的REMARK作為預設值 =====
  useEffect(() => {
    if (step === 3 && shelf?.SHELVE_ID) {
      const fetchRemark = async () => {
        try {
          const res = await getRemarkByShelveIds([shelf.SHELVE_ID]);
          if (res.data.success && res.data.data?.[shelf.SHELVE_ID]) {
            dispatch(setOutboundExternalNew({ station: currentStationSafe, remark: res.data.data[shelf.SHELVE_ID] }));
          }
        } catch (error) {
          console.warn("fetchRemark:", error);
        }
      };
      fetchRemark();
    }
  }, [step, shelf?.SHELVE_ID]);

  const fetchOrderDetail = async (saleNo, wId) => {
    try {
      console.log("shelfItem: ", shelfItem)
      const res = await getOutBoundExternalOrderDetailBySaleNo(saleNo, wId);
      if (res.data.success) {
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
          REMARK: item.REMARK,
          items: [],
        };
      }
      grouped[id].items.push(item);
    });
    return Object.values(grouped);
  }, [orderDetail]);

  // =====從WMS表抓貨架REMARK=====
  const [shelveRemarks, setShelveRemarks] = useState({});
  useEffect(() => {
    if (groupedOrderDetail.length === 0) return;
    const shelveIds = groupedOrderDetail.map((g) => g.SHELVE_ID);
    const fetchRemarks = async () => {
      try {
        const res = await getRemarkByShelveIds(shelveIds);
        if (res.data.success) {
          setShelveRemarks(res.data.data || {});
        }
      } catch (error) {
        console.warn("fetchRemarks:", error);
      }
    };
    fetchRemarks();
  }, [groupedOrderDetail]);

  // =====搜尋框=====
  let searchTimer;
  const [searchTerm, setSearchTerm] = useState("");
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      executeSearch();
    }, 3000);
  };
  const executeSearch = () => {
    dispatch(setOutboundExternalNew({ station: currentStationSafe, order: {}, orderCode: "", waveNo: null, selectedShelves: [] }));
    const keyword = document.getElementById("searchInput").value.trim().toUpperCase();
    const filtered = originalData.filter((item) => item.OUTSTOCK_NO?.toUpperCase().includes(keyword) || item.SALE_NO?.toUpperCase().includes(keyword));
    setTableData(filtered);
    // 搜到一筆時自動選取並進入 step 2
    if (filtered.length === 1) {
      const value = filtered[0];
      dispatch(setOutboundExternalNew({ station: currentStationSafe, order: value, orderCode: value.OUTSTOCK_NO, waveNo: value.W_ID, step: 2, selectedShelves: [] }));
    }
  };
  const handleSearchKeyDown = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (e.key === "Enter") {
      executeSearch();
    }
  };
  const handleDeleteInput = () => {
    setSearchTerm("");
    dispatch(setOutboundExternalNew({ station: currentStationSafe, order: {}, orderCode: "", waveNo: null, selectedShelves: [] }));
    setTableData(originalData);
  };

  // =====掃銷貨單條碼=====
  const orderBarCodeRef = useRef(null);
  const [askingOrder, setAskingOrder] = useState(false);

  const handleOrderBarCode = async (e) => {
    if (screen === "loading") return;
    if (e.key !== "Enter") return;

    const inputBarCode = e.target.value.trim().toUpperCase();
    if (!inputBarCode) return;

    if (/[^\x00-\xff]/.test(inputBarCode)) {
      Alert({ title: "偵測到非預期字元，請確保為英文輸入模式" });
      return;
    }

    if (orderCode && orderCode === inputBarCode) {
      dispatch(setOutboundExternalNew({ station: currentStationSafe, step: 2 }));
      return;
    }

    const result = tableData.some((item) => item.OUTSTOCK_NO === inputBarCode);
    const [value] = tableData.filter((item) => item.OUTSTOCK_NO === inputBarCode);
    if (result) {
      dispatch(setOutboundExternalNew({ station: currentStationSafe, order: value, orderCode: inputBarCode, waveNo: value.W_ID, step: 2, selectedShelves: [] }));
    } else {
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

            const newMatchedOrder = newData.find((item) => item.OUTSTOCK_NO === inputBarCode);
            if (newMatchedOrder) {
              dispatch(
                setOutboundExternalNew({
                  station: currentStationSafe,
                  order: newMatchedOrder,
                  orderCode: inputBarCode,
                  waveNo: newMatchedOrder.W_ID,
                  step: 2,
                  selectedShelves: [],
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

    setScanning(true);

    try {
      let decryptedBarcode = barcode;
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

      let makeNo = decryptedBarcode;
      if (decryptedBarcode.includes("|")) {
        const parts = decryptedBarcode.split("|");
        if (parts.length >= 3) {
          makeNo = `${parts[0]}-${parts[1]}-${parts[2]}`;
        }
      }

      const matchedItem = detailTableData?.find((item) => item.MAKE_NO === makeNo);

      if (matchedItem) {
        const alreadyScanned = (selected || []).some((p) => p.MAKE_NO === makeNo);

        if (alreadyScanned) {
          Alert({ title: `已掃描過: ${makeNo}`, icon: "warning", timer: 1000 });
        } else {
          dispatch(
            setOutboundExternalNew({
              station: currentStationSafe,
              selected: [
                ...(selected || []),
                {
                  PRT_NO: matchedItem.PRT_NO,
                  MAKE_NO: makeNo,
                  outBoxNo: matchedItem.BOX_NO,
                  outPpNo: matchedItem.PP_NO,
                  ABNORMAL: matchedItem.ABNORMAL || 0,
                },
              ],
            }),
          );
          Alert({ title: `已掃描: ${makeNo}`, icon: "success", timer: 1000 });
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

  useEffect(() => {
    if (step === 3 && boxBarcodeRef.current) {
      boxBarcodeRef.current.focus();
    }
  }, [step]);

  // ===== 選擇貨架  =====
  const handleShelveClick = (shelveGroup) => {
    dispatch(selectShelf({ station: currentStationSafe, shelf: shelveGroup }));
  };

  const handleSelectAllShelves = () => {
    if ((selectedShelves || []).length === groupedOrderDetail.length) {
      // 已全選 -> 取消全選
      dispatch(clearSelectedShelves({ station: currentStationSafe }));
    } else {
      // 全選
      dispatch(setOutboundExternalNew({ station: currentStationSafe, selectedShelves: groupedOrderDetail }));
    }
  };

  // ===== 確認出庫單 =====
  const handleOrderConfrim = async () => {
    if ((selectedShelves || []).length === 0) {
      Alert({ title: "請先選擇要出庫的貨架" });
      return;
    }

    const task = await checkTask_out(stations);
    if (!task?.success) return;
    const hasTask = task?.data?.data?.some((item) => item.location === "outboundExternalNew" || item.location === "outboundExternal" || item.location === "");
    if (!hasTask) {
      Alert({ title: "目前有其他任務正在執行" });
      return;
    }

    // 檢查庫存是否足夠
    try {
      const detailRes = await getOutBoundExternalOrderDetailByWID(order.W_ID);
      if (detailRes.data.success) {
        const demandData = detailRes.data.data || [];

        const demandByPrtNo = {};
        demandData.forEach((item) => {
          const prtNo = item.PRT_NO;
          if (!demandByPrtNo[prtNo]) {
            demandByPrtNo[prtNo] = { PP_NO: 0, BOX_NO: 0 };
          }
          demandByPrtNo[prtNo].PP_NO += item.PP_NO || 0;
          demandByPrtNo[prtNo].BOX_NO += item.BOX_NO || 0;
        });

        // 只檢查被選中的貨架庫存
        const selectedShelveIds = (selectedShelves || []).map((s) => s.SHELVE_ID);
        const stockByPrtNo = {};
        orderDetail?.forEach((item) => {
          if (!selectedShelveIds.includes(item.SHELVE_ID)) return;
          const prtNo = item.PRT_NO;
          if (!stockByPrtNo[prtNo]) {
            stockByPrtNo[prtNo] = { PP_NO: 0, BOX_NO: 0 };
          }
          stockByPrtNo[prtNo].PP_NO += item.PP_NO || 0;
          stockByPrtNo[prtNo].BOX_NO += item.BOX_NO || 0;
        });

        // 只檢查被選中貨架上的 PRT_NO 是否足夠
        const insufficientItems = [];
        for (const prtNo of Object.keys(stockByPrtNo)) {
          const demand = demandByPrtNo[prtNo] || { PP_NO: 0, BOX_NO: 0 };
          const stock = stockByPrtNo[prtNo];
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
      }
    } catch (error) {
      console.warn("檢查庫存失敗:", error);
      Alert({ title: "檢查庫存失敗" });
      return;
    }

    const stationNo = currentStation?.charAt(0);
    const res = await confrimList_out(setLoading, order, stationNo, selectedShelves || []);

    if (res?.success) {
      const resiveData = res?.data?.data;
      if (resiveData?.result?.toUpperCase() === "OK") {
        dispatch(setOutboundExternalNew({ station: currentStation, order: {}, waveNo: null, orderCode: "", step: 1, selectedShelves: [] }));

        await updateStatusForOutboundCallCar({ W_ID: order.W_ID, OUTSTOCK_NO: order.OUTSTOCK_NO });
        let lack_station = resiveData.message2 || [];
        if (!Array.isArray(lack_station)) {
          try {
            lack_station = JSON.parse(lack_station.replace(/'/g, '"'));
          } catch (error) {
            console.warn("lack_station 格式錯誤:", lack_station, error);
            lack_station = [];
          }
        }
        if (lack_station.length > 0) {
          lack_station.map((station) => {
            dispatch(
              setOutboundExternalNew({
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
        setTableData((prev) => prev.filter((v) => v.OUTSTOCK_NO !== orderCode && (v.STATUS === 0 || v.STATUS === 4)));
        await addTask_out(stations);
      } else {
        Alert({ title: resiveData?.message || "出庫確認失敗" });
      }
    } else {
      if (res?.code === "ECONNABORTED") {
        Alert({ title: "連線逾時，請稍後再試或確認 WMS 狀態" });
      } else {
        Alert({ title: res?.error?.message || "伺服器有問題，請稍後再試。" });
      }
    }
  };

  // ====== 退回貨架 ======
  useEffect(() => {
    const handlePushButton = async (stationId) => {
      const stationState = outboundExternalNewState[stationId];
      if (!stationState?.pushButton || stationState?.step !== 3) return;

      try {
        await handleReturnShelfByStation(stationId);
      } catch (err) {
        console.warn("handlePushButton error:", stationId, err);
      } finally {
        dispatch(clearPushButton({ station: stationId }));
      }
    };

    stations.forEach((stationId) => {
      const stationState = outboundExternalNewState[stationId];
      if (stationState?.pushButton && stationState?.step === 3) {
        handlePushButton(stationId);
      }
    });
  }, [JSON.stringify(stations.map(s => outboundExternalNewState[s]?.pushButton))]);

  const handleReturnShelfByStation = async (stationId) => {
    const latestState = outboundExternalNewStateRef.current;
    const stationState = latestState[stationId];
    const stationShelf = stationState?.shelf;
    const stationShelfItem = stationState?.shelfItem;
    const stationSelected = stationState?.selected;
    const stationOrder = stationState?.order;
    const stationOrderCode = stationState?.orderCode;

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
      let itemsToShift = [];

      if ((stationSelected || []).length > 0) {
        itemsToShift = stationSelected;
      } else {
        itemsToShift =
          stationShelfItem?.map((item) => ({
            PRT_NO: item.PRT_NO,
            MAKE_NO: item.MAKE_NO,
            outBoxNo: item.BOX_NO,
            outPpNo: item.PP_NO,
            ABNORMAL: item.ABNORMAL || 0,
          })) || [];
      }

      if (itemsToShift.length === 0) {
        Alert({ title: "沒有出庫的產品" });
        setLoading(false);
        return;
      }

      const preCheckState = outboundExternalNewStateRef.current;
      const preCheckOthers = stations.filter((sid) => {
        if (sid === stationId) return false;
        const sState = preCheckState[sid];
        return sState?.step === 3 && sState?.screen === "working";
      });
      const isLastStation = preCheckOthers.length === 0;

      // 退回前先儲存備註
      const stationRemark = outboundExternalNewStateRef.current[stationId]?.remark;
      if (stationRemark !== undefined) {
        await updateRemark({ shelveId: stationShelf.SHELVE_ID, remark: stationRemark });
      }

      const shiftRes = await shiftOutOnReturn({
        items: itemsToShift,
        waveNo: stationOrder.W_ID,
        saleNo: stationOrder.SALE_NO,
        shelveId: stationShelf.SHELVE_ID,
        station: stationId,
        isFullPallet: (stationSelected || []).length === 0,
        isLastStation,
      });

      if (!shiftRes.data.success) {
        Alert({ title: shiftRes.data.message || "出庫失敗" });
        setLoading(false);
        return;
      }

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
      const res = await sendToWMS(data);
      if (res.data.success) {
        if (isLastStation) {
          try {
            await clearNodePosGGROUP({ waveNo: stationOrder.W_ID });
          } catch (err) {
            console.warn("clearNodePosGGROUP error:", err);
          }
        }

        const currentRefState = outboundExternalNewStateRef.current;
        outboundExternalNewStateRef.current = {
          ...currentRefState,
          [stationId]: {
            ...currentRefState[stationId],
            screen: "loading",
          }
        };

        const latestState2 = outboundExternalNewStateRef.current;
        const otherWorkingStations = stations.filter((sid) => {
          if (sid === stationId) return false;
          const sState = latestState2[sid];
          return sState?.step === 3 && sState?.screen === "working";
        });

        if (otherWorkingStations.length > 0) {
          dispatch(
            setOutboundExternalNew({
              station: stationId,
              screen: "loading",
              shelf: {},
              shelfItem: [],
              selected: [],
            }),
          );
          Alert({ title: `還有 ${otherWorkingStations.length} 個工作站未完成退回貨架` });
        } else {
          stations.forEach((sid) => {
            dispatch(
              setOutboundExternalNew({
                station: sid,
                step: 1,
                screen: "idle",
                orderCode: "",
                waveNo: null,
                order: {},
                shelf: {},
                shelfItem: [],
                selected: [],
                selectedShelves: [],
              }),
            );
          });
          dispatch(updateOutboundLackStation({ type: "clear" }));
          dispatch(updateOrderList({ order: stationOrderCode, type: "sub" }));
          await deleteTask_out(stations);
          await getOutboundExternalNewTable();
          Alert({ title: "出庫完成" });
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
      let itemsToShift = [];

      if ((selected || []).length > 0) {
        itemsToShift = selected;
      } else {
        itemsToShift =
          shelfItem?.map((item) => ({
            PRT_NO: item.PRT_NO,
            MAKE_NO: item.MAKE_NO,
            outBoxNo: item.BOX_NO,
            outPpNo: item.PP_NO,
            ABNORMAL: item.ABNORMAL || 0,
          })) || [];
      }

      if (itemsToShift.length === 0) {
        Alert({ title: "沒有出庫的產品" });
        setLoading(false);
        return;
      }

      const preCheckState = outboundExternalNewStateRef.current;
      const preCheckOthers = stations.filter((sid) => {
        if (sid === currentStation) return false;
        const sState = preCheckState[sid];
        return sState?.step === 3 && sState?.screen === "working";
      });
      const isLastStation = preCheckOthers.length === 0;

      // 退回前先儲存備註
      if (remark !== undefined) {
        await updateRemark({ shelveId: shelf.SHELVE_ID, remark });
      }

      const shiftRes = await shiftOutOnReturn({
        items: itemsToShift,
        waveNo: order.W_ID,
        saleNo: order.SALE_NO,
        shelveId: shelf.SHELVE_ID,
        station: currentStation,
        isFullPallet: (selected || []).length === 0,
        isLastStation,
      });

      if (!shiftRes.data.success) {
        Alert({ title: shiftRes.data.message || "出庫失敗" });
        setLoading(false);
        return;
      }

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
        if (isLastStation) {
          try {
            await clearNodePosGGROUP({ waveNo: order.W_ID });
          } catch (err) {
            console.warn("clearNodePosGGROUP error:", err);
          }
        }

        const currentRefState = outboundExternalNewStateRef.current;
        outboundExternalNewStateRef.current = {
          ...currentRefState,
          [currentStation]: {
            ...currentRefState[currentStation],
            screen: "loading",
          }
        };

        const latestState2 = outboundExternalNewStateRef.current;
        const otherWorkingStations = stations.filter((stationId) => {
          if (stationId === currentStation) return false;
          const stationState = latestState2[stationId];
          return stationState?.step === 3 && stationState?.screen === "working";
        });

        if (otherWorkingStations.length > 0) {
          dispatch(
            setOutboundExternalNew({
              station: currentStation,
              screen: "loading",
              shelf: {},
              shelfItem: [],
              selected: [],
            }),
          );
          Alert({ title: `還有 ${otherWorkingStations.length} 個工作站未完成退回貨架` });
        } else {
          stations.forEach((stationId) => {
            dispatch(
              setOutboundExternalNew({
                station: stationId,
                step: 1,
                screen: "idle",
                orderCode: "",
                waveNo: null,
                order: {},
                shelf: {},
                shelfItem: [],
                selected: [],
                selectedShelves: [],
              }),
            );
          });
          dispatch(updateOutboundLackStation({ type: "clear" }));
          dispatch(updateOrderList({ order: orderCode, type: "sub" }));
          await deleteTask_out(stations);
          await getOutboundExternalNewTable();
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
    getOutboundExternalNewTable();
  }, []);
  const getOutboundExternalNewTable = async () => {
    try {
      const res = await getOutboundExternal();
      if (res.data.success) {
        const newData = res.data.data.filter((v) => !orderList.includes(v.OUTSTOCK_NO));
        setTableData(newData);
        setOriginalData(newData);
        orderBarCodeRef?.current?.focus();
      }
    } catch (error) {
      console.warn(`getOutboundExternalNewTable:`, error);
    }
  };

  return (
    <>
      {/* 頂部區域 */}
      {step === 1 && <PageHeader title={`請點擊清單銷貨單號、銷貨單條碼`} backTo="/workspace" />}
      {orderCode && step === 2 && <PageHeader title={`請點擊選擇要出庫的貨架，再點擊確定按鈕`} />}
      {step === 3 && <PageHeader title={`整板拉走後或揀選完請點擊實體站點按鈕或介面退回貨架按鈕`} />}
      {/* 主要內容區域 */}
      <div className="flex gap-4 py-2 items-stretch h-[72vh]">
        {/* 左側 */}
        <div className="w-[47%] flex flex-col">
          {step <= 2 && (
            <div className="flex p-2 items-center justify-between">
              <div className="w-full relative">
                <input
                  type="text"
                  id="searchInput"
                  value={searchTerm}
                  placeholder="搜尋 OUTSTOCK_NO 或 SALE_NO..."
                  className="w-full bg-white py-2 pl-4 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  onChange={handleSearch}
                  onKeyDown={handleSearchKeyDown}
                />
                <div className="absolute inset-y-0 right-5 flex items-center cursor-pointer" onClick={handleDeleteInput}>
                  <FaTrashAlt />
                </div>
              </div>
            </div>
          )}
          <div className="flex-1 min-h-0">
            <OutboundExternalNewTable
              data={tableData}
              selectedArray={selected || []}
              setSelectedArray={(updater) => {
                const newSelected = typeof updater === "function" ? updater(selected || []) : updater;
                dispatch(setOutboundExternalNew({ station: currentStationSafe, selected: newSelected }));
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
            <div className="flex items-center p-4">
              <label htmlFor="order">
                銷貨單條碼<span className="text-lg px-1">:</span>
              </label>
              <div className="w-80 flex items-center gap-2">
                <InputFrame type="text" name="orderCode" id="order" ref={orderBarCodeRef} onKeyDown={handleOrderBarCode} value={orderInput} onChange={(e) => setOrderInput(e.target.value)} />
                {askingOrder && <span className="text-orange-500">查詢中...</span>}
              </div>
            </div>
            {step === 2 && orderCode && groupedOrderDetail.length > 0 && (
              <div className="flex items-center p-4">
                <button
                  onClick={handleSelectAllShelves}
                  className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
                >
                  {(selectedShelves || []).length === groupedOrderDetail.length ? "取消全選" : "全選貨架"}
                </button>
              </div>
            )}
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
            <div className="custom-scrollbar" style={{ "--scrollbar-thumb-color": `var(--green-vivid)` }}>
              {/* Step 2: 可點擊的貨架卡片 */}
              {step <= 2 ? (
                orderCode && (
                  <>
                    {groupedOrderDetail?.map((shelveGroup, index) => {
                      const isSelected = (selectedShelves || []).some((s) => s.SHELVE_ID === shelveGroup.SHELVE_ID);
                      return (
                        <div key={shelveGroup.SHELVE_ID} className="py-1 cursor-pointer transition-all hover:shadow-lg" onClick={() => handleShelveClick(shelveGroup)}>
                          <SchematicDiagram isSelected={isSelected}>
                            <div className="flex flex-col">
                              <div className="flex items-center justify-between gap-4 w-full">
                                <div className="whitespace-nowrap">貨架編號: {shelveGroup.SHELVE_ID}</div>
                                <div className="flex-1 flex items-center gap-2 truncate" title={shelveRemarks[shelveGroup.SHELVE_ID] || ""}>
                                  備註:{shelveRemarks[shelveGroup.SHELVE_ID]}
                                </div>
                                <div>出庫庫別: {shelveGroup.STOCK_AREA}</div>
                              </div>
                              <div className="border-t border-[#c4a57b] pt-3 mt-3"></div>
                              <table className="w-full border-collapse text-left">
                                <thead className="bg-gray-300 rounded-lg">
                                  <tr>
                                    <th className="rounded-tl-xl p-2 w-[25%]">產品品號</th>
                                    <th className="p-2">品名</th>
                                    <th className="p-2 w-[12%]">總箱數</th>
                                    <th className="rounded-tr-xl p-2 w-[12%]">總包數</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-gray-100 rounded-lg">
                                  {shelveGroup.items.map((item, itemIndex) => (
                                    <tr key={itemIndex} className={itemIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                      <td className={`p-2 ${itemIndex === shelveGroup.items.length - 1 ? "rounded-bl-xl" : ""}`}>{item?.PRT_NO}</td>
                                      <td className="p-2">{item?.PRT_NAME}</td>
                                      <td className="p-2">{item?.BOX_NO}</td>
                                      <td className={`p-2 ${itemIndex === shelveGroup.items.length - 1 ? "rounded-br-xl" : ""}`}>{item?.PP_NO}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </SchematicDiagram>
                        </div>
                      );
                    })}
                  </>
                )
              ) : (
                <SchematicDiagram>
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between gap-4 w-full">
                      <div className="whitespace-nowrap">貨架編號: {shelf?.SHELVE_ID}</div>
                      <div className="flex-1 flex items-center gap-2">
                        <span>備註:</span>
                        <input type="text" value={remark || ""} placeholder="點擊輸入備註..." className="flex-1 px-2 py-1 outline-none rounded bg-transparent focus:bg-white transition-colors duration-200" onChange={(e) => dispatch(setOutboundExternalNew({ station: currentStationSafe, remark: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }} />
                      </div>
                      <div>出庫庫別: {shelf?.area || orderDetail?.[0]?.STOCK_AREA}</div>
                    </div>
                    <div className="border-t border-[#c4a57b] pt-3 mt-3"></div>
                    <div>
                      {shelfItem?.length === 0 ? (
                        <div className="h-25 flex items-center justify-center text-gray-400">暫無資料</div>
                      ) : (
                        <table className="table-fixed w-full text-left border-collapse">
                          <thead className="bg-gray-300 rounded-lg">
                            <tr>
                              <th className="rounded-tl-xl p-2 w-[25%]">產品品號</th>
                              <th className="p-2">品名</th>
                              <th className="p-2 w-[12%]">總箱數</th>
                              <th className="rounded-tr-xl p-2 w-[12%]">總包數</th>
                            </tr>
                          </thead>
                          <tbody>
                            {shelfItem?.map((item, index) => (
                              <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                <td className="p-2">{item?.PRT_NO}</td>
                                <td className="p-2">{item?.PRT_NAME}</td>
                                <td className="p-2">{item?.BOX_NO}</td>
                                <td className="p-2">{item?.PP_NO}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </SchematicDiagram>
              )}
            </div>
            {/* 按鈕區 */}
            <div className="flex flex-1 flex-col justify-end items-center p-4">
              {step <= 2 && (
                <ActionBtn
                  text="確定"
                  variant="orange"
                  onClick={() => setConfirmModal(true)}
                  disabled={!waveNo || (selectedShelves || []).length === 0}
                />
              )}
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
          <p className="text-sm text-gray-500 mt-1">已選擇 {(selectedShelves || []).length} 個貨架</p>
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
