import { useDispatch, useSelector } from "react-redux";
import { managerTransfer, resetTransfer, setTransfer } from "@/redux/reducer/reducerTransfer";
import Alert from "../common/alert/alert";
import { useEffect, useState } from "react";
import { getTable } from "./transferFunction";
import { Settings, Trash2, AlertCircle, Package, Activity, X, Database } from "lucide-react"; // 建議安裝 lucide-react
import { deleteTask } from "@/pages/api";

export default function TransferManager({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { stations } = useSelector((s) => s.workstation);
  const transfer = useSelector((state) => state.transfer);
  const { lackStation } = transfer;

  const [station, setStation] = useState("A01");
  const [allOrderList, setAllOrderList] = useState([]);

  const stationData = transfer[station] || {};
  const { screen, shelf, shelfItem } = stationData;

  useEffect(() => {
    getTable(setAllOrderList);
  }, []);

  const handleChange = (e, index) => {
    const { name, value, type, checked } = e.target;

    if (name === "step") {
      dispatch(
        managerTransfer({
          station,
          name,
          value: type === "checkbox" ? checked : value,
          index,
        }),
      );
    } else if (name === "waveNo") {
      dispatch(
        setTransfer({
          station,
          waveNo: value,
        }),
      );
    } else if (name === "order") {
      dispatch(
        setTransfer({
          station,
          orderCode: value,
        }),
      );
    } else if (name === "screen") {
      dispatch(
        setTransfer({
          station,
          screen: value,
        }),
      );
    } 
  };

  const handleClear = (type) => {
    Alert({
      title: type === "all" ? "確定清空所有站台資料？" : `確定清空 ${station} 資料？`,
      html: "此動作無法還原",
      showCancel: true,
      onConfirm: () => {
        dispatch(resetTransfer({ type, station: type === "all" ? stations : station }));
      },
    });
  };

  const handleClearTask = () => {
    Alert({
      title: `清除調撥單Task任務`,
      html: "此動作無法還原，請確認是否至後台清除資料",
      showCancel: true,
      onConfirm: async () => {
        await deleteTask({ stations: stations[0] });
      },
    });
  };

  // 取得狀態對應顏色
  const getStatusColor = (s) => {
    if (transfer[s]?.screen === "working") return "bg-green-600 text-white shadow-green-200";
    if (transfer[s]?.screen === "loading") return "bg-red-500 text-white shadow-red-200";
    if (transfer[s]?.screen === "idle") return "bg-slate-500 text-white shadow-slate-200";
    return "bg-slate-400 text-white";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-sm">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-[90vw] max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header: 控制列 */}
        <div className="p-4 bg-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-800 rounded-lg text-white">
              <Settings size={20} />
            </div>
            <h2 className="text-xl text-white">調撥單控制面板</h2>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleClearTask()} className="flex items-center gap-1 px-4 py-2 bg-red-50 text-red-600 hover:bg-yellow-300 hover:text-black rounded-lg text-sm  transition-colors border border-red-200">
              <Trash2 size={16} /> 清除任務
            </button>
            <button onClick={() => handleClear("all")} className="flex items-center gap-1 px-4 py-2 bg-red-500 text-red-100 bg-red-50 hover:bg-yellow-500 hover:text-black rounded-lg text-sm   transition-colors border border-red-200">
              <Trash2 size={16} /> 全部重置
            </button>
            <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200">
              <X size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 左側：站點快速切換 */}
          <div className="w-64 bg-slate-100 p-4 border-r overflow-y-auto space-y-2">
            <p className="text-xs   text-slate-500 uppercase tracking-wider mb-3">站點列表</p>
            {stations.map((s) => (
              <button
                key={s}
                onClick={() => setStation(s)}
                className={`w-full flex justify-between items-center px-4 py-2 rounded-xl transition-all ${station === s ? "ring-2 ring-blue-500 shadow-md transform scale-[1.02] " + getStatusColor(s) : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"}`}
              >
                <span className="font-mono  ">{s}</span>
                <div className={`w-2 h-2 rounded-full ${station === s ? "bg-white" : getStatusColor(s)}`} />
              </button>
            ))}
          </div>

          {/* 右側：詳細內容區 */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
            {/* 狀態卡片 */}
            <div className="p-6 grid grid-cols-3 gap-4 border-b bg-slate-300">
              <div className="p-4 bg-white rounded-xl border shadow-sm">
                <p className="text-slate-400 text-xs mb-1">當前貨架</p>
                <div className="text-2xl text-blue-600">{shelf?.SHELVE_ID || "---"}</div>
              </div>
              <div className="p-4 bg-white rounded-xl border shadow-sm">
                <p className="text-slate-400 text-xs mb-1">任務單號 (WID)</p>
                <div className="text-2xl text-slate-700">
                  <input type="text" name="waveNo" className="text-2xl text-slate-700 bg-transparent w-full outline-none focus:ring-2 focus:ring-slate-200 rounded px-1" value={transfer.waveNo || "無"} onChange={handleChange} />
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl border shadow-sm flex flex-col justify-center">
                <p className="text-slate-400 text-xs mb-1">調撥單號 (order)</p>
                <div className="text-xl text-slate-700">
                  <input type="text" name="order" className="text-2xl text-slate-700 bg-transparent w-full outline-none focus:ring-2 focus:ring-slate-200 rounded px-1" value={transfer.orderCode || "無"} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* 控制表單 */}
            <div className="px-6 pt-3 grid grid-cols-12 gap-6 z-1">
              <div className="col-span-5 space-y-4">
                <h3 className="flex items-center gap-2  text-slate-700">
                  <Activity size={18} /> 流程控制
                </h3>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                  <span className="text-sm text-slate-600">作業步驟</span>
                  <select name="step" value={transfer.step || 1} onChange={handleChange} className="bg-white border rounded px-3 py-1  ">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        Step {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-span-7 space-y-4">
                <div className="h-9"></div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                  <span className="text-sm text-slate-600">運行行為</span>
                  <select name="screen" value={screen || "loading"} onChange={handleChange} className="bg-white border rounded px-3 py-1  ">
                    <option value="loading">等待中 (Loading)</option>
                    <option value="working">執行中 (Working)</option>
                    <option value="idle">閒置 (Idle)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 貨架內容表格 */}
            <div className="px-6 pt-3 z-1">
              <h3 className="flex items-center gap-2   text-slate-700 mb-4">
                <Package size={18} /> 貨架詳情
              </h3>
              <div className="border rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="w-[25%] px-4 py-3 font-semibold text-slate-600">產品代號</th>
                      <th className="w-[50%] px-4 py-3 font-semibold text-slate-600">產品名稱</th>
                      <th className="w-[15%] px-4 py-3 font-semibold text-slate-600">包裝</th>
                      <th className="w-[15%] px-4 py-3 font-semibold text-slate-600">數量</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700 overflow-y-auto">
                    {shelfItem?.length > 0 ? (
                      shelfItem.map((v, index) => (
                        <tr key={index} className="hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-3">{v?.PRT_NO}</td>
                          <td className="px-4 py-3">{v?.PRT_NAME}</td>
                          <td className="px-4 py-3 text-slate-500">{v?.BOX_NO}</td>
                          <td className="px-4 py-3 text-slate-500">{v?.PP_NO}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-4 py-10 text-center text-slate-400 italic">
                          目前貨架無品項
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <Database className="absolute -bottom-15 -right-20 text-slate-200 opacity-50 pointer-events-none" size={500} />
          </div>
        </div>
      </div>
    </div>
  );
}
