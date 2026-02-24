import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import ActionBtn from "@/components/common/btns/actionBtn";
import InputFrame from "@/components/common/input/inputFrame";
import { resetInbound, selectShelf, setInbound, updateShelfItem } from "@/redux/reducer/reducerInbound";
import SchematicDiagram from "../../components/diagram/schematicDiagram";
import InboundTable from "@/components/inbound/inboundTable";
import SchematicDiagramList from "@/components/diagram/schematicDiagramList";
import Alert from "@/components/common/alert/alert";
import Modal from "@/components/common/modal/modal";
import {
  getERP,
  getTable,
  getList,
  confrimList_in,
  addShelf_in,
  checkCar,
  returnShelf_in,
  restoreList_in,
  cancelShelf_in,
  onToShelf_in,
  finishList_in,
  checkTask_in,
  addTask_in,
  deleteTask_in,
  searchWMS_in,
  updateWMS_in,
  searchWMSBynoSALE_in,
  decryptBarCodePRTNO_in,
  resend_job_in,
} from "./inboundFunction";
import { checkNodePos, checkOrder, checkOrderDetail, sendToWMS, updateTask } from "@/pages/api";
import LoadingText from "../common/loading/loading-text";
import { FaTrashAlt } from "react-icons/fa";
import { MdShelves } from "react-icons/md";
import { setCurrentStation } from "@/redux/reducer/reducerWorkStations";
import toast from "react-hot-toast";
import LoadingShelf from "../common/loading/loading-shelf";
import { generateRandomNumber } from "@/utils/random";

