import { useDispatch, useSelector } from "react-redux";
import { managerInbound, resetInbound, setInbound, updateOrderList } from "@/redux/reducer/reducerInbound";
import Alert from "../common/alert/alert";
import { useEffect, useState } from "react";
import { getTable } from "./inboundFunction";
import { Settings, Trash2, Package, Activity, X, Filter, Lock, Database, Search } from "lucide-react";
import { deleteTask, sendToWMS } from "@/pages/api";
import { FaReplyAll } from "react-icons/fa";
import { GrPowerReset } from "react-icons/gr";
import { generateRandomNumber } from "@/utils/random";

export default function InboundManager({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { stations } = useSelector((s) => s.workstation);
  const inbound = useSelector((state) => state.inbound);

  const [station, setStation] = useState("A01");
  const [o, setO] = useState("");
  const [allOrderList, setAllOrderList] = useState([]);

  const stationData = inbound[station] || {};
  const { step, screen, waveNo, shelf, shelfItem, orderCode } = stationData;

  useEffect(() => {
    getTable(setAllOrderList, setAllOrderList);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "step") {
      dispatch(
        managerInbound({
          station,
          name,
          value: type === "checkbox" ? checked : value,
        }),
      );
    } else if (name === "waveNo") {
      dispatch(
        setInbound({
          station,
          waveNo: value,
        }),
      );
    } else if (name === "order") {
      dispatch(
        setInbound({
          station,
          orderCode: value,
        }),
      );
    } else if (name === "screen") {
      dispatch(
        setInbound({
          station,
          screen: value,
        }),
      );
    }
  };

  const handleClear = (type, targetStation) => {
    Alert({
      title: type === "all" ? "確定清空所有入庫資料？" : `確定清空 ${targetStation} 資料？`,
      showCancel: true,
      onConfirm: () => {
        dispatch(resetInbound({ type, station: targetStation }));
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

  const handleTaskdone = async () => {
    if (step <= 2) return;
    const random = generateRandomNumber();
    const data = { action: "ask_done", STATION: station, dataid: random };
    const res = await sendToWMS(data);
    if (res?.data?.data?.result == "ok") {
      Alert({ title: '重抓成功' });
      dispatch(setInbound({ step: 3, screen: "working" }));
    } else {
      Alert({ title: res?.data?.data?.result });
    }
  };

  const handleOrder = (type) => {
    dispatch(updateOrderList({ type, order: o }));
  };

  const getStatusColor = (s) => {
    if (inbound[s]?.screen === "working") return "bg-green-600 text-white shadow-green-200";
    if (inbound[s]?.screen === "loading") return "bg-red-500 text-white shadow-red-200";
    if (inbound[s]?.screen === "idle") return "bg-slate-500 text-white shadow-slate-200";
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
            <h2 className="text-xl text-white text-slate-800">入庫單控制面板</h2>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleTaskdone()} className="flex items-center gap-1 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-yellow-500 hover:text-black rounded-lg text-sm  transition-colors border border-blue-200">
              <FaReplyAll size={16} /> 重發任務
            </button>
            <button onClick={() => handleClearTask()} className="flex items-center gap-1 px-4 py-2 bg-red-50 text-red-600 hover:bg-yellow-500 hover:text-black rounded-lg text-sm  transition-colors border border-red-200">
              <Trash2 size={16} /> 清除任務
            </button>
            <button onClick={() => handleClear("all", stations)} className="flex items-center gap-1 px-4 py-2 bg-red-500 text-red-100 bg-red-50 hover:bg-yellow-500 hover:text-black rounded-lg text-sm   transition-colors border border-red-200">
              <GrPowerReset size={16} /> 全部重置
            </button>
            <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200">
              <X size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
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

          {/* 右側：主工作區 */}
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
                  <input type="text" name="waveNo" className="text-2xl text-slate-700 bg-transparent w-full outline-none focus:ring-2 focus:ring-slate-200 rounded px-1" value={waveNo || "無"} onChange={handleChange} />
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl border shadow-sm flex flex-col justify-center">
                <p className="text-slate-400 text-xs mb-1">入庫單號 (order)</p>
                <div className="text-xl text-slate-700">
                  <input type="text" name="order" className="text-2xl text-slate-700 bg-transparent w-full outline-none focus:ring-2 focus:ring-slate-200 rounded px-1" value={orderCode || "無"} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* 排除訂單區  */}
            <div className="px-6 pt-3 z-1">
              <div className="col-span-5 space-y-4">
                <h3 className="flex items-center gap-2 text-slate-700">
                  <Filter size={18} /> 顯示訂單
                </h3>
                <div className="text-sm">{inbound?.orderList?.map((v) => v).join(",")}</div>
                <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border">
                  <span className="text-sm text-slate-600">排除項目</span>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    {/* 調整 select：背景改為白底，框線變淡 */}
                    <select className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none text-slate-700" value={o} onChange={(e) => setO(e.target.value)}>
                      <option value="" className="text-slate-900">
                        搜尋或選擇入庫單...
                      </option>
                      {allOrderList.map((v, i) => (
                        <option key={i} value={v.INSTOCK_NO} className="text-slate-900">
                          {v.INSTOCK_NO}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button onClick={() => handleOrder("add")} className="text-sm text-white px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-all active:scale-95 shadow-sm">
                    新增排除
                  </button>
                  <button onClick={() => handleOrder("clear")} className="text-sm text-slate-500 px-4 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all border border-slate-200">
                    重置清單
                  </button>
                </div>
              </div>
            </div>

            {/* 控制表單 */}
            <div className="px-6 pt-3 grid grid-cols-12 gap-6 z-1">
              <div className="col-span-5 space-y-4">
                <h3 className="flex items-center gap-2 text-slate-700">
                  <Activity size={18} /> 流程控制
                </h3>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                  <span className="text-sm text-slate-600">作業步驟</span>
                  <select name="step" value={step || 1} onChange={handleChange} className="bg-white border rounded px-3 py-1  ">
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
              <h3 className="flex items-center gap-2 mb-4 text-slate-700">
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
