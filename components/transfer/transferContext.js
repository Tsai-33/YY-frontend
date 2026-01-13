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

export default function TransferContext({ barCodeRef, setLoading }) {
  const dispatch = useDispatch();
  const [tableData, setTableData] = useState([]); // 調撥單資訊
  const [tableDataTotal2, setTableTotalData2] = useState([]); // 調撥單上的所有明細
  const [tableData2, setTableData2] = useState([]); // 調撥單上的明細

  // MODAL 開關
  const [addModal, setAddModal] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [finishModal, setFinishModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [wmsModal, setWmsModal] = useState(false);

  // 站點
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const currentStationSafe = currentStation || stations?.[0] || "";
  const transfer = useSelector((s) => s.transfer);
  const { step, orderCode, order, waveNo } = useSelector((s) => s.transfer);
  const { screen, shelf, shelfItem, selected, job } = useSelector((s) => s.transfer[currentStationSafe] || {});

  // 掃描 QR code (ERP抓取新資料)
  const handleBarCode = async (e) => {
    if (screen === "loading") return;
    if (e.key !== "Enter") return;
    const inputBarCode = e.target.value.trim();
    const result = tableData.some((item) => item.INSTOCK_NO === inputBarCode);
    if (result) {
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

  // 確認此調撥單
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
  // 確定下架
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

  // 新增貨架
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
  // 退回貨架
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
  // 異常按鈕
  const [abData, setAbData] = useState();
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

  // -------------------------------*
  useEffect(() => {
    getTable(setTableData, setTableTotalData2);
  }, [waveNo]);
  useEffect(() => {
    if (!waveNo) return;
    getList(waveNo, setTableData2);
  }, [shelfItem]);

  // * 貨架上的加減 */
  const displayItems = useMemo(() => {
    const shelfList = Array.isArray(shelfItem) ? shelfItem : [];
    const selectedList = Array.isArray(selected) ? selected : [];
    const tempMap = new Map(shelfList.map((item) => [item.PRT_NO, { ...item, selectedBox: 0, selectedPP: 0, isNew: false }]));

    selectedList.forEach((sel) => {
      if (!sel?.PRT_NO) return;
      if (tempMap.has(sel.PRT_NO)) {
        const exist = tempMap.get(sel.PRT_NO);
        exist.selectedBox += sel.BOX_NO || 0;
        exist.selectedPP += sel.PP_NO || 0;
      } else {
        tempMap.set(sel.PRT_NO, {
          ...sel,
          BOX_NO: 0,
          PP_NO: 0,
          selectedBox: sel.BOX_NO || 0,
          selectedPP: sel.PP_NO || 0,
          isNew: true,
        });
      }
    });

    return Array.from(tempMap.values());
  }, [shelfItem, selected]);

  return (
    <>
      {/* 主要內容區域 */}
      <div className="flex gap-4 px-2 py-8 items-stretch h-[75vh]">
        {/* 左側 */}
        <div className="w-3/7 flex flex-col">
          <div className="flex-1 h-0">
            <TransferTable data={tableData} data2={tableData2} setAbnormal={setAbnormal} />
          </div>
        </div>
        {/* 右側 */}
        <div className="w-4/7 flex flex-col">
          {/* 條碼 */}
          <div className="flex space-x-4 pb-4">
            <div className="flex flex-1 items-center">
              <label htmlFor="order">
                調撥單號<span className="text-lg px-1">:</span>
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
              {orderCode ? (
                step <= 2 ? (
                  Object.values(order).length > 0 ? (
                    <SchematicDiagramList>
                      <div className="flex flex-col">
                        <div className="flex justify-end">
                          <div className="flex gap-x-2">
                            <span>目的庫別:</span>
                            <span>{order?.STOCK_AREA}</span>
                          </div>
                        </div>
                        {tableDataTotal2.map((v, i) => {
                          const OUTSTOCK_NO = v?.OUTSTOCK_NO?.split("-").slice(0, 2).join("-");
                          if (OUTSTOCK_NO !== orderCode) return;
                          return (
                            <div key={i}>
                              <div className="flex justify-between">
                                <div className="flex gap-x-2">
                                  <span>產品品號:</span>
                                  <span>{v?.PRT_NO}</span>
                                </div>
                                <div className="flex gap-x-2 text-[var(--red)]">
                                  <span>來源庫別:</span>
                                  <span>{v?.MEMO}</span>
                                </div>
                              </div>
                              <div className="flex gap-x-2">
                                <span>品名:</span>
                                <span>{v?.PRT_NAME}</span>
                              </div>
                              <div className="flex gap-16">
                                <div className="flex gap-x-2">
                                  <span>箱數:</span>
                                  <span>{v?.BOX_NO}</span>
                                  <span>箱</span>
                                </div>
                                <div className="flex gap-x-2">
                                  <span>數量:</span>
                                  <span>{order?.PP_NOS}</span>
                                  <span>{order?.UNIT}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </SchematicDiagramList>
                  ) : (
                    ""
                  )
                ) : (
                  <SchematicDiagram>
                    <div className="flex flex-col">
                      {/* 標題區：根據是否為目的地站點切換顏色 */}
                      <div className={`flex justify-between pb-2 ${currentStation === stations[0] ? "text-[var(--blue-vivid)]" : "text-[var(--red)]"}`}>
                        <div style={currentStation === stations[0] ? { textShadow: "1px 1px 0 white" } : {}}>
                          站點{currentStation}-{currentStation === stations[0] ? "目的" : "來源"}貨架編號:{shelf?.SHELVE_ID}
                        </div>
                        <div>
                          {currentStation === stations[0] ? "目的" : "來源"}庫別: {shelf?.area}
                        </div>
                      </div>

                      {/* 內容區：渲染處理後的資料 */}
                      {displayItems.length === 0 ? (
                        <div className="h-25"></div>
                      ) : (
                        displayItems.map((item, index) => <ShelfItemRow key={`${item.PRT_NO}-${index}`} item={item} isDestination={currentStation === stations[0]} isLastItem={index === displayItems.length - 1} cars={shelf?.CARS} />)
                      )}
                    </div>
                  </SchematicDiagram>
                )
              ) : (
                ""
              )}
            </div>
            {/* 按鈕區 */}
            <div className="flex flex-1 flex-col justify-end items-center">
              {step <= 2 && <ActionBtn icon="icon-check" text="確定" variant="orange" onClick={handleConfirmList} disabled={!waveNo} />}
              {step > 2 && (
                <div className="w-full flex justify-between">
                  {currentStation === stations[0] ? (
                    <>
                      <ActionBtn icon="icon-add" text="新增貨架" variant="orange" onClick={() => setAddModal(true)} disabled={tableData2.every((v) => v.STATUS === 2)} />
                      <ActionBtn icon="icon-transfer" text="完成調撥" variant="orange" onClick={() => setFinishModal(true)} disabled={tableData2.every((v) => v.STATUS !== 2)} />
                      <ActionBtn icon="icon-returnShelf" text="退回貨架" variant="orange" onClick={() => setReturnModal(true)} />
                    </>
                  ) : (
                    <>
                      <button className="w-25 pointer-events-none" disabled={true} />
                      <ActionBtn icon="icon-check" text="確定" variant="orange" onClick={() => setConfirmModal(true)} disabled={selected?.length <= 0} />
                      <button className="w-25 pointer-events-none" disabled={true} />
                      {/* <ActionBtn icon="icon-returnShelf" text="退回貨架" variant="orange" onClick={() => setReturnModal(true)} disabled={job?.length > 0} /> */}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Modal - 確定 */}
      <Modal showModal={confirmModal} title="確認" onClose={() => setConfirmModal(false)} onConfirm={handleConfirmShelf} width={`30vw`} height={`auto`}>
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
      {/* Modal - 新增貨架 */}
      <Modal showModal={addModal} title="新增貨架" onClose={() => setAddModal(false)} onConfirm={handleAddShelf} width={`30vw`} height={`35vh`}>
        確定是否新增貨架
      </Modal>
      {/* Modal - 退回貨架 */}
      <Modal showModal={returnModal} title="退回貨架" onClose={() => setReturnModal(false)} onConfirm={handleReturnShelf} width={`30vw`} height={`35vh`}>
        確定是否返回貨架
      </Modal>
      {/* Modal - 完成調撥 */}
      <Modal showModal={finishModal} title="完成調撥" onClose={() => setFinishModal(false)} onConfirm={handleFinish} width={`30vw`} height={`35vh`}>
        確定完成調撥單
      </Modal>
      {/* Modal - 數量異常 */}
      <Modal showModal={wmsModal} title="數量異常" onClose={() => setWmsModal(false)} onConfirm={handleAbnormal} width={`30vw`} height={`auto`}>
        <>
          <div>「 {abData?.PRT_NO} 」系統數量與實際數量不相符</div>
          <div>按下「確認」後退回所有貨架並結束此張調撥單</div>
          <div>請至盤點更正為正確數量，並重新開立單據</div>
        </>
      </Modal>
    </>
  );
}

const ShelfItemRow = ({ item, isDestination, isLastItem, cars }) => {
  const isNew = item.isNew || (item.selectedBox > 0 && (item.BOX_NO || 0) === 0 && (item.PP_NO || 0) === 0);
  const textClass = isNew ? "text-red-500" : "";

  // 目的地顯示 (+), 來源地顯示 (-)
  const operator = isDestination ? "+" : "-";

  return (
    <div className={`mb-2 ${textClass}`}>
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
        <div className="absolute bottom-0 right-0">{isLastItem && cars && <div>{cars}</div>}</div>
      </div>
    </div>
  );
};
