import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentStation } from "@/redux/reducer/reducerWorkStations";
import {
  setPage,
  setBatchNo,
  setInventory,
  updateShelfRemark,
  updateRowState,
  resetRowState,
  clearRowState,
} from "@/redux/reducer/reducerInventory";
import ActionBtn from "@/components/common/btns/actionBtn";
import PageHeader from "@/components/common/pageHeader/pageHeader";
import CheckTable from "@/components/common/table/checkTable";
import Alert from "@/components/common/alert/alert";
import SchematicDiagram from "../diagram/schematicDiagram";
import { deleteTask, sendToWMS, updateInventoryResult } from "@/pages/api";
import { generateRandomNumber } from "@/utils/random";

export default function InventoryShelf() {
  const dispatch = useDispatch();
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const { userId } = useSelector((s) => s.user);
  const { batchNo } = useSelector((state) => state.inventory);
  const stationState = useSelector((s) => s.inventory[currentStation]);
  const rowState = stationState?.rowState || [];
  const SHELVE_ID = stationState?.shelf?.SHELVE_ID;
  const shelfItem = stationState?.shelfItem;
  const currentSTOCKAREA = stationState?.filter?.stockArea;
  const currentCUSNO = stationState?.filter?.cusNo;
  const currentSALENO = stationState?.filter?.saleNo;
  const currentPRTNO = stationState?.filter?.prtNo;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(shelfItem[0]?.REMARK || "");

  // 目前選擇的工作站
  const handleSwitchStation = (station) => {
    dispatch(setCurrentStation(station));
  };

  const filterLabel = useMemo(() => {
    if (currentPRTNO) return `產品品號：${currentPRTNO}`;
    if (currentSALENO) return `訂單單號：${currentSALENO}`;
    if (currentCUSNO) return `客戶代號：${currentCUSNO}`;
    if (currentSTOCKAREA) return `庫區：${currentSTOCKAREA}`;
    return "未選擇篩選條件";
  }, [currentPRTNO, currentSALENO, currentCUSNO, currentSTOCKAREA]);

  /**
   * 篩選指定產品品號
   */
  const displayItems = useMemo(() => {
    // 1. 先過濾
    const filtered = currentPRTNO
      ? rowState.filter((r) => r.PRT_NO === currentPRTNO)
      : rowState;

    // 2. 加上唯一識別 ID (PRT_NO + SALE_NO)
    return filtered.map((item) => ({
      ...item,
      ROW_ID: `${item.PRT_NO}-${item.SALE_NO}`, // 產生唯一鍵
    }));
  }, [currentPRTNO, rowState]);

  /**
   * 修改數量
   */
  const handleQtyChange = (row, value) => {
    const v = Number(value);
    dispatch(
      updateRowState({
        station: currentStation,
        prtNo: row.PRT_NO,
        saleNo: row.SALE_NO,
        updates: { actualQty: v },
      }),
    );
  };

  /**
   * 按「正確」→ 自動完成盤點
   * 正確（actual === expected），標記為 confirmed 並清除 error
   */
  const handleConfirm = (row) => {
    dispatch(
      updateRowState({
        station: currentStation,
        prtNo: row.PRT_NO,
        saleNo: row.SALE_NO,
        updates: { confirmed: true, error: false },
      }),
    );
  };

  /**
   * 異常（數量不符）→ 修改後確定
   * 標記異常並同時確認（confirmed = true, error = true）
   */
  const handleMarkErrorAndConfirm = (row) => {
    dispatch(
      updateRowState({
        station: currentStation,
        prtNo: row.PRT_NO,
        saleNo: row.SALE_NO,
        updates: { confirmed: true, error: true },
      }),
    );
  };

  /**
   * 重新修改
   * 解除 confirmed 與 error）
   */
  const handleResetRow = (prtNo) => {
    dispatch(
      resetRowState({
        station: currentStation,
        prtNo,
      }),
    );
  };

  /**
   * checked items for CheckTable (checkbox 顯示來源)：
   * 我們把已確認或被標記異常的列視為「已盤完」，因此自動打勾
   */
  const checkedItems = rowState
    .filter((r) => r.confirmed || r.error)
    .map((r) => `${r.PRT_NO}-${r.SALE_NO}`);

  /**
   * 判斷是否可以送出 ERP：所有顯示列都必須 confirmed = true 代表已盤
   */
  const canSubmitToERP =
    displayItems.length > 0 && displayItems.every((r) => r.confirmed === true);

  /**
   * 左側 table 欄位
   */
  const tableHeader = [
    { label: "", key: "checkbox", width: `7%` },
    {
      label: "產品品號",
      key: "PRT_NO",
      width: `32%`,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.PRT_NO}</span>
          <span className="text-base text-gray-500 font-black">
            {row.SALE_NO}
          </span>
        </div>
      ),
    },
    {
      label: "總包數",
      key: "PP_NO",
      width: `22%`,
      render: (row) => `${row.PP_NO} (${row.BOX_NO}箱)`,
    },
    {
      label: "盤點包數",
      key: "actualQty",
      width: "20%",
      render: (row) => (
        <input
          type="number"
          className="w-full text-center border rounded"
          disabled={!!row.confirmed}
          value={row.actualQty ?? ""}
          onChange={(e) => handleQtyChange(row, e.target.value)}
        />
      ),
    },
    {
      label: "動作",
      key: "action",
      width: "19%",
      render: (row) => {
        if (row.confirmed) {
          return (
            <button
              className={`px-3 py-1 rounded-md font-bold text-white ${row.error ? "bg-rose-500" : "bg-green-500"}`}
              onClick={() => handleResetRow(row.PRT_NO)}>
              {row.error ? "重新修改" : "已確認"}
            </button>
          );
        }

        const isCorrect = Number(row.actualQty) === Number(row.PP_NO);

        return (
          <div className="flex gap-2">
            <button
              className={`px-2 py-1 rounded-md font-bold cursor-pointer ${isCorrect ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}
              disabled={!isCorrect}
              onClick={() => handleConfirm(row)}>
              正確
            </button>
            <button
              className={`px-2 py-1 rounded-md font-bold cursor-pointer ${!isCorrect ? "bg-rose-500 text-white" : "bg-gray-200 text-gray-500"}`}
              disabled={isCorrect}
              onClick={() => handleMarkErrorAndConfirm(row)}>
              異常
            </button>
          </div>
        );
      },
    },
  ];

  /**
   * 右側 shelf 資料顯示+操作
   */
  const submitToBackend = async () => {
    dispatch(
      setInventory({
        station: currentStation,
        data: { screen: "loading" },
      }),
    );
    const payload = {
      stations: stations,
      STATION: currentStation,
      batchNo: batchNo,
      SHELVE_ID: SHELVE_ID,
      REMARK: shelfItem[0]?.REMARK || "",
      rowState: rowState,
      UserId: userId,
    };
    const res = await updateInventoryResult(payload);
    if (res?.data?.success) {
      if (res?.data?.data?.remainCount === 0) {
        dispatch(setPage("inventory-table"));
        dispatch(setBatchNo(null));
        dispatch(
          setInventory({
            station: "*",
            data: {
              screen: "idle",
              filter: {
                stockArea: "",
                cusNo: "",
                saleNo: "",
                prtNo: "",
              },
              shelf: {
                SHELVE_ID: "",
              },
              shelfItem: [],
            },
          }),
        );
        dispatch(clearRowState({ station: "*" }));
      } else {
        dispatch(
          setInventory({
            station: currentStation,
            data: {
              screen: "loading",
              shelf: {
                SHELVE_ID: "",
              },
              shelfItem: [],
            },
          }),
        );
        dispatch(clearRowState({ station: currentStation }));
      }
    } else {
      Alert({ title: res?.error?.message });
    }
  };

  /**
   * 下線功能
   */
  const submitToOffline = async () => {
    Alert({
      title: "確定盤點下線？",
      showCancel: true,
      onConfirm: async () => {
        try {
          const random9 = generateRandomNumber();
          const data = {
            action: "cancel",
            dataid: random9,
            STATION: currentStation,
          };
          const res = await sendToWMS(data);
          if (res?.data?.success) {
            const deleteRes = await deleteTask({ stations: stations[0] });

            if (deleteRes?.data && deleteRes?.data?.success) {
              dispatch(setPage("inventory-table"));
              dispatch(setBatchNo(null));
              dispatch(
                setInventory({
                  station: "*",
                  data: {
                    screen: "idle",
                    filter: {
                      stockArea: "",
                      cusNo: "",
                      saleNo: "",
                      prtNo: "",
                    },
                    shelf: {
                      SHELVE_ID: "",
                    },
                    shelfItem: [],
                  },
                }),
              );
              dispatch(clearRowState({ station: "*" }));
            } else {
              Alert({ title: "WMS取消成功，但本地刪除任務失敗", deleteRes });
            }
          } else {
            Alert({ title: res?.error?.message });
          }
        } catch (error) {
          console.warn(error);
        }
      },
    });
  };

  // 當 Redux 的資料變動時，同步更新 local state，確保顯示最新資料
  useEffect(() => {
    setEditValue(shelfItem[0]?.REMARK || "");
  }, [shelfItem]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    // 檢查內容是否有變動，避免不必要的 dispatch
    if (editValue === shelfItem[0]?.REMARK) return;

    dispatch(
      updateShelfRemark({
        station: currentStation,
        remark: editValue,
      }),
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(shelfItem[0]?.REMARK || ""); // 還原
    }
  };

  return (
    <>
      {/* 頂部區域 */}
      <PageHeader title="請檢視棧板內容並執行盤點" backTo="/workspace" />
      {/* 主要內容區域 */}
      <div className="flex gap-4 py-2 items-stretch h-[72vh]">
        {/* 左側 */}
        <div className="w-[47%] flex flex-col">
          <CheckTable
            headers={tableHeader}
            data={displayItems}
            type="checkbox"
            name="inventory"
            variants="green"
            idKey="ROW_ID"
            checked={checkedItems}
            onChange={() => {}}
            height="74vh"
          />
        </div>
        {/* 右側 */}
        <div className="w-[53%] flex flex-col">
          {/* 條碼 */}
          <div className="flex items-center p-4">
            <div>{filterLabel}</div>
          </div>
          <div className="flex flex-col flex-1 min-h-0 justify-between bg-white p-4 pb-2 h-full overflow-hidden">
            <div
              className="custom-scrollbar"
              style={{ "--scrollbar-thumb-color": `var(--green-vivid)` }}>
              <SchematicDiagram>
                <div className="flex flex-col gap-2 text-(length:--font-size-2xl)">
                  <div className="flex items-center justify-between gap-4">
                    <div className="whitespace-nowrap">
                      貨架編號:{SHELVE_ID}
                    </div>
                    <div>庫別:{currentSTOCKAREA}</div>
                  </div>
                  <div
                    className="flex-1 flex items-center gap-2 truncate"
                    title={shelfItem[0]?.REMARK}
                    onDoubleClick={() => setIsEditing(true)}>
                    <div className="shrink-0">備註:</div>
                    {isEditing ? (
                      <input
                        autoFocus
                        className="flex-1 px-2 py-1 outline-none rounded bg-transparent focus:bg-white transition-colors duration-200"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                      />
                    ) : (
                      <div className="flex-1 px-2 py-1 truncate cursor-pointer hover:bg-gray-200/40 rounded transition-colors">
                        {shelfItem[0]?.REMARK || (
                          <span className="text-gray-400 italic">
                            (雙擊編輯備註)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="border-t border-[#c4a57b] pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0"></div>
                  <table className="w-full border-collapse text-center">
                    <thead className="bg-gray-300 rounded-lg">
                      <th className="rounded-tl-xl p-2 w-[25%]">產品品號</th>
                      <th className="p-2">品名</th>
                      <th className="p-2 w-[12%]">總箱數</th>
                      <th className="p-2 w-[18%]">總包數</th>
                      <th className="rounded-tr-xl p-2 w-[10%]">單位</th>
                    </thead>
                    <tbody className="bg-gray-100 rounded-lg">
                      {shelfItem.map((item, ii) => (
                        <ShelfItemRow
                          key={`${item.PRT_NO}`}
                          isLast={ii === shelfItem.length - 1}
                          item={item}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </SchematicDiagram>
            </div>
            <div className="relative flex flex-col justify-end items-center p-4">
              <ActionBtn
                text="確定"
                icon="icon-check"
                variant="orange"
                disabled={!canSubmitToERP}
                onClick={submitToBackend}
              />
              <div className="absolute right-0">
                <ActionBtn
                  text="下線"
                  variant="orange"
                  onClick={submitToOffline}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 底部按鈕區域 */}
      <div className="w-full flex justify-between gap-4 z-20">
        {stations.map((station) => (
          <ActionBtn
            text={station}
            variant="green"
            className="flex-1"
            disabled={currentStation === station ? true : false}
            onClick={() => handleSwitchStation(station)}
          />
        ))}
      </div>
    </>
  );
}

const ShelfItemRow = ({ item, isLast }) => {
  const isNew =
    item?.isNew || (item?.selectedBox > 0 && (item?.BOX_NO || 0) === 0);
  return (
    <tr className={`${isNew ? "text-red-500" : ""} bg-gray-100 rounded-lg`}>
      <td
        className={`p-2 ${isLast ? "rounded-bl-lg" : ""} truncate max-w-0`}
        title={item?.PRT_NO}>
        {item?.PRT_NO}
      </td>
      <td className="p-2 truncate max-w-0" title={item?.PRT_NAME}>
        {item?.PRT_NAME}
      </td>
      <td className="p-2 truncate max-w-0" title={item?.BOX_NO}>
        {item?.BOX_NO}
        <span className="inline-block text-red-500">
          {item?.selectedBox > 0 && `(+${item?.selectedBox})`}
        </span>
      </td>
      <td className="p-2 truncate max-w-0" title={item?.PP_NO}>
        {item?.PP_NO}{" "}
        <span className="inline-block text-red-500">
          {item?.selectedPP > 0 && `(+${item?.selectedPP})`}
        </span>
      </td>
      <td
        className={`p-2 truncate max-w-0 ${isLast ? "rounded-br-lg" : ""}`}
        title={item?.UNIT}>
        {item?.UNIT}
      </td>
    </tr>
  );
};
