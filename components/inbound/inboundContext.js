import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import ActionBtn from "@/components/common/btns/actionBtn";
import InputFrame from "@/components/common/input/inputFrame";
import { resetInbound, setInbound, updateShelfItem } from "@/redux/reducer/reducerInbound";
import SchematicDiagram from "../../components/diagram/schematicDiagram";
import InboundTable from "@/components/inbound/inboundTable";
import SchematicDiagramList from "@/components/diagram/schematicDiagramList";
import Alert from "@/components/common/alert/alert";
import Modal from "@/components/common/modal/modal";
import { getERP, getTable, getList, confrimList_in, addShelf_in, checkCar, returnShelf_in, restoreList_in, cancelShelf_in, onToShelf_in, finishList_in } from "./inboundFunction";

export default function InboundContext({ barCodeRef, setLoading }) {
  const dispatch = useDispatch();
  const [tableData, setTableData] = useState([]); // 入庫單資訊
  const [tableData2, setTableData2] = useState([]); // 入庫單上的明細

  // MODAL 開關
  const [addModal, setAddModal] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);

  // 站點
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const currentStationSafe = currentStation || stations?.[0] || "";
  const { orderList } = useSelector((s) => s.inbound);
  const { step, screen, orderCode, order, shelf, shelfItem, selected, waveNo } = useSelector((s) => s.inbound[currentStationSafe] || {});

  // 掃描 QR code (ERP抓取新資料)
  const handleBarCode = async (e) => {
    if (screen === "loading") return;
    if (e.key !== "Enter") return;
    const inputBarCode = e.target.value.trim();
    const result = tableData.some((item) => item.INSTOCK_NO === inputBarCode);
    if (result) {
      const value = tableData.find((item) => item.INSTOCK_NO === inputBarCode);
      dispatch(
        setInbound({
          station: currentStation,
          order: value,
          orderCode: value?.INSTOCK_NO,
          waveNo: value?.W_ID,
          step: 2,
        })
      );

      barCodeRef.current.value = "";
    } else {
      await getERP(setLoading, inputBarCode,setTableData, orderList);
    }
  };

  // 確認入庫單
  const handleConfrimList = async () => {
    if (!waveNo) {
      Alert({ title: "您未選擇入倉單" });
      return;
    }
    // 先清空原本的此站的選擇
    dispatch(setInbound({ station: currentStation, order: {}, waveNo: null, orderCode: "", step: 1 }));

    const res = await confrimList_in(setLoading, order);
    if (res.data.success) {
      // 應該會告訴我有哪些station被占用，這裡可能是map方式全部設定
      let lack_station = res.data.data.message2;
      if (!Array.isArray(lack_station)) {
        try {
          // 嘗試把字串轉成陣列
          lack_station = JSON.parse(lack_station.replace(/'/g, '"'));
        } catch (e) {
          console.error("lack_station 格式錯誤:", lack_station, e);
          lack_station = []; // fallback 防止爆掉
        }
      }
      if (lack_station.length > 0) {
        lack_station.map((station) => {
          dispatch(setInbound({ station: station, screen: "loading", orderCode: orderCode, waveNo: order.W_ID, order: order, orderList: orderCode, lackStation: station }));
        });
      }
      setTableData((prev) => prev.filter((v) => v.INSTOCK_NO !== orderCode && v.STATUS == 0)); // 把已選定單排除
    }
  };
  // 確定上架
  const handleConfrimShelf = async () => {
    if (!currentStation) {
      Alert({ html: "抓不到站點位置" });
      return;
    }
    if (selected.length <= 0) {
      Alert({ html: "沒有選擇項目" });
      return;
    }

    const res = await onToShelf_in(setLoading, selected, shelf, order, dispatch, setInbound, currentStation, setConfirmModal);
    if (res.data.success) {
      let newShelf = shelfItem.map((s) => ({ ...s })); // ⬅ 防止 freeze

      selected.forEach((v) => {
        const index = newShelf.findIndex((s) => s.PRT_NO === v.PRT_NO);

        if (index !== -1) {
          // 建立新物件覆蓋，不 mutate 舊物件
          newShelf[index] = {
            ...newShelf[index],
            PP_NO: (Number(newShelf[index].PP_NO) || 0) + (Number(v.PP_NO) || 0),
            BOX_NO: (Number(newShelf[index].BOX_NO) || 0) + (Number(v.BOX_NO) || 0),
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
  };
  // 新增貨架
  const handleAddShelf = async () => {
    if (tableData2.length <= 0) {
      Alert({ title: "入庫單完成", html: `此入庫單已經完成，請選擇「 入庫單完成 」。` });
      return;
    }
    await addShelf_in(setLoading, setAddModal, shelf, order);
  };
  // 退回貨架
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
    if (tableData2.length > 0) {
      const { wcs, nodepos } = await checkCar(waveNo);
      console.log(wcs,'wcs')
      console.log(nodepos,'nodepos')
      if (wcs.data.data.length <= 0 && nodepos.data.data.length < 2) {
        // 沒有這個GGROUP的車了 只剩下一台車在站點了
        Alert({
          title: "入倉單未完成",
          html: `此入倉單未完成且只剩下一台車在工作站<br>如果退回將返回選單列表`,
          showCancel: true,
          onConfirm: async () => {
            // 目前不想做完此張入庫單的恢復
            const res = await restoreList_in(setLoading, waveNo);
            console.log(res.data);
            if (res.data.success) {
              await handleCancel();
            }
          },
        });
        return;
      }
    }
    await handleReturn();
  };

  const handleCancel = async () => {
    const res = await cancelShelf_in(setLoading, currentStation);
    if (res.data.success) {
      dispatch(resetInbound({ type: "wave", station: currentStation, W_ID: waveNo }));
    }
  };
  const handleReturn = async () => {
    const res = await returnShelf_in(setLoading, shelf, currentStation, order);
    if (res.data.success) {
      dispatch(resetInbound({ type: "one", station: currentStation, W_ID: waveNo }));
    }
  };
  const handleFinish = async () => {
    const res = await finishList_in(setLoading, order);
    if (res.data.success) {
      dispatch(resetInbound({ type: "wave", station: currentStation, W_ID: res.data.data }));
      Alert({ title: "此單已完成" });
    }
  };

  // -------------------------------*
  useEffect(() => {
    getTable(setTableData, orderList);
    barCodeRef?.current?.focus();
  }, [orderList]);
  useEffect(() => {
    if (!waveNo) return;
    getList(waveNo, setTableData2);
  }, [shelfItem]);

  return (
    <>
      {/* 主要內容區域 */}
      <div className="flex flex-1 gap-4 px-2 py-8 items-stretch">
        {/* 左側 */}
        <div className="w-3/7">
          {step > 2 && (
            <div className="flex  font-bold text-black space-x-4 p-2">
              <div className="flex flex-1 items-center">
                {shelf?.EstBoxes > 0 &&
                  `建議入倉總數：${shelf?.EstPPs}
                ${shelf?.UNIT} (${shelf?.EstBoxes}箱)
                `}
              </div>
              <ActionBtn text="入倉單完成" variant="orange" className="p-1" textSize={`16px`} disabled={tableData2.length > 0} onClick={handleFinish} />
            </div>
          )}
          <InboundTable data={tableData} data2={tableData2} setData2={setTableData2} />
        </div>
        {/* 右側 */}
        <div className="w-4/7 font-bold text-black p-4 flex flex-col">
          {/* 條碼 */}
          <div className="flex space-x-4 pb-4">
            <div className="flex flex-1 items-center">
              <label htmlFor="order" className="font-bold text-black">
                入庫單條碼:
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
                      <div className="flex justify-between">
                        <div>入倉單單號:{order?.INSTOCK_NO}</div>
                        <div>入庫庫別:{order?.STOCK_AREA}</div>
                      </div>
                      <div className="flex justify-between">
                        <div>產品品號:{order?.PRT_NO}</div>
                      </div>
                      <div className="mt-2 border-gray-300">
                        <div>品名: {order?.PRT_NAME}</div>
                        <div className="w-100 flex justify-between">
                          <div>箱數: {order?.BOX_NOS}箱</div>
                          <div>
                            數量: {order?.PP_NOS} {order?.UNIT}
                          </div>
                        </div>
                      </div>
                    </div>
                  </SchematicDiagramList>
                ) : (
                  <SchematicDiagram>
                    <div className="flex flex-col">
                      <div className="flex justify-between">
                        <div>{shelf ? `貨架編號: ${shelf?.SHELVE_ID}` : ""}</div>
                        <div>{shelf ? `入庫庫別: ${shelf?.area}` : ""}</div>
                      </div>

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

                          return (
                            <div key={item.PRT_NO + index} className={`mb-4 ${textClass}`}>
                              <div className="flex justify-between">
                                <div>產品品號: {item.PRT_NO}</div>
                              </div>
                              <div className="flex justify-between">
                                <div>產品品名: {item.PRT_NAME}</div>
                              </div>
                              <div className="flex justify-between">
                                <div>
                                  箱數: {item.BOX_NO} 箱{item.selectedBox > 0 && <span className="text-red-500">{`(+${item.selectedBox})`}</span>}
                                </div>
                                <div>
                                  數量: {item.PP_NO} {item.UNIT}
                                  {item.selectedPP > 0 && <span className="text-red-500">{`(+${item.selectedPP})`}</span>}
                                </div>
                                <div>
                                  車數 (還沒給我) {index + 1}/{displayItems.length}
                                </div>
                              </div>
                            </div>
                          );
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
              {step <= 2 && <ActionBtn icon="icon-check" text="確定" variant="orange" onClick={handleConfrimList} disabled={!waveNo} />}
              {step > 2 && (
                <div className="w-full flex justify-between">
                  <ActionBtn icon="" text="新增貨架" variant="orange" onClick={() => setAddModal(true)} disabled={tableData2?.length <= 0} />
                  <ActionBtn icon="" text="確定上架" variant="orange" onClick={() => setConfirmModal(true)} disabled={selected?.length <= 0} />
                  <ActionBtn icon="" text="退回貨架" variant="orange" onClick={() => setReturnModal(true)} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Modal - 確定 */}
      <Modal showModal={confirmModal} title="確認上架" onClose={() => setConfirmModal(false)} onConfirm={handleConfrimShelf} width={`30vw`} height={`auto`}>
        <>
          <div>請確定是否上架以下品項</div>
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
    </>
  );
}
