import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import ActionBtn from "@/components/common/btns/actionBtn";
import InputFrame from "@/components/common/input/inputFrame";
import SchematicDiagram from "../../components/diagram/schematicDiagram";
import SchematicDiagramList from "@/components/diagram/schematicDiagramList";
import Alert from "@/components/common/alert/alert";
import Modal from "@/components/common/modal/modal";
import TransferTable from "@/components/transfer/transferTable";
import { resetTransfer, setAllLoading, setTransfer, updateShelfItem } from "@/redux/reducer/reducerTransfer";
import { addAbnormal_tr, addShelf_tr, addTask_tr, cancelShelf_tr, checkTask_tr, checkWCS_tr, confrimList_tr, deleteTask_tr, finishList_tr, getEPR, getList, getTable, restoreList_tr, returnShelf_tr, updateWMS_tr } from "@/components/transfer/transferFunction";

/**
 * 調撥系統核心上下文組件 (TransferContext)
 * 處理條碼掃描、工作站邏輯、貨架增刪以及與 WMS/ERP 系統的交互
 * * @param {Object} props
 * @param {React.RefObject} props.barCodeRef - 綁定外部 input 的 ref，用於自動聚焦與清空值
 * @param {Function} props.setLoading - 控制全域 Loading 遮罩的狀態函式
 */