export default function InboundContext({ barCodeRef, setLoading }) {
  const dispatch = useDispatch();
  const [originalData, setOriginalData] = useState([]); //原始抓到的入庫資料
  const [tableData, setTableData] = useState([]); // 入庫單資訊
  const [tableData2, setTableData2] = useState([]); // 入庫單上的明細
  const [addModal, setAddModal] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [wmsData, setWMSData] = useState([]);

  const { stations, currentStation } = useSelector((s) => s.workstation);
  const currentStationSafe = currentStation || stations?.[0] || "";
  const inbound = useSelector((s) => s.inbound);
  const { orderList } = useSelector((s) => s.inbound);
  const { step, screen, orderCode, order, shelf, shelfItem, selected, waveNo, shelves, remark, job } = useSelector((s) => s.inbound[currentStationSafe] || {});

  // ============================
  // ⭐ 貨架顯示用的資料
  // ============================
  const displayItems = useMemo(() => {
    const shelfList = Array.isArray(shelfItem) ? shelfItem : [];
    const selectedList = Array.isArray(selected) ? selected : [];
    const tempMap = new Map(shelfList.map((item) => [item?.PRT_NO, { ...item, selectedBox: 0, selectedPP: 0, isNew: false }]));

    selectedList.forEach((sel) => {
      if (!sel?.PRT_NO) return;
      if (tempMap.has(sel.PRT_NO)) {
        const exist = tempMap.get(sel.PRT_NO);
        exist.selectedBox += Number(sel.BOX_NO) || 0;
        exist.selectedPP += Number(sel.PP_NO) || 0;
        exist.REMARK = sel.REMARK;
      } else {
        tempMap.set(sel.PRT_NO, {
          ...sel,
          BOX_NO: 0,
          PP_NO: 0,
          selectedBox: Number(sel.BOX_NO) || 0,
          selectedPP: Number(sel.PP_NO) || 0,
          isNew: true,
          REMARK: sel.REMARK,
        });
      }
    });
    return Array.from(tempMap.values());
  }, [shelfItem, selected]);

  // ============================
  // ⭐ 事件處理
  // ============================
  const handleBarCode = async (e) => {
    if (screen === "loading" || e.key !== "Enter") return;

    const inputBarCode = e.target.value.trim().toUpperCase();
    if (!inputBarCode) return;

    // 檢查是否含有中文字或全形字 (Regex: /[^\x00-\xff]/ 匹配雙位元字元)
    if (/[^\x00-\xff]/.test(inputBarCode)) {
      e.preventDefault();
      Alert({ title: "偵測到非預期字元，請確保為英文輸入模式" });
      barCodeRef.current.value = "";
      return;
    }

    const matchedOrder = tableData.some((item) => item?.INSTOCK_NO === inputBarCode);

    if (matchedOrder) {
      const value = tableData.find((item) => item?.INSTOCK_NO === inputBarCode);
      dispatch(setInbound({ station: currentStation, order: value, orderCode: value?.INSTOCK_NO, waveNo: value?.W_ID, step: 2 }));
      barCodeRef.current.value = "";
    } else {
      await getERP(setLoading, inputBarCode, setTableData, setOriginalData, orderList);
    }
  };
  const handleConfirmList = async () => {
    if (!waveNo) {
      Alert({ title: "您未選擇入倉單" });
      return;
    }
    const task = await checkTask_in(stations);
    if (!task?.success) return;
    if (!task?.data?.data?.some((item) => item?.location === "inbound" || item?.location === "")) {
      Alert({ title: "目前有其他任務正在執行" });
      return;
    }

    dispatch(setInbound({ station: currentStation, order: {}, waveNo: null, orderCode: "", step: 1 }));
    const res = await confrimList_in(setLoading, order, stations, shelves);

    if (res?.success) {
      // nodejs 訊息
      if (res.data.data.result === "OK") {
        // labview 訊息
        let lack_station = res?.data?.data?.message2 || [];
        if (typeof lack_station === "string") {
          try {
            lack_station = JSON.parse(lack_station.replace(/'/g, '"'));
          } catch (e) {
            lack_station = [];
          }
        }
        lack_station.forEach((st) => {
          dispatch(setInbound({ station: st, screen: "loading", orderCode: orderCode, waveNo: order.W_ID, order: order, orderList: orderCode, lackStation: st }));
        });
        setTableData((prev) => prev.filter((v) => v.INSTOCK_NO !== orderCode && v.STATUS == 0));
        await addTask_in(stations);
      } else {
        Alert({ title: `${res?.data?.data?.message}` });
      }
    } else {
      Alert({ title: `${res?.error?.message}` });
    }
  };
  const handleConfirmShelf = async () => {
    if (!currentStation) {
      Alert({ title: "抓不到站點位置" });
      return;
    }
    if (selected.length <= 0) {
      Alert({ title: "沒有選擇項目" });
      return;
    }

    // 先確認這個東西要的棧板
    let PALLET_NO = shelf?.PALLET_NO;
    if (!shelf?.PALLET_NO && tableData2[0].PALLET_NO) {
      PALLET_NO = "N99";
      // 如果well沒有給PALLET_NO 就確認ORDERDETAIL有沒有PALLET_NO ， 有 = 新增貨架的 / 沒有 = 外購品
    }

    const res = await onToShelf_in(setLoading, selected, shelf, order, dispatch, setInbound, currentStation, setConfirmModal, remark, PALLET_NO);
    if (res?.success) {
      let newShelf = (shelfItem || []).map((s) => ({ ...s }));
      selected.forEach((v) => {
        const index = newShelf.findIndex((s) => s.PRT_NO === v.PRT_NO);
        const mergeUnique = (oldStr, newStr) => {
          const combined = [...new Set([...(oldStr || "").split(","), ...(newStr || "").split(",")])];
          return combined.filter(Boolean).join(",");
        };

        if (index !== -1) {
          newShelf[index] = {
            ...newShelf[index],
            PP_NO: (Number(newShelf[index].PP_NO) || 0) + (Number(v.PP_NO) || 0),
            BOX_NO: (Number(newShelf[index].BOX_NO) || 0) + (Number(v.BOX_NO) || 0),
            INSTOCK_NO: mergeUnique(newShelf[index].INSTOCK_NO, v.INSTOCK_NO),
            MAKE_NO: mergeUnique(newShelf[index].MAKE_NO, v.MAKE_NO),
            SHELVE_ID: shelf.SHELVE_ID,
          };
        } else {
          newShelf.push({ ...v });
        }
      });
      dispatch(updateShelfItem({ station: currentStation, items: newShelf }));
      setTableData2((prev) => prev.filter((row) => !selected.some((v) => v.MAKE_NO === row.MAKE_NO)));
    } else {
      if (res?.code === "ECONNABORTED") {
        try {
          const existingItems = await checkOrderDetail({ W_ID: order.W_ID, PRT_NO: order.PRT_NO, status: 2 });
          const existingNos = existingItems?.data?.data?.map((v) => v.MAKE_NO);
          const remainingData = tableData2.filter((item) => existingNos.includes(item.MAKE_NO));

          if (remainingData.length > 0) {
            let newShelf = (shelfItem || []).map((s) => ({ ...s }));
            selected.forEach((v) => {
              const index = newShelf.findIndex((s) => s.PRT_NO === v.PRT_NO);
              const mergeUnique = (oldStr, newStr) => {
                const combined = [...new Set([...(oldStr || "").split(","), ...(newStr || "").split(",")])];
                return combined.filter(Boolean).join(",");
              };

              if (index !== -1) {
                newShelf[index] = {
                  ...newShelf[index],
                  PP_NO: (Number(newShelf[index].PP_NO) || 0) + (Number(v.PP_NO) || 0),
                  BOX_NO: (Number(newShelf[index].BOX_NO) || 0) + (Number(v.BOX_NO) || 0),
                  INSTOCK_NO: mergeUnique(newShelf[index].INSTOCK_NO, v.INSTOCK_NO),
                  MAKE_NO: mergeUnique(newShelf[index].MAKE_NO, v.MAKE_NO),
                  SHELVE_ID: shelf.SHELVE_ID,
                };
              } else {
                newShelf.push({ ...v });
              }
            });
            dispatch(updateShelfItem({ station: currentStation, items: newShelf }));
            setTableData2((prev) => prev.filter((row) => !selected.some((v) => v.MAKE_NO === row.MAKE_NO)));
            return Alert({ title: "連線逾時但已新增成功" });
          } else {
            return Alert({ title: "上架失敗，請重新再試" });
          }
        } catch (checkErr) {
          return Alert({ title: checkErr?.message });
        }
      }
      if (res?.error?.message) {
        Alert({ title: res?.error?.message });
      }
    }
  };
  const handleAddShelf = async () => {
    if (tableData2.length <= 0) {
      Alert({ title: "入庫單完成", html: `此入庫單已經完成，請選擇「 入庫單完成 」。` });
      return;
    }
    const res = await addShelf_in(setLoading, setAddModal, shelf, order);
    if (!res?.success && res?.error?.message) {
      toast.success(`${res?.error?.message}`);
    } else {
      toast.success("新增成功");
    }
  };
  const handleReturnShelf = async () => {
    setReturnModal(false);
    if (!currentStation) {
      Alert({ html: "抓不到站點位置" });
      return;
    }
    if (tableData2.length <= 0) {
      Alert({ title: "入庫單完成", html: `此入庫單已經完成<br>請選擇「 入庫單完成 」` });
      return;
    }

    const res = await checkCar(waveNo);
    if (res?.success && !res?.data?.data) {
      Alert({
        title: "入倉單未完成",
        html: `此入倉單未完成且只剩下一台車在工作站<br>如果退回將返回選單列表<br>( ※退回後會有部分完成、部分未完成 )`,
        showCancel: true,
        onConfirm: async () => {
          const restore = await restoreList_in(setLoading, waveNo);
          if (restore?.data?.success) await handleCancel();
        },
      });
      return;
    }
    await handleReturn();
  };
  const handleCancel = async () => {
    const res = await cancelShelf_in(setLoading, currentStation);
    if (res?.data?.success) {
      dispatch(resetInbound({ type: "wave", station: currentStation, W_ID: waveNo }));
      deleteTask_in(stations);
    }
  };
  const handleReturn = async () => {
    const res = await returnShelf_in(setLoading, shelf, currentStation, order, remark);
    if (res?.success) dispatch(resetInbound({ type: "one", station: currentStation, W_ID: waveNo }));
  };
  const handleFinish = async () => {
    const res = await finishList_in(setLoading, order, currentStation, shelf, remark);
    if (res?.success) {
      dispatch(resetInbound({ type: "wave", station: currentStation, W_ID: res?.data?.data }));
      toast.success("此單已完成");
      const check = await checkNodePos({ STATION: currentStation });
      if (check?.data?.data?.length <= 0) await deleteTask_in(stations);
    } else {
      if (res?.code === "ECONNABORTED") {
        try {
          const checkRes = await checkOrder({ W_ID: order.W_ID });
          if (checkRes?.data?.data?.STATUS === 2 || checkRes?.data?.data.length == 0) {
            dispatch(resetInbound({ type: "wave", station: currentStation, W_ID: order.W_ID }));
            const check = await checkNodePos();
            if (check?.data?.data?.length <= 0) await deleteTask_in(stations);
            Alert({ title: "連線逾時但訂單已完成" });
          } else {
            Alert({ title: "完成失敗，請重新再試" });
          }
        } catch (checkErr) {
          return Alert({ title: checkErr?.message });
        }
      }
    }
  };
  const handleShelveClick = (shelve) => {
    dispatch(selectShelf({ station: currentStation, shelf: shelve }));
  };
  const handleChangeREMARK = (e) => {
    dispatch(setInbound({ station: currentStation, remark: e.target.value }));
  };
  const handleReSendNewjob = async () => {
    const res = await resend_job_in(currentStation);
    if (res?.data?.data) {
      dispatch(setInbound({ station: currentStation, screen: "loading", step: 2, lackStation: currentStation, waveNo: res?.data?.data?.W_ID, orderList: res?.data?.data?.INSTOCK_NO, orderCode: res?.data?.data?.INSTOCK_NO, order: res?.data?.data?.order }));
      await updateTask({ stations: "A01", location: "inbound" });
    } else {
      toast.success("沒有任務");
    }
  };
  const handleReSendTaskdone = async () => {
    const random = generateRandomNumber();
    const data = { action: "ask_done", STATION: currentStation, dataid: random };
    const res = await sendToWMS(data);
    console.log(res, "123");
    if (res?.data?.data?.result == "ok") {
      toast.success("重抓成功");
      dispatch(setInbound({ step: 3, screen: "working" }));
    } else {
      toast.error(`${res?.data?.data?.result}`);
    }
  };
  // ============================
  // ⭐ 搜尋框
  // ============================
  const timerRef = useRef(null); // 用來存放計時器
  const [searchTerm, setSearchTerm] = useState("");
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // 1. 關鍵：清除「上一次」的計時器（確保只有最後一次會執行）
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // 2. 如果使用者把內容砍光了，立刻重置，不要等 3 秒
    if (value.trim() === "") {
      executeSearch("");
      return;
    }

    // 3. 設定新的計時器
    timerRef.current = setTimeout(() => {
      executeSearch(value);
      timerRef.current = null;
    }, 3000);
  };
  const executeSearch = () => {
    // 1. 先確認輸入框是否存在
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;

    dispatch(resetInbound({ type: "search", station: currentStation, W_ID: waveNo }));
    const keyword = searchInput.value.trim().toUpperCase();
    const filtered = originalData.filter((item) => item.INSTOCK_NO.toUpperCase().includes(keyword) || item?.SALE_NO?.toUpperCase().includes(keyword) || String(item.BILL_TIME || "").includes(keyword) || String(item.CUS_NO || "").includes(keyword));
    setTableData(filtered);
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
    dispatch(resetInbound({ type: "search", station: currentStation, W_ID: waveNo }));
    setTableData(originalData);
  };

  // ============================
  // ⭐ 撈ERP資料 / 顯示入庫單號
  // ============================
  const OrderTitle = () => {
    if (step > 2) {
      return (
        <div className="w-full flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex">
              <label htmlFor="order">
                入倉單條碼<span className="text-lg px-1">:</span>
              </label>
              <div>{orderCode}</div>
            </div>
            <div className="flex">
              <label htmlFor="input">
                外箱號碼<span className="text-lg px-1">:</span>
              </label>
              <InputFrame ref={boxRef} type="text" id="input" inputMode="url" onKeyDown={handleSearchStation} />
            </div>
          </div>

          <div className="flex justify-between">
            <div className="flex items-center">
              <span>客戶</span>
              <span className="text-lg px-1">:</span>
              <span>{order?.CUS_NO}</span>
              <div className="w-[2vw]"></div>
              <span>棧板號</span>
              <span className="text-lg px-1">:</span>
              <span>{shelf?.PALLET_NO}</span>
            </div>
            <div className="flex items-center">
              <span>訂單號</span>
              <span className="text-lg px-1">:</span>
              <span>{order?.SALE_NO}</span>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <>
          <label htmlFor="order">
            入倉單條碼<span className="text-lg px-1">:</span>
          </label>
          <InputFrame id="order" type="text" ref={barCodeRef} onKeyDown={handleBarCode} />
        </>
      );
    }
  };
  // ============================
  // ⭐ Modal 資料加總
  // ============================
  const modalGroupedItems = useMemo(() => {
    if (!selected || selected.length === 0) return [];

    const grouped = selected.reduce((acc, item) => {
      if (!acc[item.PRT_NO]) {
        acc[item.PRT_NO] = {
          ...item,
          PP_NO: Number(item.PP_NO) || 0,
        };
      } else {
        acc[item.PRT_NO].PP_NO += Number(item.PP_NO) || 0;
      }
      return acc;
    }, {});
    return Object.values(grouped);
  }, [confirmModal]);
  const ActionButtons = () => {
    if (step <= 2) return <ActionBtn icon="icon-check" text="確定" variant="orange" onClick={handleConfirmList} disabled={!waveNo} />;
    return (
      <div className="w-full flex justify-between">
        <ActionBtn icon="icon-add" text="新增貨架" variant="orange" onClick={() => setAddModal(true)} />
        {/* <button className="cursor-not-allowed w-50"></button> */}
        <ActionBtn icon="icon-inbound" text="確定上架" variant="orange" onClick={() => setConfirmModal(true)} disabled={selected?.length <= 0} />
        <ActionBtn icon="icon-returnShelf" text="退回貨架" variant="orange" onClick={() => setReturnModal(true)} />
      </div>
    );
  };
  // ============================
  // ⭐ 搜尋 WMS新資料
  // ============================
  const searchWMS = async (data) => {
    const res = await searchWMS_in(data.SALE_NO, data.PRT_NO, data.STOCK_AREA, data.SHELVE_ID, data.INSTOCK_NO, data.W_ID);
    setWMSData(res?.data?.data);
    // PALLET_NO從這裡抓?
  };
  const handleOtherShelve = async () => {
    const res = await searchWMSBynoSALE_in();
    if (res.success) {
      setWMSData(res?.data?.data);
    } else {
      Alert({ title: res?.error?.message });
    }
  };
  // ============================
  // ⭐ 找正確的訂單在哪個站點
  // ============================
  const boxRef = useRef();
  const handleSearchStation = async (e) => {
    if (e.key !== "Enter") return;
    const inputValue = e.target.value;
    const res = await decryptBarCodePRTNO_in(inputValue, inbound);

    if (res?.success) {
      if (res?.data?.data?.station) {
        // 自動跳頁
        dispatch(setCurrentStation(res?.data?.data?.station));
        toast.success(`搜尋成功!`);

        // 自動勾選
        if (res?.data?.data?.station === currentStation) {
          const makeNoSet = new Set(res?.data?.data?.MAKE_NOs || []);
          const selected = tableData2.filter((item) => makeNoSet.has(item.MAKE_NO));
          // 確認是不是這個棧板的
          if (shelf?.PALLET_NO === selected[0]?.PALLET_NO) {
            dispatch(setInbound({ selected: selected, station: res?.data?.data?.station }));
          } else if (shelf?.PALLET_NO === "") {
            toast.error("沒有指定棧板請自行選擇上架貨物");
          } else {
            toast.error("不是此棧板的貨物");
          }
        }
        boxRef.current.focus();
      }
    } else {
      e.preventDefault();
      toast.error(`${res?.error?.message}`);
    }
    boxRef.current.value = "";
  };

  // ============================
  // ⭐ 副作用
  // ============================
  useEffect(() => {
    getTable(setTableData, setOriginalData, orderList);
    // dispatch(clearAllShelves());
  }, [orderList]);
  useEffect(() => {
    if (waveNo) {
      // 重抓之前，先確認有沒有order資料
      getList(waveNo, setTableData2);
      getTable(setTableData, setOriginalData, orderList);
    }
  }, [shelfItem, waveNo]);
  // useEffect(() => {
  //   if (!order) return;
  //   // 2026-1-28 現場討論，告知必須抓出相符條件
  //   // 假設訂單內有SHELVE_ID的陣列
  //   searchWMS(order);
  //   dispatch(clearAllShelves());
  // }, [order]);
  useEffect(() => {
    // 延遲 100ms 是為了確保 DOM 已經完全渲染並出現在畫面上
    // 特別是如果你有切換動畫或 Step 切換
    const timer = setTimeout(() => {
      if (step <= 2 && barCodeRef.current) {
        barCodeRef.current.focus();
      } else if (step > 2 && boxRef.current) {
        boxRef.current.focus();
        boxRef.current.select();
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [currentStation, step]);

  return (
    <>
      <div className="flex gap-4 py-2 items-stretch h-[72vh]">
        {/* 左側表格 */}
        <div className="w-[47%] flex flex-col">
          {step <= 2 && (
            <div className="flex p-2 items-center justify-between">
              <div className="w-full relative">
                <input
                  type="text"
                  id="searchInput"
                  value={searchTerm}
                  placeholder="搜尋 入倉單號 或 訂單單號 ..."
                  className="w-full bg-white py-2 pl-4 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  onChange={handleSearch}
                  onKeyDown={handleSearchKeyDown}
                />
                <div className="absolute inset-y-0 right-5 flex items-center " onClick={handleDeleteInput}>
                  <FaTrashAlt />
                </div>
              </div>
            </div>
          )}
          {step > 2 && (
            <div className="flex p-2 items-center justify-end">
              {/* <div className="flex-1">
                {shelf?.EstBoxes > 0 && (
                  <div className="flex items-end gap-x-2">
                    <span>建議入倉總數:</span>
                    <span className="text-4xl">{shelf?.EstPPs}</span>
                    <span className="pr-4">{shelf?.UNIT}</span>
                    <span className="text-4xl">{shelf?.EstBoxes}</span>
                    <span>箱</span>
                  </div>
                )}
              </div> */}
              <ActionBtn icon="icon-check" text="入倉單完成" variant="orange" disabled={tableData2.length > 0} onClick={handleFinish} />
            </div>
          )}
          <div className="flex-1 min-h-0 text-sm">
            <InboundTable data={tableData} data2={tableData2} setData2={setTableData2} />
          </div>
        </div>

        {/* 右側資訊區 */}
        <div className={`${step <= 2 ? `w-[53%]` : `w-[53%]`} flex flex-col`}>
          <div className="flex items-center justify-between p-4">
            <OrderTitle />
          </div>
          <div className="flex flex-col flex-1 min-h-0 justify-between bg-white p-8 pb-4 h-full overflow-hidden">
            {orderCode && (
              <div className="h-full custom-scrollbar" style={{ "--scrollbar-thumb-color": `var(--green-vivid)` }}>
                {step <= 2 ? (
                  <ActionOrderList order={order} data={tableData2} wmsData={wmsData} shelves={shelves} handleShelveClick={handleShelveClick} handleOtherShelve={handleOtherShelve} />
                ) : (
                  <ShelfData shelf={shelf} remark={remark} displayItems={displayItems} handleChangeREMARK={handleChangeREMARK} />
                )}
              </div>
            )}

            <div className="flex flex-col justify-end items-center p-4">
              {orderCode && <ActionButtons />}
              {step <= 2 && currentStation?.includes("A") && (
                <button onClick={handleReSendNewjob} className="absolute top-0 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 active:scale-95">
                  <span className="mr-1">🔄</span> 重發任務
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal showModal={confirmModal} title="確認上架" onClose={() => setConfirmModal(false)} onConfirm={handleConfirmShelf} width="39vw" height="40vh">
        <div className="flex flex-col items-center px-16 max-h-35 overflow-y-auto custom-scrollbar" style={{ "--scrollbar-thumb-color": `var(--green-vivid)` }}>
          {modalGroupedItems.map((v) => (
            <div key={v.PRT_NO} className="flex justify-between items-center gap-x-6">
              <span className="font-medium text-gray-700">{v.PRT_NO}</span>
              <span className="font-medium text-gray-700">{v.PP_NO}</span>
              <span className="font-medium text-gray-700">{v.UNIT}</span>
            </div>
          ))}
        </div>
      </Modal>
      <Modal
        showModal={addModal}
        title="新增貨架"
        onClose={() => setAddModal(false)}
        onConfirm={() => {
          setAddModal(false);
          handleAddShelf();
        }}
        width="39vw"
        height="40vh"
      >
        確定是否新增貨架
      </Modal>
      <Modal showModal={returnModal} title="退回貨架" onClose={() => setReturnModal(false)} onConfirm={handleReturnShelf} width="39vw" height="40vh">
        確定是否返回貨架
      </Modal>

      {screen === "loading" && (
        <>
          <LoadingShelf />
          <button onClick={handleReSendTaskdone} className="absolute top-0 z-99 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 active:scale-95">
            <span className="mr-1">🔄</span> 重發任務
          </button>
        </>
      )}
    </>
  );
}

// ============================
// ⭐ 貨架上資訊
// ============================
const ActionOrderList = ({ order, data, wmsData, shelves, handleShelveClick, handleOtherShelve }) => {
  return (
    <>
      <SchematicDiagramList>
        {/* 2026/02/05更改版本 */}
        <div className="flex flex-col text-lg">
          <div className="flex justify-between">
            <span className="truncate" title={order?.INSTOCK_NO}>
              入倉單單號: {order?.INSTOCK_NO || ""}
            </span>
            <span>客戶: {order?.CUS_NO || ""}</span>

            <span>入庫庫別: {order?.STOCK_AREA || ""}</span>
          </div>
          <div className="border-t border-white pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0"></div>
          <table className="w-full border-collapse text-left border-collapse">
            <thead className="bg-gray-300 rounded-lg">
              <tr>
                <th className="p-2 w-[25%]">產品品號</th>
                <th className="p-2">品名</th>
                <th className="p-2 w-[12%]">箱數</th>
                <th className="p-2 w-[18%]">包數</th>
                <th className="p-2 w-[10%]">單位</th>
              </tr>
            </thead>
            <tbody>
              {order?.items?.map((v) => (
                <tr className="bg-gray-100 rounded-lg">
                  <td title={v?.PRT_NO} className="truncate p-2">
                    {v?.PRT_NO || ""}
                  </td>
                  <td title={v?.PRT_NAME} className="truncate p-2">
                    {v?.PRT_NAME || ""}
                  </td>
                  <td className="p-2">{v?.Total_Box || ""}</td>
                  <td className="p-2">{v?.Total_PP || ""}</td>
                  <td className="p-2">{v?.UNIT || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SchematicDiagramList>

      {/* 對方說需要顯示WMS再說，WELL算出來的我沒辦法顯示 */}
      {/*wmsData && <div className="border-t-3 border-[#c4a57b] pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0"></div> */}
      {/* {wmsData &&
        wmsData?.map((shelveWMS, index) => (
          <SchematicDiagram>
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-4 w-full">
                <div className="whitespace-nowrap">貨架編號: {shelveWMS?.SHELVE_ID}</div>
                {shelveWMS?.CUS_NO && <div className="whitespace-nowrap">客戶: {shelveWMS?.CUS_NO}</div>}
                <div className="flex-1 flex items-center gap-2 truncate" title={shelveWMS?.REMARK}>
                  備註:{shelveWMS?.REMARK}
                </div>
                <div>入庫庫別: {shelveWMS?.STOCK_AREA}</div>
              </div>
              <div className="border-t border-[#c4a57b] pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0"></div>
              <table className="w-full border-collapse text-left border-collapse">
                <thead className="bg-gray-300 rounded-lg">
                  <tr>
                    <th className="rounded-tl-xl p-2 w-[25%]">產品品號</th>
                    <th className="p-2">品名</th>
                    <th className="p-2 w-[12%]">總箱數</th>
                    <th className="p-2 w-[18%]">總包數</th>
                    <th className="rounded-tr-xl p-2 w-[10%]">單位</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-100 rounded-lg">
                  {shelveWMS?.items?.map((item) => (
                    <ShelfItemRow key={`${item.PRT_NO}-${index}`} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          </SchematicDiagram>
        ))} */}

      {/* 顯示wms抓的 2026/02/05 討論不需要了 樓下刷單       
      {wmsData ? (
        wmsData.length > 0 ? (
          <>
            <div className="h-px bg-gradient-to-r from-transparent via-slate-400 to-transparent opacity-50 my-8"></div>
            <div>
              {(() => {
                const caseMap = {
                  1: "以下為匹配「同訂單號」與「同產品號」貨架",
                  2: "以下為匹配「同訂單號」貨架",
                  3: "以下為匹配「同產品號」且「同庫區」貨架",
                  4: "以下為匹配「同產品號」貨架",
                  5: "以下為匹配「無訂單號」貨架",
                };
                // 取得對應文字，如果都沒有匹配則顯示空字串
                return <div className="text-lg w-full text-center">{caseMap[wmsData[0]?.case] || ""}</div>;
              })()}
            </div>
            {wmsData?.map((shelveWMS, index) => {
              const isSelected = shelves?.some((item) => item?.SHELVE_ID === shelveWMS.SHELVE_ID);
              return (
                <div key={index} onClick={() => handleShelveClick(shelveWMS)} className="cursor-pointer transition-all hover:shadow-lg py-1">
                  <SchematicDiagram isSelected={isSelected}>
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between gap-4 w-full">
                        <div className="whitespace-nowrap">貨架編號: {shelveWMS?.SHELVE_ID}</div>
                        {shelveWMS?.CUS_NO && <div className="whitespace-nowrap">客戶: {shelveWMS?.CUS_NO}</div>}
                        <div className="flex-1 flex items-center gap-2 truncate" title={shelveWMS?.REMARK}>
                          備註:{shelveWMS?.REMARK}
                        </div>
                        <div>總材積: {Number(shelveWMS?.VOLUMNS || 0).toFixed(3)}</div>
                        <div>入庫庫別: {shelveWMS?.STOCK_AREA}</div>
                      </div>
                      <div className="border-t border-[#c4a57b] pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0"></div>
                      <table className="w-full border-collapse text-left border-collapse">
                        <thead className="bg-gray-300 rounded-lg">
                          <tr>
                            <th className="rounded-tl-xl p-2 w-[25%]">產品品號</th>
                            <th className="p-2">品名</th>
                            <th className="p-2 w-[12%]">總箱數</th>
                            <th className="p-2 w-[18%]">總包數</th>
                            <th className="rounded-tr-xl p-2 w-[10%]">單位</th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-100 rounded-lg">
                          {shelveWMS?.items?.map((item, ii) => (
                            <ShelfItemRow key={`${item.PRT_NO}-${index}`} isLast={ii === shelveWMS.items.length - 1} item={item} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </SchematicDiagram>
                </div>
              );
            })}
          </>
        ) : (
          <div className="w-full h-25 flex flex-col items-center justify-center">
            <span>查無資料，確定後隨機配置空貨架</span>
            <button className="text-sm text-gray-400 hover:text-blue-500 hover:underline transition-colors flex items-center gap-1 cursor-pointer" onClick={handleOtherShelve}>
              <MdShelves />
              選擇其他貨架
            </button>
          </div>
        )
      ) : (
        <LoadingText />
      )} */}
    </>
  );
};
const ShelfData = ({ shelf, remark, handleChangeREMARK, displayItems }) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.target.blur();
      toast.success("寫入備註成功!");
    }
  };
  return (
    <SchematicDiagram>
      <div className="flex flex-col gap-2 ">
        <div className="flex items-center justify-between gap-4 w-full">
          <div className="whitespace-nowrap">貨架編號: {shelf?.SHELVE_ID}</div>
          <div>入庫庫別: {shelf?.area}</div>
        </div>
        <div className="flex-1 flex items-center gap-2">
          <span>備註:</span>
          <input type="text" value={remark} placeholder="點擊輸入備註..." className="flex-1 px-2 py-1 outline-none rounded bg-transparent focus:bg-white transition-colors duration-200" onChange={handleChangeREMARK} onKeyDown={handleKeyDown} />
        </div>
        <div className="border-t border-[#c4a57b] pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0"></div>

        <div>
          {displayItems.length === 0 ? (
            <>
              <div className="h-25 flex items-center justify-center text-gray-400">暫無資料</div>
              {shelf?.CARS && (
                <div className="bg-transparent text-right p-2 pr-4">
                  <span>車次：{shelf.CARS}</span>
                </div>
              )}
            </>
          ) : (
            <table className="table-fixed w-full text-left border-collapse">
              <thead className="bg-gray-300 rounded-lg">
                <tr>
                  <th className="rounded-tl-xl p-2 w-[25%]">產品品號</th>
                  <th className="p-2">品名</th>
                  <th className="p-2 w-[18%]">總箱數</th>
                  <th className="p-2 w-[18%]">總包數</th>
                  <th className="rounded-tr-xl p-2 w-[10%]">單位</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item, index) => (
                  <ShelfItemRow key={`${item.PRT_NO}-${index}`} item={item} isLast={index === displayItems.length - 1} index={index} />
                ))}
                {shelf?.CARS && (
                  <tr>
                    <td colSpan={5} className="bg-transparent text-right p-2 pr-4">
                      <span>車次：{shelf.CARS}</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </SchematicDiagram>
  );
};
const ShelfItemRow = ({ item, isLast }) => {
  const isNew = item?.isNew || (item?.selectedBox > 0 && (item?.BOX_NO || 0) === 0);
  return (
    <tr className={`${isNew ? "text-red-500" : ""} bg-gray-100 rounded-lg`}>
      <td className={`p-2 truncate max-w-0`} title={item?.PRT_NO}>
        {item?.PRT_NO}
      </td>
      <td className="p-2 truncate max-w-0" title={item?.PRT_NAME}>
        {item?.PRT_NAME}
      </td>
      <td className="p-2 truncate max-w-0" title={`${item?.BOX_NO}${item?.selectedBox > 0 && `(+${item?.selectedBox})`}`}>
        {item?.BOX_NO}
        <span className="inline-block text-red-500">{item?.selectedBox > 0 && `(+${item?.selectedBox})`}</span>
      </td>
      <td className="p-2 truncate max-w-0" title={`${item?.PP_NO}${item?.selectedPP > 0 && `(+${item?.selectedPP})`}`}>
        {item?.PP_NO} <span className="inline-block text-red-500">{item?.selectedPP > 0 && `(+${item?.selectedPP})`}</span>
      </td>
      <td className={`p-2 truncate max-w-0`} title={item?.UNIT}>
        {item?.UNIT}
      </td>
    </tr>
  );
};
