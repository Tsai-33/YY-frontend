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

  // MODAL 開關
  const [addModal, setAddModal] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);

  // 站點
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const currentStationSafe = currentStation || stations?.[0] || "";
  const { orderList } = useSelector((s) => s.inbound);
  const { step, screen, orderCode, order, shelf, shelfItem, selected, waveNo } = useSelector((s) => s.inbound[currentStationSafe] || {});

  // 設置
  const displayItems = useShelfDisplay(shelfItem, selected);

  // 掃描 QR code (ERP抓取新資料)
  const handleBarCode = async (e) => {
    if (screen === "loading") return;
    if (e.key !== "Enter") return;
    const inputBarCode = e.target.value.trim();
    const result = tableData.some((item) => item?.INSTOCK_NO === inputBarCode);
    if (result) {
      const value = tableData.find((item) => item?.INSTOCK_NO === inputBarCode);
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
      await getERP(setLoading, inputBarCode, setTableData, orderList);
    }
  };

  // 確認入庫單
  const handleConfrimList = async () => {
    if (!waveNo) {
      Alert({ title: "您未選擇入倉單" });
      return;
    }

    // 確認是否有其他任務
    const task = await checkTask_in(stations);
    if (!task?.success) return;
    const hasTask = task?.data?.data?.some((item) => item?.location === "inbound" || item?.location === "");
    if (!hasTask) {
      Alert({ title: "目前有其他任務正在執行" });
      return;
    }

    // 先清空原本的此站的選擇
    dispatch(setInbound({ station: currentStation, order: {}, waveNo: null, orderCode: "", step: 1 }));

    const res = await confrimList_in(setLoading, order);
    if (res?.success) {
      // 應該會告訴我有哪些station被占用，這裡可能是map方式全部設定
      let lack_station = res?.data?.data?.message2;
      if (!Array.isArray(lack_station)) {
        try {
          // 嘗試把字串轉成陣列
          lack_station = JSON.parse(lack_station.replace(/'/g, '"'));
        } catch (e) {
          console.warn("lack_station 格式錯誤:", lack_station, e);
          lack_station = []; // fallback 防止爆掉
        }
      }
      if (lack_station.length > 0) {
        lack_station.map((station) => {
          dispatch(setInbound({ station: station, screen: "loading", orderCode: orderCode, waveNo: order.W_ID, order: order, orderList: orderCode, lackStation: station }));
        });
      }
      setTableData((prev) => prev.filter((v) => v.INSTOCK_NO !== orderCode && v.STATUS == 0)); // 把已選定單排除

      // 寫入
      await addTask_in(stations);
    } else if (!res?.success) {
      Alert({ title: `${res?.error?.message}` });
    }
  };
  // 確定上架
  const handleConfrimShelf = async () => {
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
      let newShelf = shelfitem?.map((s) => ({ ...s })); // ⬅ 防止 freeze
      selected.forEach((v) => {
        const index = newShelf.findIndex((s) => s.PRT_NO === v.PRT_NO);

        if (index !== -1) {
          // --- 處理字串疊加的輔助函式 ---
          const mergeUnique = (oldStr, newStr) => {
            if (!oldStr) return newStr || "";
            if (!newStr) return oldStr || "";
            // 將舊字串與新字串拆開，放入 Set 自動去重，再重新組合
            const combined = [...new Set([...oldStr.split(","), ...newStr.split(",")])];
            return combined.filter(Boolean).join(","); // filter(Boolean) 移除空字串
          };

          newShelf[index] = {
            ...newShelf[index],
            // 數字維持累加
            PP_NO: (Number(newShelf[index].PP_NO) || 0) + (Number(v.PP_NO) || 0),
            BOX_NO: (Number(newShelf[index].BOX_NO) || 0) + (Number(v.BOX_NO) || 0),
            // 字串進行不重複疊加
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
    } else if (!res?.success) {
      Alert({ title: res?.error?.message });
    }
  };
  // 新增貨架
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
      const res = await checkCar(waveNo);
      if (res?.data?.success && !res?.data?.data) {
        Alert({
          title: "入倉單未完成",
          html: `此入倉單未完成且只剩下一台車在工作站<br>如果退回將返回選單列表<br>( ※退回後將清空您對此單據所有執行過的動作 )`,
          showCancel: true,
          onConfirm: async () => {
            // 目前不想做完此張入庫單的恢復
            const res = await restoreList_in(setLoading, waveNo);
            console.log(res);
            if (res?.data?.success) {
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
    if (res?.data?.success) {
      dispatch(resetInbound({ type: "wave", station: currentStation, W_ID: waveNo }));
      deleteTask_in(stations);
    } else if (!res?.data?.success) {
      Alert({ title: `${res?.data?.message}` });
    }
  };
  const handleReturn = async () => {
    const res = await returnShelf_in(setLoading, shelf, currentStation, order);
    if (res?.success) {
      dispatch(resetInbound({ type: "one", station: currentStation, W_ID: waveNo }));
    } else if (!res?.success) {
      Alert({ title: `${res?.error?.message}` });
    }
  };
  const handleFinish = async () => {
    const res = await finishList_in(setLoading, order);
    if (res?.success) {
      dispatch(resetInbound({ type: "wave", station: currentStation, W_ID: res?.data?.data }));
      Alert({ title: "此單已完成" });

      // 先檢查nodepos有沒有ggroup
      const check = await checkNodePos();
      if (check?.data?.data?.length <= 0) {
        await deleteTask_in(stations);
      }
    } else if (!res?.success) {
      Alert({ title: res?.error?.message });
    }
  };

  // -------------------------------*
  useEffect(() => {
    getTable(setTableData, orderList);
  }, [orderList]);
  useEffect(() => {
    if (!waveNo) return;
    getList(waveNo, setTableData2);
    // console.log('1')
    // if (tableData2.length <= 0) {
    //   dispatch(setInbound({ station: currentStation, step: 4 }));
    // } else {
    //   dispatch(setInbound({ station: currentStation, step: 3 }));
    // }
  }, [shelfItem]);

  return (
    <>
      {/* 主要內容區域 */}
      <div className="flex gap-4 py-2 items-stretch h-[72vh]">
        {/* 左側 */}
        <div className="w-[47%] flex flex-col">
          {step > 2 && (
            <div className="flex p-2">
              <div className="flex flex-1 min-h-0 items-center">
                {shelf?.EstBoxes > 0 &&
                  `建議入倉總數：${shelf?.EstPPs}
                ${shelf?.UNIT} (${shelf?.EstBoxes}箱)
                `}
              </div>
              <ActionBtn icon="icon-check" text="入倉單完成" variant="orange" disabled={tableData2.length > 0} onClick={handleFinish} />
            </div>
          )}
          <div className="flex-1 min-h-0">
            <InboundTable data={tableData} data2={tableData2} setData2={setTableData2} />
          </div>
        </div>
        {/* 右側 */}
        <div className="w-[53%] flex flex-col">
          {/* 條碼 */}
          <div className="flex items-center p-4">
            <label htmlFor="order">
              入庫單條碼
              <span className="text-lg px-1">:</span>
            </label>
            {step <= 2 ? (
              <div className="w-75">
                <InputFrame type="text" name="orderCode" id="order" ref={barCodeRef} onKeyDown={handleBarCode} />
              </div>
            ) : (
              orderCode
            )}
          </div>

          {/* 資料 */}
          <div className="flex flex-col flex-1 min-h-0 bg-white p-8 pb-4">
            {/* 內容區 */}
            <div className="flex-1 min-h-0 custom-scrollbar pb-8" style={{ "--scrollbar-thumb-color": `var(--green-vivid)` }}>
              {orderCode ? (
                step <= 2 ? (
                  <SchematicDiagramList>
                    <div className="flex flex-col ">
                      <div className="flex justify-between">
                        <div className="flex gap-x-2">
                          <span>入倉單單號:</span>
                          <span>{order?.INSTOCK_NO}</span>
                        </div>
                        <div className="flex gap-x-2">
                          <span>入庫庫別:</span>
                          <span>{order?.STOCK_AREA}</span>
                        </div>
                      </div>
                      <div className="flex gap-x-2">
                        <span>產品品號:</span>
                        <span>{order?.PRT_NO}</span>
                      </div>
                      <div className="flex gap-x-2">
                        <span>品名:</span>
                        <span>{order?.PRT_NAME}</span>
                      </div>
                      <div className="flex gap-16">
                        <div className="flex gap-x-2">
                          <span>箱數:</span>
                          <span>{order?.BOX_NOS}</span>
                          <span>箱</span>
                        </div>
                        <div className="flex gap-x-2">
                          <span>數量:</span>
                          <span>{order?.PP_NOS}</span>
                          <span>{order?.UNIT}</span>
                        </div>
                      </div>
                    </div>
                  </SchematicDiagramList>
                ) : (
                  <SchematicDiagram>
                    <div className="flex flex-col">
                      {shelf && (
                        <div className="flex justify-between">
                          <div className="flex gap-x-2">
                            <span>貨架編號:</span>
                            <span>{shelf?.SHELVE_ID}</span>
                          </div>
                          <div className="flex gap-2">
                            <div className="w-[9rem]">入庫庫別:</div>
                            <div>{shelf?.area}</div>
                          </div>
                        </div>
                      )}
                      {/* 列表渲染 */}
                      {displayItems.length === 0 ? <div className="h-25"></div> : displayItems.map((item, index) => <ShelfItemRow key={`${item?.PRT_NO}-${index}`} item={item} isLast={index === displayItems.length - 1} shelfCars={shelf?.CARS} index={index} />)}
                    </div>
                  </SchematicDiagram>
                )
              ) : (
                ""
              )}
            </div>
            {/* 按鈕區 */}
            <div className="flex-1 min-h-0 flex flex-col justify-end items-center p-4">
              {step <= 2 && <ActionBtn icon="icon-check" text="確定" variant="orange" onClick={handleConfrimList} disabled={!waveNo} />}
              {step > 2 && (
                <div className="w-full flex justify-between">
                  <ActionBtn icon="icon-add" text="新增貨架" variant="orange" onClick={() => setAddModal(true)} disabled={tableData2?.length <= 0} />
                  <ActionBtn icon="icon-inbound" text="確定上架" variant="orange" onClick={() => setConfirmModal(true)} disabled={selected?.length <= 0} />
                  <ActionBtn icon="icon-returnShelf" text="退回貨架" variant="orange" onClick={() => setReturnModal(true)} />
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
                  if (!acc[item?.PRT_NO]) {
                    acc[item?.PRT_NO] = {
                      ...item,
                      PP_NO: Number(item?.PP_NO) || 0,
                    };
                  } else {
                    acc[item?.PRT_NO].PP_NO += Number(item?.PP_NO) || 0;
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

const useShelfDisplay = (shelfItem, selected) => {
  const displayItems = useMemo(() => {
    const shelfList = Array.isArray(shelfItem) ? shelfItem : [];
    const selectedList = Array.isArray(selected) ? selected : [];

    // 建立 Map
    const tempMap = new Map(shelfList.map((item) => [item?.PRT_NO, { ...item, selectedBox: 0, selectedPP: 0, isNew: false }]));

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

  return displayItems;
};

const ShelfItemRow = ({ item, isLast, shelfCars, index }) => {
  const isNew = item?.isNew || (item?.selectedBox > 0 && (item?.BOX_NO || 0) === 0 && (item?.PP_NO || 0) === 0);
  return (
    <div className={`${!isLast && "mb-12"} ${isNew && "text-red-500"}`}>
      <div className="flex justify-between">
        <div className="flex gap-x-2">
          <span>產品品號:</span>
          <span>{item?.PRT_NO}</span>
        </div>
        {index === 0 && (
          <div className="flex justify-start gap-x-2">
            <div>棧板規格:</div>
            <div>{item?.error || "美規"}</div>
          </div>
        )}
      </div>
      <div className="flex justify-between">
        <div className="flex gap-x-2">
          <span>產品品名:</span>
          <span>{item?.PRT_NAME}</span>
        </div>
      </div>
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
        <div className="absolute bottom-0 right-0">
          {isLast && shelfCars ? (
            <div>
              {/* <span className="pr-2">車數:</span> */}
              <span>{shelfCars}</span>
            </div>
          ) : (
            <div className="w-20" />
          )}
        </div>
      </div>
    </div>
  );
};
