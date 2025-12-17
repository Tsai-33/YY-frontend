import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import ActionBtn from "@/components/common/btns/actionBtn";
import PageHeader from "@/components/common/pageHeader/pageHeader";
import InputFrame from "@/components/common/input/inputFrame";
import { setCurrentStation } from "@/redux/reducer/reducerWorkStations";
import { sendToWMS, getTransfer, updateTransferWMS } from "../api";
import SchematicDiagram from "../../components/diagram/schematicDiagram";
import LoadingShelf from "@/components/common/loading/loading-shelf";
import Loading from "@/components/common/loading/loading";
import SchematicDiagramList from "@/components/diagram/schematicDiagramList";
import { generateRandomNumber } from "@/utils/random";
import Alert from "@/components/common/alert/alert";
import Modal from "@/components/common/modal/modal";
import TransferTable from "@/components/transfer/transferTable";
import { resetTransfer, setAllLoading, setTransfer, updateShelfItem } from "@/redux/reducer/reducerTransfer";
import { checkConfirmTransfer, getEPRdata, getList, getTable } from "@/components/transfer/transferFunction";

export default function Transfer() {
  const dispatch = useDispatch();
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]); // 調撥單資訊
  const [tableDataTotal2, setTableTotalData2] = useState([]); // 調撥單上的所有明細
  const [tableData2, setTableData2] = useState([]); // 調撥單上的明細

  // 目前選擇的工作站
  const handleSwitchStation = (station) => {
    dispatch(setCurrentStation(station));
  };
  const currentStationSafe = currentStation || stations?.[0] || "";
  const stationList = useSelector((s) => s.transfer);
  const { step, orderCode, order, lackStation, waveNo } = useSelector((s) => s.transfer);
  const { screen, shelf, shelfItem, selected } = useSelector((s) => s.transfer[currentStationSafe] || {});

  // 掃描 QR code (ERP抓取新資料)
  const barCodeRef = useRef(null);
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
      await getEPRdata(inputBarCode, setTableData, setTableTotalData2);
    }
  };

  // 確認此調撥單
  const handleConfirm = async () => {
    if (!waveNo) {
      Alert({ title: "您未選擇調撥單" });
      return;
    }
    const lack_station = await checkConfirmTransfer(setLoading, order);    if (lack_station?.length > 0) {
      lack_station.map((station) => {
        dispatch(setTransfer({ station: station, orderCode: orderCode, waveNo: order.W_ID, order: order, lackStation: station }));
      });
      // 其他鎖住，等這波做完才能釋放
      dispatch(setAllLoading());
    } else {
      Alert({ title: "目前系統忙碌中，請重新再試。" });
    }
  };
  // 確定下架
  const [confirmModal, setConfirmModal] = useState(false);
  const handleConfirmShelf = async () => {
    setLoading(true);
    if (!currentStation) {
      Alert({ html: "抓不到站點位置" });
      return;
    }
    if (selected.length <= 0) {
      Alert({ html: "沒有選擇項目" });
      return;
    }

    try {
      // 傳給WMS
      const data = { itemArray: selected, area: shelf.area, SHELVE_ID: shelf.SHELVE_ID, BILL_TIME: order.BILL_TIME, WORK_TIME: order.WORK_TIME, CUS_NO: order.CUS_NO, addShelf: stationList?.["A01"].shelf.SHELVE_ID };
      const res = await updateTransferWMS(data);
      if (res.data.success) {
        let newShelf = shelfItem.map((s) => ({ ...s })); // ⬅ 防止 freeze

        selected.forEach((v) => {
          const index = newShelf.findIndex((s) => s.PRT_NO === v.PRT_NO);

          if (index !== -1) {
            // 建立新物件覆蓋，不 mutate 舊物件
            newShelf[index] = {
              ...newShelf[index],
              PP_NO: (Number(newShelf[index].PP_NO) || 0) - (Number(v.PP_NO) || 0),
              BOX_NO: (Number(newShelf[index].BOX_NO) || 0) - (Number(v.BOX_NO) || 0),
            };
          } else {
            // 新增也要建立副本
            newShelf.push({ ...v });
          }
        });

        dispatch(updateShelfItem({ station: currentStation, items: newShelf }));

        setTableData2((prev) => {
          return prev.filter((row) => !selected.some((v) => v.INSTOCK_NO === row.INSTOCK_NO));
        });
      }
    } catch (err) {
      console.warn("handleConfirmShelf :", err);
    } finally {
      setLoading(false);
      dispatch(setTransfer({ station: currentStation, selected: [] }));
      setConfirmModal(false);
    }
  };
  // 新增貨架
  const [addModal, setAddModal] = useState(false);
  const handleAddShelf = async () => {
    setLoading(true);
    if (tableData2.length <= 0) {
      Alert({ title: "調撥單完成", html: `此調撥單已經完成，請選擇「 調撥單完成 」。` });
      return;
    }
    try {
      const res = await addtransferWCS({ area: shelf?.area, W_ID: order?.W_ID });
      if (res.data.success) {
        console.log(res.data, "wcstask收到資料");
      }
    } catch (err) {
      console.warn("handleAddShelf :", err);
    } finally {
      setLoading(false);
      setAddModal(false);
    }
  };
  // =============== 退回貨架 (強制結束調撥單) ===============
  const [returnModal, setReturnModal] = useState(false);
  const handleReturnShelf = async () => {
    setReturnModal(false);

    if (!currentStation) {
      Alert({ html: "抓不到站點位置" });
      return;
    }
    if (tableData2.length <= 0) {
      Alert({ title: "調撥單完成", html: `此調撥單已經完成<br>請選擇「 調撥單完成 」` });
      return;
    }

    if (tableData2.length > 0) {
      try {
        const [wcs, nodepos] = await Promise.all([checkWCS({ W_ID: waveNo }), checkNODEPOS({ W_ID: waveNo })]);
        if (wcs.data.success && nodepos.data.success) {
          if (wcs.data.data.length <= 0 && nodepos.data.data.length <= 1) {
            // 沒有這個GGROUP的車了 只剩下一台車在站點了
            Alert({
              title: "入倉單未完成",
              html: `此入倉單未完成且只剩下一台車在工作站<br>如果退回將返回選單列表`,
              showCancel: true,
              onConfirm: async () => {
                // 目前不想做完此張調撥單的恢復
                try {
                  const res = await restoreOrders({ W_ID: waveNo });
                  if (res.data.success) {
                    startCancelReturn();
                    return;
                  }
                } catch (err) {
                  console.warn(`結束未完成的調撥單失敗`, err);
                }
              },
              onCancel: () => {
                return;
              },
            });
            return;
          }
        } else {
          console.log("wcs.nodepos未成功");
          return;
        }
      } catch (err) {
        console.warn(`handleReturnShelf:`, err);
      }
    }

    await startReturn();
  };
  const startCancelReturn = async () => {
    // 開始退回
    setLoading(true);
    try {
      // 傳給WMS
      const random9 = generateRandomNumber();
      const data = { action: "cancel", dataid: random9, STATION: currentStation };
      const res = await sendToWMS(data);
      if (res.data.success) {
        dispatch(resetTransfer({ type: "wave", station: currentStation, W_ID: waveNo }));
      }
    } catch (err) {
      console.warn("handleReturnShelf :", err);
    } finally {
      setLoading(false);
    }
  };
  const startReturn = async () => {
    setLoading(true);
    try {
      const random9 = generateRandomNumber();
      const data = { Command: "RETURN", SHELVE_ID: shelf?.SHELVE_ID, BAR_CODE: "", FACE: 2, STATION: currentStation, PURPOSE: 1, STATUS: 0, CART_ID: "", DATA_ID: random9, WAVENO: String(order.W_ID), GGROUP: String(order.W_ID) };
      const res = await addShelf(data);
      if (res.data.success) {
        dispatch(resetTransfer({ type: "one", station: currentStation, W_ID: waveNo }));
      }
    } catch (err) {
      console.warn("handleReturnShelf :", err);
    } finally {
      setLoading(false);
    }
  };

  // =============== 初入畫面 ===============
  useEffect(() => {
    getTable(setTableData, setTableTotalData2);
    barCodeRef?.current?.focus();
  }, []);

  // =============== 抓detail畫面 ===============
  useEffect(() => {
    if (!waveNo) return;
    getList(waveNo, setTableData2);
  }, [shelfItem]);

  // =========== 測試單亂數產生
  const handleTest = () => {
    // ===== 前綴隨機 =====
    const prefixes = ["F120"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

    // ===== 民國年月日 =====
    const date = new Date();
    const year = date.getFullYear() - 1911;
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    // ===== 3 碼序號 =====
    const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");

    const passSN = `${prefix}-${year}${month}${day}${seq}`;

    barCodeRef.current.value = passSN;
    barCodeRef.current.focus();
  };

  return (
    <>
      {/* 頂部區域 */}
      {step === 1 && <PageHeader title={`請點擊清單內的調撥單號或掃調撥單條碼`} close={true} backTo="/workspace" />}
      {step === 2 && <PageHeader title={`檢視調撥單內容後，請點擊確定 `} close={false} />}
      {step === 3 && <PageHeader title={`貨架到站點，請掃外箱條碼或點擊介面清單方框，標示已將產品放上貨架`} close={false} />}
      {step === 4 && <PageHeader title={`完成調撥後請點擊退回貨架按鈕，將貨架退回庫區`} close={false} />}
      {/* 主要內容區域 */}
      <div className="flex flex-1 gap-4 px-2 py-8 items-stretch">
        {/* 左側 */}
        <div className="w-3/7">
          <TransferTable data={tableData} data2={tableData2} setData2={setTableData2} />
        </div>
        {/* 右側 */}
        <div className="w-4/7 font-bold text-black p-4 flex flex-col">
          {/* 條碼 */}
          <div className="flex space-x-4 pb-4">
            <div className="flex flex-1 items-center">
              <label htmlFor="order" className="font-bold text-black">
                調撥單號:
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
                  <SchematicDiagramList>
                    <div className="flex flex-col">
                      <div className="flex justify-end">
                        <div>目的庫別:{order?.STOCK_AREA}</div>
                      </div>
                      {tableDataTotal2
                        .filter((v) => v?.OUTSTOCK_NO == orderCode)
                        .map((v, i) => (
                          <div key={i} className="mt-2">
                            <div className="flex justify-between">
                              <div>產品品號:{v?.PRT_NO}</div>
                              <div className="text-[var(--red)]">來源庫別:{v?.MEMO}</div>
                            </div>
                            <div>品名: {v?.PRT_NAME}</div>
                            <div className="w-100 flex justify-between">
                              <div>箱數: {v?.BOX_NO}箱</div>
                              <div>
                                數量: {v?.PP_NO} {v?.UNIT}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </SchematicDiagramList>
                ) : (
                  <SchematicDiagram>
                    <div className="flex flex-col">
                      {currentStation === "A01" ? (
                        <div className="flex justify-between pb-2">
                          <div
                            className="text-[var(--blue-vivid)]"
                            style={{
                              textShadow: `
                              -1px -1px 0 white,
                              -1px 1px 0 white,
                              1px -1px 0 white,
                              1px 1px 0 white
                            `,
                            }}
                          >
                            {shelf ? `站點${currentStation}-目的貨架編號:${shelf?.SHELVE_ID}` : ""}
                          </div>
                          <div>{shelf ? `目的庫別: ${shelf?.area}` : ""}</div>
                        </div>
                      ) : (
                        <div className="flex justify-between text-[var(--red)] pb-2">
                          <div>{shelf ? `站點${currentStation}-來源貨架編號:${shelf?.SHELVE_ID}` : ""}</div>
                          <div>{shelf ? `來源庫別: ${shelf?.area}` : ""}</div>
                        </div>
                      )}

                      {(() => {
                        // Step 1: 安全處理 shelfItem
                        const shelfList = Array.isArray(shelfItem) ? shelfItem : [];
                        const selectedList = Array.isArray(selected) ? selected : [];

                        // Step 2: 建立 Map
                        const tempMap = new Map(shelfList.map((item) => [item.PRT_NO, { ...item, selectedBox: 0, selectedPP: 0, isNew: false }]));

                        // Step 3: 合併 selected
                        selectedList.forEach((sel) => {
                          if (!sel?.PRT_NO) return; // 保護無效資料

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

                        const displayItems = Array.from(tempMap.values());

                        // 🚨 如果沒有資料 → 顯示空畫面，不要 map
                        if (displayItems.length === 0) {
                          return <div className="text-gray-400 p-4"></div>;
                        }

                        // Step 4: 渲染
                        return displayItems.map((item, index) => {
                          const isNew = item.isNew || (item.selectedBox > 0 && (item.BOX_NO || 0) === 0 && (item.PP_NO || 0) === 0);

                          const textClass = isNew ? "text-red-500" : "";

                          if (currentStation === "A01") {
                            return (
                              <div key={item.PRT_NO + index} className={`mb-2 ${textClass}`}>
                                <div className="flex justify-between">
                                  <div>產品品號: {item.PRT_NO}</div>
                                </div>
                                <div className="flex justify-between">
                                  <div>產品品名: {item.PRT_NAME}</div>
                                </div>
                                <div className="flex justify-between w-100">
                                  <div>
                                    箱數: {item.BOX_NO} 箱{item.selectedBox > 0 && <span className="text-red-500">{`(-${item.selectedBox})`}</span>}
                                  </div>
                                  <div>
                                    數量: {item.PP_NO} {item.UNIT}
                                    {item.selectedPP > 0 && <span className="text-red-500">{`(+${item.selectedPP})`}</span>}
                                  </div>
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div key={item.PRT_NO + index} className={`mb-2 ${textClass}`}>
                                <div className="flex justify-between">
                                  <div>產品品號: {item.PRT_NO}</div>
                                </div>
                                <div className="flex justify-between">
                                  <div>產品品名: {item.PRT_NAME}</div>
                                </div>
                                <div className="flex justify-between w-100">
                                  <div>
                                    箱數: {item.BOX_NO} 箱{item.selectedBox > 0 && <span className="text-red-500">{`(-${item.selectedBox})`}</span>}
                                  </div>
                                  <div>
                                    數量: {item.PP_NO} {item.UNIT}
                                    {item.selectedPP > 0 && <span className="text-red-500">{`(-${item.selectedPP})`}</span>}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        });
                      })()}
                    </div>
                  </SchematicDiagram>
                )
              ) : (
                ""
              )}
            </div>
            {/* 按鈕區 */}
            <div className="flex flex-1 flex-col justify-end items-center">
              {step <= 2 && <ActionBtn icon="icon-check" text="確定" variant="orange" onClick={handleConfirm} disabled={!waveNo} />}
              {step > 2 && (
                <div className="w-full flex justify-between">
                  {currentStation === "A01" ? (
                    <>
                      <ActionBtn icon="icon-add" text="新增貨架" variant="orange" onClick={() => setAddModal(true)} disabled={tableData2?.length <= 0} />
                      <ActionBtn icon="icon-locationSwap" text="完成調撥" variant="orange" onClick={() => setConfirmModal(true)} disabled={selected?.length <= 0} />
                    </>
                  ) : (
                    <>
                      <ActionBtn className="w-25 pointer-events-none" disabled={true} />
                      <ActionBtn icon="icon-check" text="確定" variant="orange" onClick={() => setConfirmModal(true)} disabled={selected?.length <= 0} />
                    </>
                  )}

                  <ActionBtn icon="icon-returnShelf" text="退回貨架" variant="orange" onClick={() => setReturnModal(true)} disabled={tableData2?.length <= 0} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* 底部按鈕區域 */}
      <div className="w-full flex justify-between z-15">
        {stations.map((station, i) => (
          <ActionBtn key={i} text={station} variant={lackStation?.includes(station) ? "orange" : "green"} disabled={currentStation === station ? true : false} onClick={() => handleSwitchStation(station)} />
        ))}
      </div>
      {/* loading */}
      {screen === "loading" && <LoadingShelf />}
      {loading && <Loading />}
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

      {/* 測試按鈕 */}
      {step <= 2 && <ActionBtn text="測試用-產生單據" className="absolute top-0 right-50" variant="yellow" onClick={handleTest} />}
    </>
  );
}
