import React, { useEffect, useState, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import ActionBtn from "@/components/common/btns/actionBtn";
import InputFrame from "@/components/common/input/inputFrame";
import SchematicDiagram from "../../components/diagram/schematicDiagram";
import SchematicDiagramList from "@/components/diagram/schematicDiagramList";
import Alert from "@/components/common/alert/alert";
import Modal from "@/components/common/modal/modal";
import TransferTable from "@/components/transfer/transferTable";
import { resetTransfer, setAllLoading, setTransfer, updateShelfItem } from "@/redux/reducer/reducerTransfer";
import { addAbnormal_tr, addShelf_tr, addTask_tr, cancelShelf_tr, checkTask_tr, checkWCS_tr, confrimList_tr, deleteTask_tr, finishList_tr, getEPR, getList, getTable, resend_check_tr, restoreList_tr, returnShelf_tr, updateWMS_tr } from "@/components/transfer/transferFunction";
import { restoreTransfer, sendToWMS, updateTask } from "@/pages/api";
import { FaTrashAlt } from "react-icons/fa";
import LoadingShelf from "../common/loading/loading-shelf";
import { generateRandomNumber } from "@/utils/random";
import toast from "react-hot-toast";

/**
 * 調撥系統核心上下文組件 (TransferContext)
 * 處理條碼掃描、工作站邏輯、貨架增刪以及與 WMS/ERP 系統的交互
 * * @param {Object} props
 * @param {React.RefObject} props.barCodeRef - 綁定外部 input 的 ref，用於自動聚焦與清空值
 * @param {Function} props.setLoading - 控制全域 Loading 遮罩的狀態函式
 */

export default function TransferContext({ barCodeRef, setLoading }) {
  const dispatch = useDispatch();
  const [originalData, setOriginalData] = useState([]); //原始抓到的資料
  const [tableData, setTableData] = useState([]); // 調撥單資訊
  const [tableDataTotal2, setTableTotalData2] = useState([]); // 調撥單上的所有明細
  const [tableData2, setTableData2] = useState([]); // 調撥單上的明細
  const [addModal, setAddModal] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [finishModal, setFinishModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [wmsModal, setWmsModal] = useState(false);
  const [abData, setAbData] = useState();
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const currentStationSafe = currentStation || stations?.[0] || "";
  const transfer = useSelector((s) => s.transfer);
  const { step, orderCode, order, waveNo } = useSelector((s) => s.transfer);
  const { job, screen, shelf, shelfItem, selected, remark } = useSelector((s) => s.transfer[currentStationSafe] || {});

  const filteredItems = useMemo(() => {
    return tableData2.filter((v) => {
      const prefix = v?.OUTSTOCK_NO?.split("-").slice(0, 2).join("-");
      return prefix == orderCode;
    });
  }, [tableData2, orderCode]);

  /**
   * 處理條碼輸入 (Enter 鍵觸發)
   * 包含防呆檢查（全形字元偵測）與單據自動匹配
   * 與ERP 連接配對資料 有=選取 沒有=新增
   */
  const handleBarCode = async (e) => {
    if (screen === "loading" || e.key !== "Enter") return;

    const inputBarCode = e.target.value.trim().toUpperCase();
    if (!inputBarCode) return;

    if (/[^\x00-\xff]/.test(inputBarCode)) {
      e.preventDefault();
      Alert({ title: "偵測到非預期字元，請確保為英文輸入模式" });
      barCodeRef.current.value = "";
      return;
    }

    const matchedOrder = tableData.find((item) => item?.INSTOCK_NO === inputBarCode);

    if (matchedOrder) {
      const value = tableData.find((item) => item.INSTOCK_NO === inputBarCode);
      dispatch(
        setTransfer({
          station: currentStation,
          order: value,
          orderCode: value?.INSTOCK_NO,
          waveNo: value?.W_ID,
          step: 2,
        }),
      );

      barCodeRef.current.value = "";
    } else {
      await getEPR(setLoading, inputBarCode, setTableData, setTableTotalData2, setOriginalData);
    }
  };
  const handleConfirmList = async () => {
    if (!waveNo) {
      Alert({ title: "您未選擇調撥單" });
      return;
    }

    // 確認是否有其他任務
    const task = await checkTask_tr(stations);
    if (!task?.success) return;
    const hasTask = task?.data?.data?.some((item) => item.location === "transfer" || item.location === "");
    if (!hasTask) {
      Alert({ title: "目前有其他任務正在執行" });
      return;
    }

    const resiveData = await confrimList_tr(setLoading, order);
    if (resiveData?.result === "NG") {
      Alert({ title: `${resiveData?.message}` });
    } else if (resiveData?.message2.length > 0) {
      resiveData?.message2?.map((station) => {
        dispatch(setTransfer({ station: station, orderCode: orderCode, waveNo: order.W_ID, order: order, lackStation: station }));
      });
      dispatch(setAllLoading({ stations: stations }));
      await addTask_tr(stations);
    } else {
      Alert({ title: `伺服器有問題，請稍後再試。` });
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

    if (transfer[stations[0]]?.job[0]?.PRT_NO !== job[0]?.PRT_NO) {
      setConfirmModal(false);
      toast.error("不是上在這個目的貨架上");
      return;
    }

    const res = await updateWMS_tr(setLoading, selected, shelf, order, transfer[stations[0]], setConfirmModal, remark);
    if (res?.data?.data === "success") {
      const detail = selected.map((s) => tableData2.find((de) => de.PRT_NO === s.PRT_NO));
      dispatch(updateShelfItem({ station: currentStation, items: detail, ppStation: stations[0] }));
      getList(waveNo, setTableData2);
    } else if (!res?.success) {
      Alert({ title: `${res?.error.message}` });
    }

    dispatch(setTransfer({ station: currentStation, selected: [] }));
  };
  const handleAddShelf = async () => {
    if (tableData2.length <= 0) {
      Alert({ title: "調撥單完成", html: `此調撥單已經完成，請選擇「 調撥單完成 」。` });
      return;
    }
    const res = await addShelf_tr(setLoading, setAddModal, shelf, order, currentStation);
    if (!res?.success && res?.error) {
      Alert({ title: `${res?.error.message}` });
    }
  };
  const handleReturnShelf = async () => {
    setReturnModal(false);

    if (!currentStation) {
      Alert({ title: "抓不到站點位置" });
      return;
    }

    const isAllCompleted = tableData2.every((item) => item.STATUS === 2 || item.STATUS === 5);
    if (isAllCompleted) {
      Alert({ title: "請選擇「完成調撥」" });
      return;
    }

    if (currentStation === stations[0]) {
      const data = tableData2.find((item) => item.PRT_NO === job[0].PRT_NO);
      if (data.STATUS === 1) {
        Alert({ title: "尚未完成" });
        return;
      }
    } else {
      if (job.length > 0) {
        toast.error("您未上架完成");
        return;
      }
    }

    await handleReturn();
  };

  const handleCancel = async () => {
    const res = await cancelShelf_tr(setLoading, currentStation);
    if (res?.data?.success) {
      dispatch(resetTransfer({ type: "all", station: stations }));
    }
  };
  const handleReturn = async () => {
    const res = await returnShelf_tr(setLoading, shelf, currentStation, order, remark);
    console.log(res.data);
    if (res?.data?.success) {
      dispatch(resetTransfer({ type: "one", station: currentStation, W_ID: waveNo }));
    }
  };
  const handleFinish = async () => {
    if (tableData2.every((v) => v.STATUS === 2 || v.STATUS === 5)) {
      const res = await finishList_tr(setLoading, order, setFinishModal, shelf?.SHELVE_ID, remark);
      if (res?.data?.success) {
        dispatch(resetTransfer({ type: "all", station: stations }));
        Alert({ title: res?.data?.message });
        await deleteTask_tr(stations);
      } else if (!res?.success) {
        Alert({ title: `${res?.error?.message}` });
      }
    } else {
      setFinishModal(false);
      toast.error("有其他車次或項目未完成");
    }
  };
  const setAbnormal = async (data) => {
    const [newData] = data;
    setAbData(newData);
    setWmsModal(true);
  };
  const handleAbnormal = async () => {
    if (transfer[stations[0]]?.job[0]?.PRT_NO !== job[0]?.PRT_NO) {
      toast.error("不是上在這個目的貨架上");
      return;
    }

    const res = await addAbnormal_tr(waveNo, abData, shelf, shelfItem);
    setWmsModal(false);
    if (res?.success) {
      Alert({ title: `${res?.data?.message}` });

      const res1 = await updateWMS_tr(setLoading, [abData], shelf, order, transfer[stations[0]], setConfirmModal, remark, 1);
      if (res1?.data?.data === "success") {
        const detail = [abData].map((s) => tableData2.find((de) => de.PRT_NO === s.PRT_NO));
        dispatch(updateShelfItem({ station: currentStation, items: detail, ppStation: stations[0] }));
        getList(waveNo, setTableData2);
      } else if (!res1?.success) {
        Alert({ title: `${res1?.error.message}` });
      }
      dispatch(setTransfer({ station: currentStation, selected: [] }));
    } else {
      Alert({ title: `${res?.error?.message}` });
    }
  };
  const ActionButtons = () => {
    // 1. 第一階段：掃描單據
    if (step <= 2) {
      return <ActionBtn icon="icon-check" text="確定" variant="orange" onClick={handleConfirmList} disabled={!waveNo} />;
    }
    if (currentStation === stations[0]) {
      return (
        <div className="w-full flex justify-between">
          <ActionBtn icon="icon-add" text="新增貨架" variant="orange" onClick={() => setAddModal(true)} disabled={tableData2.every((v) => v.STATUS === 2)} />
          <ActionBtn icon="icon-transfer" text="完成調撥" variant="orange" onClick={() => setFinishModal(true)} />
          <ActionBtn icon="icon-returnShelf" text="退回貨架" variant="orange" onClick={() => setReturnModal(true)} />
        </div>
      );
    } else {
      return (
        <div className="w-full flex justify-between">
          <button className="w-50 opacity-0 pointer-events-none"></button>
          <ActionBtn icon="icon-check" text="確定" variant="orange" onClick={() => setConfirmModal(true)} disabled={selected?.length <= 0} />
          <ActionBtn icon="icon-returnShelf" text="退回貨架" variant="orange" onClick={() => setReturnModal(true)} />
        </div>
      );
    }
  };
  const handleChangeREMARK = (e) => {
    dispatch(setTransfer({ station: currentStation, remark: e.target.value }));
  };
  const handleReSendTaskdone = async () => {
    const res = await resend_check_tr(currentStation);
    if (res?.data?.data) {
      const transferData = res?.data?.data;
      dispatch(setTransfer({ station: currentStation, screen: "loading", step: 2, waveNo: transferData?.W_ID, orderCode: transferData?.orderCode, order: transferData?.order }));
      await updateTask({ stations: "A01", location: "transfer" });

      const random = generateRandomNumber();
      const data = { action: "ask_done", STATION: currentStation, dataid: random };
      const res1 = await sendToWMS(data);
      if (res1?.data?.data?.result == "ok") {
        toast.success("重抓成功");
        dispatch(setTransfer({ step: 3, screen: "working" }));
      } else {
        toast.error(`${res?.data?.data?.result}`);
      }
    } else {
      toast.success("沒有任務");
    }
  };
  // ============================
  // ⭐ 搜尋框
  // ============================
  const timerRef = useRef(null); // 使用 Ref 來保存計時器
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
  const executeSearch = (keyword) => {
    dispatch(resetTransfer({ type: "search", station: currentStation }));

    // 增加防呆：如果 originalData 還沒回來，先不執行搜尋
    if (!originalData || originalData.length === 0) {
      console.warn("原始資料尚未載入");
      return;
    }

    const filtered = originalData.filter((item) => item.INSTOCK_NO.toUpperCase().includes(keyword) || item.SALE_NO.toUpperCase().includes(keyword) || item.REMARK.includes(keyword));
    setTableData(filtered);
  };
  const handleSearchKeyDown = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (e.key === "Enter") {
      executeSearch(value);
    }
  };
  const handleDeleteInput = () => {
    setSearchTerm("");
    dispatch(resetTransfer({ type: "search", station: currentStation }));
    setTableData(originalData);
  };
  /**
   * 核心邏輯：計算貨架顯示資訊
   * 透過 Map 合併「現有貨架項目 (shelfItem)」與「本次勾選待處理項目 (selected)」
   * 這能讓 AI 理解資料合併的邏輯，避免誤刪新產生的 UI 列表
   */
  const displayItems = useMemo(() => {
    const stationData = transfer[currentStationSafe] || {};
    const currentShelfItems = stationData.shelfItem || [];
    const currentSelected = stationData.selected || [];

    const tempMap = new Map();

    // 處理現有項目
    currentShelfItems.forEach((item) => {
      if (item?.PRT_NO && item?.PRT_NAME !== "DUMMY") {
        tempMap.set(item.PRT_NO, { ...item, selectedBox: 0, selectedPP: 0, isNew: false });
      }
    });

    // 疊加勾選項目：若為新項目則建立 row，若已存在則累加數量
    currentSelected.forEach((sel) => {
      if (!sel?.PRT_NO) return;
      if (tempMap.has(sel.PRT_NO)) {
        const exist = tempMap.get(sel.PRT_NO);
        exist.selectedBox += Number(sel.BOX_NO) || 0;
        exist.selectedPP += Number(sel.PP_NO) || 0;
      } else {
        // 🚨 如果本來是空的 (暫無資料)，這裡會建立新的 row
        tempMap.set(sel.PRT_NO, {
          ...sel,
          BOX_NO: 0,
          PP_NO: 0,
          selectedBox: Number(sel.BOX_NO) || 0,
          selectedPP: Number(sel.PP_NO) || 0,
          isNew: true,
        });
      }
    });

    return Array.from(tempMap.values());
  }, [transfer, currentStationSafe]);

  // ============================
  // ⭐ 撈ERP資料 / 顯示調撥單號
  // ============================
  const OrderTitle = () => {
    if (step > 2) return <span>{orderCode}</span>;

    return (
      <div className="w-75 ml-2">
        <InputFrame type="text" ref={barCodeRef} onKeyDown={handleBarCode} />
      </div>
    );
  };
  // -------------------------------*

  useEffect(() => {
    getTable(setTableData, setTableTotalData2, setOriginalData);
  }, [waveNo]);
  useEffect(() => {
    getList(waveNo, setTableData2);
  }, [shelfItem, waveNo]);

  return (
    <>
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
                  placeholder="搜尋 調撥單號 或 訂單單號 ..."
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
          <div className="flex-1 min-h-0">
            <TransferTable data={tableData} data2={tableData2} setAbnormal={setAbnormal} />
          </div>
        </div>
        {/* 右側 */}
        <div className="w-[53%] flex flex-col">
          <div className="flex items-center p-4">
            <label htmlFor="order">
              調撥單號<span className="text-lg px-1">:</span>
            </label>
            <OrderTitle />
          </div>
          <div className="flex flex-col flex-1 min-h-0 justify-between bg-white p-8 pb-4 h-full overflow-hidden">
            {orderCode && (
              <div className="custom-scrollbar" style={{ "--scrollbar-thumb-color": `var(--green-vivid)` }}>
                {step <= 2 ? <ActionOrderList filteredItems={filteredItems} order={order} /> : <ShelfData shelf={shelf} handleChangeREMARK={handleChangeREMARK} displayItems={displayItems} remark={remark} currentStation={currentStation} stations={stations} />}
              </div>
            )}
            <div className="flex flex-col justify-end items-center p-4">{orderCode && <ActionButtons />}</div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal showModal={confirmModal} title="確認" onClose={() => setConfirmModal(false)} onConfirm={handleConfirmShelf} width={`39vw`} height={`auto`}>
        <>
          <div>請確定是否搬移以下品項</div>
          <div>
            {selected &&
              selected.length > 0 &&
              (() => {
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

                const result = Object.values(grouped);

                return result.map((v) => (
                  <div key={v.PRT_NO}>
                    {v.PRT_NO} {v.PP_NO} {v.UNIT}
                  </div>
                ));
              })()}
          </div>
        </>
      </Modal>
      <Modal showModal={addModal} title="新增貨架" onClose={() => setAddModal(false)} onConfirm={handleAddShelf} width={`39vw`} height={`40vh`}>
        確定是否新增貨架
      </Modal>
      <Modal showModal={returnModal} title="退回貨架" onClose={() => setReturnModal(false)} onConfirm={handleReturnShelf} width={`39vw`} height={`40vh`}>
        確定是否返回貨架
      </Modal>
      <Modal showModal={finishModal} title="完成調撥" onClose={() => setFinishModal(false)} onConfirm={handleFinish} width={`39vw`} height={`40vh`}>
        確定完成調撥單
      </Modal>
      <Modal showModal={wmsModal} title="數量異常" onClose={() => setWmsModal(false)} onConfirm={handleAbnormal} width={`39vw`} height={`auto`}>
        <>
          <div>產品編號:「 {abData?.PRT_NO} 」</div>
          <div>貨架數量與實際數量不相符</div>
          <div>按下「確認」後將退回所有貨架</div>
          <div>請至盤點更正為正確數量並重新開立調撥單</div>
        </>
      </Modal>

      {/* 重發的taskdone 沒有Job 使用，所以會壞掉 */}
      {/* {step <= 2 && (
        <button onClick={handleReSendTaskdone} className="absolute top-0 right-100 z-99 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition-all duration-200 active:scale-95">
          <span className="mr-1">🔄</span> 重發任務
        </button>
      )} */}
    </>
  );
}

// ============================
// ⭐ 貨架上資訊
// ============================
const ActionOrderList = ({ filteredItems, order }) => (
  <SchematicDiagramList>
    <div className="flex flex-col text-lg">
      <div className="flex justify-end p-2">
        <span>目的庫別: {order?.STOCK_AREA}</span>
      </div>

      <table className="w-full border-collapse text-left border-collapse">
        <thead className="bg-gray-300 rounded-lg">
          <tr>
            <th className="p-2 w-[25%]">產品品號</th>
            <th className="p-2">品名</th>
            <th className="p-2 w-[12%]">箱數</th>
            <th className="p-2 w-[18%]">包數</th>
            <th className="p-2 w-[10%]">單位</th>
            <th className="p-2 w-[10%]">來源</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems?.map((v) => (
            <tr className="bg-gray-100 rounded-lg">
              <td title={v?.PRT_NO} className="truncate p-2">
                {v?.PRT_NO || ""}
              </td>
              <td title={v?.PRT_NAME} className="truncate p-2">
                {v?.PRT_NAME || ""}
              </td>
              <td className="p-2" title={v?.BOX_NO}>
                {v?.BOX_NO || 0}
              </td>
              <td className="p-2" title={v?.PP_NO}>
                {v?.PP_NO || ""}
              </td>
              <td className="p-2" title={v?.UNIT}>
                {v?.UNIT || ""}
              </td>
              <td className="p-2" title={v?.MEMO}>
                {v?.MEMO || ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </SchematicDiagramList>
);
const ShelfData = ({ shelf, remark, handleChangeREMARK, displayItems, currentStation, stations }) => {
  const isDestination = currentStation === stations[0];
  const stationLabel = isDestination ? "目的" : "來源";
  const titleColor = isDestination ? "text-[var(--blue-vivid)]" : "text-[var(--red)]";
  // 目的地顯示 (+), 來源地顯示 (-)
  const operator = isDestination ? "+" : "-";

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
          <div className={`whitespace-nowrap ${titleColor}`} style={isDestination ? { textShadow: "1px 1px 0 white" } : {}}>
            站點{currentStation}-{stationLabel}貨架編號: {shelf?.SHELVE_ID}
          </div>
          <div>{shelf?.area && `${stationLabel}庫別: ${shelf?.area}`}</div>
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
                  <ShelfItemRow key={`${item.PRT_NO}-${index}`} item={item} operator={operator} />
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
const ShelfItemRow = ({ item, operator }) => {
  const isNew = item.isNew || (item.selectedBox > 0 && (item.BOX_NO || 0) === 0 && (item.PP_NO || 0) === 0);
  return (
    <tr className={`${isNew ? "text-red-500" : ""} bg-gray-100 rounded-lg`}>
      <td className={`p-2 truncate max-w-0`} title={item?.PRT_NO}>
        {item?.PRT_NO}
      </td>
      <td className="p-2 truncate max-w-0" title={item?.PRT_NAME}>
        {item?.PRT_NAME}
      </td>
      <td className="p-2 truncate max-w-0" title={`${item?.BOX_NO}${item?.selectedBox > 0 && `(${operator}${item?.selectedBox})`}`}>
        {item?.BOX_NO}
        <span className="inline-block text-red-500">{item?.selectedBox > 0 && `(${operator}${item?.selectedBox})`}</span>
      </td>
      <td className="p-2 truncate max-w-0" title={`${item?.PP_NO}${item?.selectedPP > 0 && `(${operator}${item?.selectedPP})`}`}>
        {item?.PP_NO} <span className="inline-block text-red-500">{item?.selectedPP > 0 && `(${operator}${item?.selectedPP})`}</span>
      </td>
      <td className={`p-2 truncate max-w-0`} title={item?.UNIT}>
        {item?.UNIT}
      </td>
    </tr>
  );
};
