import { useDispatch, useSelector } from "react-redux";
import { managerTransfer, resetTransfer } from "@/redux/reducer/reducerTransfer";

import Alert from "../common/alert/alert";
import { useEffect, useState } from "react";
import { gettransfer, getTransferByCMDID } from "@/pages/api";

export default function TransferManager({ isOpen, onClose }) {
  const dispatch = useDispatch();

  const stations = ["A01", "A02", "A03", "A04", "A05", "A06", "A07", "A08", "A09", "A10"];

  // UI local state
  const [station, setStation] = useState("A01");

  // 全部 transfer 資料
  const transfer = useSelector((state) => state.transfer);
  const { lackStation } = useSelector((state) => state.transfer);

  // 依照選擇站台拿資料
  const stationData = transfer[station] || {};
  const { step, screen, waveNo, shelf, shelfItem } = stationData;

  // 更改站台資料
  const handleChange = (e, index) => {
    dispatch(
      managerTransfer({
        station,
        name: e.target.name,
        value: e.target.value,
        checked: e.target.checked,
        index,
      })
    );
  };

  // 清除當前 station 的資料
  const handleClear = (type) => {
    Alert({
      title: "是否確定清除？",
      showCancel: true,
      onConfirm: () => {
        dispatch(resetTransfer({ type, station }));
      },
    });
  };

  useEffect(() => {
    gettransferData();
  }, []);
  const gettransferData = async () => {
    try {
      const res = await getTransferByCMDID();
      if (res.data.success) {
        console.log(res.data.data, "res.data.data");
      }
    } catch (err) {
      Alert({ title: "網路不穩定，請稍後在試！" });
      console.warn(`gettransferData :`, err);
    } finally {
    }
  };

  return (
    <div id="modal" className={`${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} fixed inset-0 flex items-center justify-center bg-black/50 z-50`}>
      <div className="p-4 bg-white rounded-xl shadow-lg w-[50vw] max-h-[80vh] flex flex-col overflow-hidden">
        {/* title */}
        <div className="sticky top-0 bg-white z-10 border-b p-2">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">控制面板</h2>
            <button onClick={() => handleClear("all")} className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-gray-500 text-white">
              清空所有調撥
            </button>

            <button className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition-colors" onClick={onClose}>
              X
            </button>
          </div>
        </div>
        {/* 站點按鈕 */}
        <div className="flex items-center gap-2 relative py-4">
          {stations.map((s) => (
            <button
              key={s}
              onClick={() => setStation(s)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition 
                ${station === s ? "bg-green-500 text-white" : lackStation.includes(s) ? "bg-red-500 text-white" : "bg-gray-300 text-gray-800"}
                `}
            >
              {s}
            </button>
          ))}
        </div>
        {/* 內容 */}
        <div className="p-4">
          <h1 className="text-3xl text-left">
            <div>目前貨架：{shelf?.SHELVE_ID}</div>
          </h1>
        </div>
        {/* 控制欄 */}
        <div className="flex flex-wrap gap-8 py-4 overflow-y-auto">
          <div className="flex items-center">
            <span>步驟：</span>
            <select name="step" value={step || 1} className="px-3 py-2 border border-gray-300 rounded-md shadow-sm" onChange={handleChange}>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </div>

          <div className="flex items-center">
            <span>行為：</span>
            <select name="screen" value={screen || "loading"} className="px-3 py-2 border border-gray-300 rounded-md shadow-sm" onChange={handleChange}>
              <option value="loading">等待</option>
              <option value="working">執行中</option>
              <option value="idle">閒置</option>
            </select>
          </div>

          <div className="flex items-center">
            <span>WID：</span>
            <input type="text" name="waveNo" value={waveNo || ""} onChange={handleChange} className="px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
          </div>

          <div className="flex items-center">
            <span>是否鎖住：</span>
            <input type="checkbox" name="lackStation" checked={lackStation?.includes(station)} onChange={handleChange} className="px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
        </div>
        <hr className="w-full border-t border-gray-300 my-2" />
        {/* 貨架資訊 */}
        <div>
          貨架資訊：
          {shelfItem?.map((v, index) => (
            <div key={index} className="flex justify-between items-center w-full">
              <div className="flex gap-4 text-right">
                <span>調撥單號:{v?.INSTOCK_NO}</span>
                <span>產品名稱:{v?.PRT_NAME}</span>
                <span>單包數:{v?.BOX_PACK}</span>
                <span>總包數:{v?.PP_NO}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
