import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Settings, Trash2, Package, Activity, X, Database } from "lucide-react";
import {
  clearRowState,
  setBatchNo,
  setInventory,
  setPage,
} from "@/redux/reducer/reducerInventory";
import Alert from "../common/alert/alert";
import { deleteTask, sendToWMS, updateInventoryResult } from "@/pages/api";
import { generateRandomNumber } from "@/utils/random";

export default function InventoryManage({ isOpen, onClose }) {
  const dispatch = useDispatch();

  // 1. 從 Redux 取得原始資料
  const { stations } = useSelector((s) => s.workstation);
  const { userId } = useSelector((s) => s.user);
  const inventory = useSelector((s) => s.inventory);

  // 2. 本地狀態
  const [currentStation, setCurrentStation] = useState("");

  // 當 stations 載入後，預設選取第一個
  useEffect(() => {
    if (stations?.length > 0 && !currentStation) {
      setCurrentStation(stations[0]);
    }
  }, [stations, currentStation]);

  // 4. 取得當前選中站點的具體資料
  const page = inventory?.page;
  const batchNo = inventory?.batchNo || "無批次號";
  const activeData = inventory[currentStation] || {};
  const shelf = activeData?.shelf || {};
  const shelfItem = activeData?.shelfItem || [];
  const rowState = activeData?.rowState || [];
  const screen = activeData?.screen;

  // 5. 事件處理：發送到 Redux
  const handleUpdateScreen = (updates) => {
    dispatch(
      setInventory({
        station: currentStation,
        data: updates,
      })
    );
  };

  const handleUpdatePage = (updates) => {
    dispatch(setPage(updates));
  };

  const submitToBackend = async () => {
    const payload = {
      stations: stations,
      STATION: currentStation,
      batchNo: batchNo,
      SHELVE_ID: shelf?.SHELVE_ID,
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

  const submitToOffline = () => {
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
        }
      },
    });
  };

  const handleClear = () => {
    Alert({
      title: "確定清空所有盤點資料？",
      showCancel: true,
      onConfirm: () => {
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
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-md p-4">
      <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden border border-white/20">
        {/* Header */}
        <div className="p-5 bg-slate-900 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
              <Settings size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-none">
                庫存管理控制台
              </h2>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-white hover:bg-red-500 hover:text-white rounded-xl text-sm transition-all border border-white-500/20"
              onClick={submitToOffline}>
              <Trash2 size={16} /> 下線
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl text-sm transition-all border border-red-500/20"
              onClick={handleClear}>
              <Trash2 size={16} /> 重置所有站點
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 text-slate-400 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 左側：站點導覽 */}
          <div className="w-64 bg-slate-100/80 p-4 border-r border-slate-200 overflow-y-auto">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 block px-2">
              Stations
            </label>
            <div className="space-y-2">
              {stations.map((s) => (
                <button
                  key={s}
                  onClick={() => setCurrentStation(s)}
                  className={`w-full flex justify-between items-center px-4 py-3 rounded-2xl transition-all ${
                    currentStation === s
                      ? "bg-white shadow-md ring-1 ring-indigo-500 text-indigo-600 font-bold translate-x-1"
                      : "text-slate-500 hover:bg-slate-200"
                  }`}>
                  <span className="font-mono">{s}</span>
                  {inventory[s]?.screen === "loading" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 右側：主內容區 */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* 狀態儀表板 */}
            <div className="p-6 grid grid-cols-3 gap-6 bg-white border-b border-slate-100">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase">
                  貨架編號
                </span>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-black text-slate-800">
                    {shelf?.SHELVE_ID || "未綁定"}
                  </div>
                  <button
                    className={`p-1 rounded-md text-xs font-bold border transition-all duration-200
    ${
      !shelf?.SHELVE_ID || shelf.SHELVE_ID.trim() === ""
        ? "bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-60 shadow-none"
        : "bg-red-100 border-red-200 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 active:scale-95 shadow-sm"
    }`}
                    onClick={submitToBackend}
                    disabled={
                      !shelf?.SHELVE_ID || shelf.SHELVE_ID.trim() === ""
                    }>
                    退回貨架
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase">
                  盤點批次號
                </span>
                <div className="text-2xl font-black text-indigo-600">
                  {batchNo || "---"}
                </div>
              </div>
            </div>

            {/* 表格區 */}
            <div className="flex-1 p-6 flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="text-indigo-500" size={20} />
                <h3 className="font-bold text-slate-700">流程控制</h3>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-slate-400 uppercase">
                    作業步驟
                  </span>
                  <div className="flex gap-2">
                    {["inventory-table", "inventory-shelf"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => handleUpdatePage(mode)}
                        className={`px-3 py-1 rounded-md text-base font-bold border transition-all ${
                          page === mode
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300"
                        }`}>
                        {mode.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-slate-400 uppercase">
                    運行行為
                  </span>
                  <div className="flex gap-2">
                    {["loading", "idle"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => handleUpdateScreen({ screen: mode })}
                        className={`px-3 py-1 rounded-md text-base font-bold border transition-all ${
                          screen === mode
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300"
                        }`}>
                        {mode.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Package className="text-indigo-500" size={20} />
                <h3 className="font-bold text-slate-700">貨架品項清單</h3>
              </div>
              <div className="flex-1 border border-slate-100 rounded-2xl overflow-hidden shadow-sm flex flex-col bg-slate-50/30">
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white border-b border-slate-100 shadow-sm z-10">
                      <tr>
                        <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase">
                          產品編號
                        </th>
                        <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase">
                          品名
                        </th>
                        <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase">
                          數量
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {shelfItem.length > 0 ? (
                        shelfItem.map((item, idx) => (
                          <tr
                            key={idx}
                            className="bg-white hover:bg-indigo-50/30 transition-colors">
                            <td className="px-6 py-4 font-mono text-sm">
                              {item.PRT_NO}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-700">
                              {item.PRT_NAME}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-slate-100 rounded font-bold text-xs">
                                {item.PP_NO}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="3"
                            className="px-6 py-12 text-center text-slate-400 italic">
                            暫無品項資料
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