export default function TransferContext({ barCodeRef, setLoading }) {
  const dispatch = useDispatch();
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
  const { screen, shelf, shelfItem, selected } = useSelector((s) => s.transfer[currentStationSafe] || {});

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
        })
      );

      barCodeRef.current.value = "";
    } else {
      await getEPR(setLoading, inputBarCode, setTableData, setTableTotalData2);
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
    const res = await updateWMS_tr(setLoading, selected, shelf, order, transfer[stations[0]], setConfirmModal);

    if (res?.success) {
      dispatch(updateShelfItem({ station: currentStation, items: selected, ppStation: stations[0] }));
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
    const res = await addShelf_tr(setLoading, setAddModal, shelf, order, stations);
    if (!res?.success) {
      Alert({ title: `${res?.error.message}` });
    }
  };
  const handleReturnShelf = async () => {
    setReturnModal(false);

    if (!currentStation) {
      Alert({ title: "抓不到站點位置" });
      return;
    }

    const isAllCompleted = tableData2.every((item) => item.STATUS === 2);
    if (isAllCompleted) {
      Alert({ title: "請選擇「完成調撥」" });
      return;
    }

    // 如果是目的站，有移動過產品後不可使用
    if (currentStation === stations[0]) {
      const check = await checkWCS_tr(waveNo, stations[0]);
      if (!check?.success) {
        Alert({ title: `${check?.error?.message}` });
        return;
      } else if (check?.data?.data?.length <= 0) {
        if (tableData2.every((v) => v.STATUS === 1)) {
          Alert({
            title: "調撥單未完成",
            html: `此調撥單未完成且您正在退回目的貨架<br>如果退回將返回選單列表`,
            showCancel: true,
            onConfirm: async () => {
              await handleCancel();
              await deleteTask_tr(stations);
            },
          });
        } else if (tableData2.some((v) => v.STATUS === 2)) {
          Alert({ title: "有下架其他貨架產品，請完成此單。" });
        }
        return;
      } else if (check?.data?.data?.length > 0) {
        const hasGGroupEndingWithA = check.data.data.some((item) => item.GGROUP && item.GGROUP.endsWith("A"));
        if (!hasGGroupEndingWithA) {
          Alert({
            title: "調撥單未完成",
            html: `此調撥單未完成且您正在退回目的貨架<br>如果退回將返回選單列表`,
            showCancel: true,
            onConfirm: async () => {
              await handleCancel();
              await deleteTask_tr(stations);
            },
          });
          return;
        }
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
    const res = await returnShelf_tr(setLoading, currentStation, shelf, order);
    if (res?.data?.success) {
      dispatch(resetTransfer({ type: "one", station: currentStation, W_ID: waveNo }));
    }
  };
  const handleFinish = async () => {
    if (tableData2.every((v) => v.STATUS === 2)) {
      const res = await finishList_tr(setLoading, order, setFinishModal);
      if (res?.data?.success) {
        dispatch(resetTransfer({ type: "all", station: stations }));
        Alert({ title: res?.data?.message });
        await deleteTask_tr(stations);
      } else if (!res?.success) {
        Alert({ title: `${res?.error?.message}` });
      }
    }
  };
  const setAbnormal = async (data) => {
    const [newData] = data;
    setAbData(newData);
    setWmsModal(true);
  };
  const handleAbnormal = async () => {
    const res = await addAbnormal_tr(waveNo, abData, shelf);
    setWmsModal(false);
    if (res?.success) {
      await handleCancel();
      await deleteTask_tr(stations);
      Alert({ title: `${res?.data?.message}` });
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
          <ActionBtn icon="icon-transfer" text="完成調撥" variant="orange" onClick={() => setFinishModal(true)} disabled={tableData2.every((v) => v.STATUS !== 2)} />
          <ActionBtn icon="icon-returnShelf" text="退回貨架" variant="orange" onClick={() => setReturnModal(true)} />{" "}
        </div>
      );
    } else {
      return (
        <div className="w-full flex justify-center">
          <ActionBtn icon="icon-check" text="確定" variant="orange" onClick={() => setConfirmModal(true)} disabled={selected?.length <= 0} />
        </div>
      );
    }
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
      if (item?.PRT_NO) {
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
  // ============================
  // ⭐ 貨架上資訊
  // ============================
  const ActionOrderList = () => {
    if (step <= 2) {
      const filteredItems = useMemo(() => {
        return tableDataTotal2.filter((v) => {
          const prefix = v?.OUTSTOCK_NO?.split("-").slice(0, 2).join("-");
          return prefix === orderCode;
        });
      }, [tableDataTotal2, orderCode]);

      if (Object.values(order).length === 0) return null;
      return (
        <SchematicDiagramList>
          <div className="flex flex-col">
            <div className="flex justify-end mb-2">
              <span>目的庫別: {order?.STOCK_AREA}</span>
            </div>
            {filteredItems.map((v, i) => (
              <div key={i} className="mb-4 border-b pb-2 last:border-0">
                <div className="flex justify-between">
                  <span>產品品號: {v?.PRT_NO}</span>
                  <span className="text-[var(--red)]">來源庫別: {v?.MEMO}</span>
                </div>
                <div>品名: {v?.PRT_NAME}</div>
                <div className="flex gap-16">
                  <span>箱數: {v?.BOX_NO} 箱</span>
                  <span>
                    數量: {order?.PP_NOS} {order?.UNIT}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SchematicDiagramList>
      );
    } else return <ShelfData />;
  };
  const ShelfData = () => {
    const isDestination = currentStation === stations[0];
    const stationLabel = isDestination ? "目的" : "來源";
    const titleColor = isDestination ? "text-[var(--blue-vivid)]" : "text-[var(--red)]";

    return (
      <SchematicDiagram>
        <div className="flex flex-col gap-8">
          <div className={`flex justify-between pb-2 ${titleColor}`}>
            <div style={isDestination ? { textShadow: "1px 1px 0 white" } : {}}>
              站點{currentStation}-{stationLabel}貨架編號: {shelf?.SHELVE_ID}
            </div>
            <div>
              {stationLabel}庫別: {shelf?.area}
            </div>
          </div>

          {displayItems.length === 0 ? (
            <div className="h-25 flex items-center justify-center text-gray-400">暫無資料</div>
          ) : (
            displayItems.map((item, index) => <ShelfItemRow key={`${item.PRT_NO}-${index}`} item={item} isDestination={isDestination} isLastItem={index === displayItems.length - 1} cars={shelf?.CARS} />)
          )}
        </div>
      </SchematicDiagram>
    );
  };
  const ShelfItemRow = ({ item, isDestination, isLastItem, cars }) => {
    const isNew = item.isNew || (item.selectedBox > 0 && (item.BOX_NO || 0) === 0 && (item.PP_NO || 0) === 0);
    const textClass = isNew ? "text-red-500" : "";

    // 目的地顯示 (+), 來源地顯示 (-)
    const operator = isDestination ? "+" : "-";
    return (
      <div className={`flex flex-col ${textClass}`}>
        <div className="flex gap-x-2">
          <span>產品品號:</span>
          <span>{item.PRT_NO}</span>
        </div>
        <div className="flex gap-x-2">
          <span>產品品名:</span>
          <span>{item.PRT_NAME}</span>
        </div>
        <div className="flex gap-16 relative">
          <div className="flex gap-x-2">
            <span>箱數:</span>
            <span>{item.BOX_NO}</span>
            <span>箱</span>
            {item.selectedBox > 0 && <span className="text-red-500">{`(-${item.selectedBox})`}</span>}
          </div>
          <div className="flex gap-x-2">
            數量: {item.PP_NO} {item.UNIT}
            {item.selectedPP > 0 && <span className="text-red-500">{`(${operator}${item.selectedPP})`}</span>}
          </div>
          <div className="absolute bottom-0 right-0">{isLastItem && cars && <span className="text-black">{cars}</span>}</div>
        </div>
      </div>
    );
  };

  // -------------------------------*
  useEffect(() => {
    getTable(setTableData, setTableTotalData2);
  }, [waveNo]);
  useEffect(() => {
    if (!waveNo) return;
    getList(waveNo, setTableData2);
  }, [shelfItem]);

  return (
    <>
      {/* 主要內容區域 */}
      <div className="flex gap-4 py-2 items-stretch h-[72vh]">
        {/* 左側 */}
        <div className="w-[47%] flex flex-col">
          <div className="flex-1 h-0">
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
          <div className="flex flex-col flex-1 min-h-0 bg-white p-8 pb-4">
            {orderCode && <ActionOrderList />}
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
          <div>系統數量與實際數量不相符</div>
          <div>按下「確認」後退回所有貨架</div>
          <div>請至盤點更正為正確數量並重新開立單據</div>
        </>
      </Modal>
    </>
  );
}
