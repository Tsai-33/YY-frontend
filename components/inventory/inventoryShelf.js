import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentStation } from "@/redux/reducer/reducerWorkStations";
import {
  setPage,
  setBatchNo,
  setInventory,
  setInitialRowState,
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

  // ============================
  // ⭐ 篩選指定產品品號
  // ============================
  const displayItems = useMemo(() => {
    return currentPRTNO
      ? rowState.filter((r) => r.PRT_NO === currentPRTNO)
      : rowState;
  }, [currentPRTNO, rowState]);

  // ============================
  // ⭐ 修改數量
  // ============================
  const handleQtyChange = (row, value) => {
    const v = Number(value);
    dispatch(
      updateRowState({
        station: currentStation,
        prtNo: row.PRT_NO,
        updates: { actualQty: v },
      })
    );
  };

  // ============================
  // ⭐ 按「正確」→ 自動完成盤點
  // 正確（actual === expected），標記為 confirmed 並清除 error
  // ============================
  const handleConfirm = (row) => {
    dispatch(
      updateRowState({
        station: currentStation,
        prtNo: row.PRT_NO,
        updates: { confirmed: true, error: false },
      })
    );
  };

  // ============================
  // ⭐ 異常（數量不符）→ 修改後確定
  // 標記異常並同時確認（confirmed = true, error = true）
  // ============================
  const handleMarkErrorAndConfirm = (row) => {
    dispatch(
      updateRowState({
        station: currentStation,
        prtNo: row.PRT_NO,
        updates: { confirmed: true, error: true },
      })
    );
  };

  // ============================
  // ⭐ 重新修改
  //（解除 confirmed 與 error）
  // ============================
  const handleResetRow = (prtNo) => {
    dispatch(
      resetRowState({
        station: currentStation,
        prtNo,
      })
    );
  };

  // ============================
  // checked items for CheckTable (checkbox 顯示來源)：
  // 我們把已確認或被標記異常的列視為「已盤完」，因此自動打勾
  // ============================
  const checkedItems = rowState
    .filter((r) => r.confirmed || r.error)
    .map((r) => r.PRT_NO);

  // ============================
  // 判斷是否可以送出 ERP：所有顯示列都必須 confirmed = true 代表已盤
  // ============================
  const canSubmitToERP =
    displayItems.length > 0 && displayItems.every((r) => r.confirmed === true);

  // ============================
  // ⭐ 左側 table 欄位
  // ============================
  const tableHeader = [
    { label: "", key: "checkbox", width: `7%` },
    { label: "產品品號", key: "PRT_NO", width: `32%` },
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
              className={`px-3 py-1 rounded-md font-bold text-white ${
                row.error ? "bg-rose-500" : "bg-green-500"
              }`}
              onClick={() => handleResetRow(row.PRT_NO)}>
              {row.error ? "重新修改" : "已確認"}
            </button>
          );
        }

        const isCorrect = Number(row.actualQty) === Number(row.PP_NO);

        return (
          <div className="flex gap-2">
            <button
              className={`px-2 py-1 rounded-md font-bold cursor-pointer ${
                isCorrect
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
              disabled={!isCorrect}
              onClick={() => handleConfirm(row)}>
              正確
            </button>
            <button
              className={`px-2 py-1 rounded-md font-bold cursor-pointer ${
                !isCorrect
                  ? "bg-rose-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
              disabled={isCorrect}
              onClick={() => handleMarkErrorAndConfirm(row)}>
              異常
            </button>
          </div>
        );
      },
    },
  ];

  // ============================
  // ⭐ 右側 shelf 資料顯示+操作
  // ============================
  const submitToBackend = async () => {
    const payload = {
      stations: stations,
      STATION: currentStation,
      batchNo: batchNo,
      SHELVE_ID: SHELVE_ID,
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
          })
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
          })
        );
        dispatch(clearRowState({ station: currentStation }));
      }
    } else {
      Alert({ title: res?.error?.message });
    }
  };

  // ============================
  // ⭐ 下線功能
  // ============================
  const submitToOffline = async () => {
    dispatch(
      setInventory({
        station: "*",
        data: { screen: "loading" },
      })
    );
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
            })
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
    } finally {
      dispatch(
        setInventory({
          station: "*",
          data: { screen: "idle" },
        })
      );
    }
  };

  return (
    <>
      {/* 頂部區域 */}
      <PageHeader title="請檢視棧板內容並執行盤點" backTo="/workspace" />
      {/* 主要內容區域 */}
      <div className="flex-1 flex gap-4 py-2 items-stretch">
        {/* 左側 */}
        <div className="w-[47%]">
          <CheckTable
            headers={tableHeader}
            data={displayItems}
            type="checkbox"
            name="inventory"
            variants="green"
            idKey="PRT_NO"
            checked={checkedItems}
            onChange={() => {}}
            height="100%"
          />
        </div>
        {/* 右側 */}
        <div className="w-[53%] font-bold text-black flex flex-col gap-5">
          {/* 條碼 */}
          <div className="w-full flex justify-between text-(length:--font-size-2xl)">
            <div>{filterLabel}</div>
          </div>
          <div className="flex-1 min-h-0 bg-white p-5 flex flex-col gap-5 justify-between">
            <div className="flex-1 overflow-y-auto max-h-[473px]">
              <SchematicDiagram>
                <div className="flex justify-between text-(length:--font-size-4xl)">
                  <div>
                    <div className="mb-4">貨架編號:{SHELVE_ID}</div>
                    {shelfItem.map((item, index) => (
                      <div className="mb-4">
                        <div>產品品號:{item?.PRT_NO}</div>
                        <div>產品品名:{item?.PRT_NAME}</div>
                        <div className="flex justify-between">
                          <div>箱數:{item?.BOX_NO}</div>
                          <div>包數:{item?.PP_NO}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="mb-4">出庫庫別 : {currentSTOCKAREA}</div>
                    <div>棧板規格 : 美規</div>
                    <div>{/* {index + 1}/{shelfItem.length} */}</div>
                  </div>
                </div>
              </SchematicDiagram>
            </div>
            <div className="w-full flex justify-center relative">
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
