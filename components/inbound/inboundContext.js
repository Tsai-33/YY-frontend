import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import ActionBtn from "@/components/common/btns/actionBtn";
import InputFrame from "@/components/common/input/inputFrame";
import { resetInbound, setInbound, updateShelfItem } from "@/redux/reducer/reducerInbound";
import SchematicDiagram from "../../components/diagram/schematicDiagram";
import InboundTable from "@/components/inbound/inboundTable";
import SchematicDiagramList from "@/components/diagram/schematicDiagramList";
import Alert from "@/components/common/alert/alert";
import Modal from "@/components/common/modal/modal";
import { getERP, getTable, getList, confrimList_in, addShelf_in, checkCar, returnShelf_in, restoreList_in, cancelShelf_in, onToShelf_in, finishList_in, checkTask_in, addTask_in, deleteTask_in } from "./inboundFunction";
import { checkNodePos } from "@/pages/api";

export default function InboundContext({ barCodeRef, setLoading }) {
  const dispatch = useDispatch();
  const [tableData, setTableData] = useState([]); // 入庫單資訊
  const [tableData2, setTableData2] = useState([]); // 入庫單上的明細
  const [addModal, setAddModal] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const currentStationSafe = currentStation || stations?.[0] || "";
  const { orderList } = useSelector((s) => s.inbound);
  const { step, screen, orderCode, order, shelf, shelfItem, selected, waveNo } = useSelector((s) => s.inbound[currentStationSafe] || {});

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
      } else {
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
  }, [shelfItem, selected]);

  // ============================
  // ⭐ 事件處理
  // ============================
  const handleBarCode = async (e) => {
    if (screen === "loading") return;
    if (e.key !== "Enter") return;
    const inputBarCode = e.target.value.trim();
    const result = tableData.some((item) => item?.INSTOCK_NO === inputBarCode);
    if (result) {
      const value = tableData.find((item) => item?.INSTOCK_NO === inputBarCode);
      dispatch(setInbound({ station: currentStation, order: value, orderCode: value?.INSTOCK_NO, waveNo: value?.W_ID, step: 2 }));
      barCodeRef.current.value = "";
    } else {
      await getERP(setLoading, inputBarCode, setTableData, orderList);
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
    const res = await confrimList_in(setLoading, order);
    if (res?.success) {
      let lack_station = res?.data?.data?.message2 || [];
      if (typeof lack_station === "string") {
        try {
          lack_station = JSON.parse(lack_station.replace(/'/g, '"'));
        } catch (e) {
          lack_station = [];
        }
      }
      lack_station.forEach((st) => {
        dispatch(setInbound({ station: st, screen: "loading", orderCode, waveNo: order.W_ID, order, orderList: orderCode, lackStation: st }));
      });
      setTableData((prev) => prev.filter((v) => v.INSTOCK_NO !== orderCode && v.STATUS == 0));
      await addTask_in(stations);
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

    const res = await onToShelf_in(setLoading, selected, shelf, order, dispatch, setInbound, currentStation, setConfirmModal);
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
      setTableData2((prev) => prev.filter((row) => !selected.some((v) => v.INSTOCK_NO === row.INSTOCK_NO)));
    } else {
      Alert({ title: res?.error?.message });
    }
  };
  const handleAddShelf = async () => {
    if (tableData2.length <= 0) {
      Alert({ title: "入庫單完成", html: `此入庫單已經完成，請選擇「 入庫單完成 」。` });
      return;
    }
    const res = await addShelf_in(setLoading, setAddModal, shelf, order);
    if (!res?.success) {
      Alert({ title: res?.error?.message });
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
    if (res?.data?.success && !res?.data?.data) {
      Alert({
        title: "入倉單未完成",
        html: `此入倉單未完成且只剩下一台車在工作站<br>如果退回將返回選單列表<br>( ※退回後將清空動作 )`,
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
    const res = await returnShelf_in(setLoading, shelf, currentStation, order);
    if (res?.success) dispatch(resetInbound({ type: "one", station: currentStation, W_ID: waveNo }));
  };
  const handleFinish = async () => {
    const res = await finishList_in(setLoading, order);
    if (res?.success) {
      dispatch(resetInbound({ type: "wave", station: currentStation, W_ID: res?.data?.data }));
      Alert({ title: "此單已完成" });
      const check = await checkNodePos();
      if (check?.data?.data?.length <= 0) await deleteTask_in(stations);
    }
  };

  // ============================
  // ⭐ 撈ERP資料 / 顯示入庫單號
  // ============================
  const OrderTitle = () => (
    <div className="flex items-center p-4">
      <label>
        入庫單條碼<span className="text-lg px-1">:</span>
      </label>
      {step <= 2 ? (
        <div className="w-75 ml-2">
          <InputFrame type="text" ref={barCodeRef} onKeyDown={handleBarCode} />
        </div>
      ) : (
        <span>{orderCode}</span>
      )}
    </div>
  );

  // ============================
  // ⭐ 所有入庫單
  // ============================
  const OrderList = ({ order }) => (
    <SchematicDiagramList>
      <div className="flex flex-col">
        <div className="flex justify-between">
          <span>入倉單單號: {order?.INSTOCK_NO}</span>
          <span>入庫庫別: {order?.STOCK_AREA}</span>
        </div>
        <div>產品品號: {order?.PRT_NO}</div>
        <div>品名: {order?.PRT_NAME}</div>
        <div className="flex gap-16">
          <span>箱數: {order?.BOX_NOS} 箱</span>
          <span>
            數量: {order?.PP_NOS} {order?.UNIT}
          </span>
        </div>
      </div>
    </SchematicDiagramList>
  );

  // ============================
  // ⭐ 貨架上資訊
  // ============================
  const ShelfData = ({ shelf, displayItems }) => (
    <SchematicDiagram>
      <div className="flex flex-col">
        <div className="flex justify-between">
          <div>貨架編號: {shelf?.SHELVE_ID}</div>
          <div>入庫庫別: {shelf?.area}</div>
        </div>
        {displayItems.length === 0 ? <div className="h-25 flex items-center justify-center text-gray-400">暫無資料</div> : displayItems.map((item, index) => <ShelfItemRow key={`${item.PRT_NO}-${index}`} item={item} isLast={index === displayItems.length - 1} shelfCars={shelf?.CARS} index={index} />)}
      </div>
    </SchematicDiagram>
  );
  const ShelfItemRow = ({ item, isLast, shelfCars, index }) => {
    const isNew = item?.isNew || (item?.selectedBox > 0 && (item?.BOX_NO || 0) === 0);
    return (
      <div className={`flex flex-col ${isNew ? "text-red-500" : ""}`}>
        <div className="flex justify-between">
          <div className="flex gap-x-2">
            <span>產品品號:</span>
            <span>{item?.PRT_NO}</span>
          </div>
          {index === 0 && (
            <div className="flex gap-x-2">
              <div>棧板規格:</div>
              <div>{item?.error || "美規"}</div>
            </div>
          )}
        </div>
        <div>產品品名: {item?.PRT_NAME}</div>
        <div className="flex gap-16 relative">
          <div className="flex gap-x-2">
            <span>箱數:</span>
            <span>{item?.BOX_NO}</span>
            <span>箱</span>
            {item?.selectedBox > 0 && <span className="text-red-500">{`(+${item?.selectedBox})`}</span>}
          </div>
          <div className="flex gap-x-2">
            <span>數量:</span>
            <span>{item?.PP_NO}</span>
            <span>{item?.UNIT}</span>
            {item?.selectedPP > 0 && <span className="text-red-500">{`(+${item?.selectedPP})`}</span>}
          </div>
          <div className="absolute bottom-0 right-0">{isLast && shelfCars && <span>{shelfCars}</span>}</div>
        </div>
      </div>
    );
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
        <ActionBtn icon="icon-add" text="新增貨架" variant="orange" onClick={() => setAddModal(true)} disabled={tableData2?.length <= 0} />
        <ActionBtn icon="icon-inbound" text="確定上架" variant="orange" onClick={() => setConfirmModal(true)} disabled={selected?.length <= 0} />
        <ActionBtn icon="icon-returnShelf" text="退回貨架" variant="orange" onClick={() => setReturnModal(true)} />
      </div>
    );
  };

  // ============================
  // ⭐ 副作用
  // ============================
  useEffect(() => {
    getTable(setTableData, orderList);
  }, [orderList]);
  useEffect(() => {
    if (waveNo) getList(waveNo, setTableData2);
  }, [shelfItem, waveNo]);

  return (
    <>
      <div className="flex gap-4 py-2 items-stretch h-[72vh]">
        {/* 左側表格 */}
        <div className="w-[47%] flex flex-col">
          {step > 2 && (
            <div className="flex p-2 items-center justify-between">
              <div className="flex-1 text-sm">{shelf?.EstBoxes > 0 && `建議入倉總數：${shelf?.EstPPs} ${shelf?.UNIT} (${shelf?.EstBoxes}箱)`}</div>
              <ActionBtn icon="icon-check" text="入倉單完成" variant="orange" disabled={tableData2.length > 0} onClick={handleFinish} />
            </div>
          )}
          <div className="flex-1 min-h-0">
            <InboundTable data={tableData} data2={tableData2} setData2={setTableData2} />
          </div>
        </div>

        {/* 右側資訊區 */}
        <div className="w-[53%] flex flex-col">
          <OrderTitle />
          <div className="flex flex-col flex-1 min-h-0 bg-white p-8 pb-4">
            <div className="flex-1 min-h-0 custom-scrollbar pb-8">{orderCode && (step <= 2 ? <OrderList order={order} /> : <ShelfData shelf={shelf} displayItems={displayItems} />)}</div>
            <div className="flex flex-col justify-end items-center p-4">
              <ActionButtons />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal showModal={confirmModal} title="確認上架" onClose={() => setConfirmModal(false)} onConfirm={handleConfirmShelf} width="30vw">
        <div>請確定是否上架以下品項</div>
        {modalGroupedItems.map((v) => (
          <div key={v.PRT_NO} className="flex justify-between items-center gap-x-6">
            <span className="font-medium text-gray-700">{v.PRT_NO}</span>
            <span className="font-medium text-gray-700">{v.PP_NO}</span>
            <span className="font-medium text-gray-700">{v.UNIT}</span>
          </div>
        ))}
      </Modal>
      <Modal
        showModal={addModal}
        title="新增貨架"
        onClose={() => setAddModal(false)}
        onConfirm={() => {
          setAddModal(false);
          handleAddShelf();
        }}
        width="30vw"
      >
        確定是否新增貨架
      </Modal>
      <Modal showModal={returnModal} title="退回貨架" onClose={() => setReturnModal(false)} onConfirm={handleReturnShelf} width="30vw">
        確定是否返回貨架
      </Modal>
    </>
  );
}
