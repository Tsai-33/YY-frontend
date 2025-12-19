import { useDispatch, useSelector } from "react-redux";
import { managerInbound, resetInbound,  updateOrderList } from "@/redux/reducer/reducerInbound";

import Alert from "../common/alert/alert";
import { useEffect, useState } from "react";
import { getTable } from "./inboundFunction";

export default function InboundManager({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const { stations, currentStation } = useSelector((s) => s.workstation);

  // UI local state
  const [station, setStation] = useState("A01");

  // 全部 inbound 資料
  const inbound = useSelector((state) => state.inbound);
  const { orderList, lackStation } = useSelector((state) => state.inbound);

  // 依照選擇站台拿資料
  const stationData = inbound[station] || {};
  const { step, screen, waveNo, shelf, shelfItem } = stationData;

  // 更改站台資料
  const handleChange = (e, index) => {
    
    dispatch(
      managerInbound({
        station,
        name: e.target.name,
        value: e.target.value,
        checked: e.target.checked,
        index,
      })
    );
  };

  // 清除當前 station 的資料
  const handleClear = (type, station) => {
    Alert({
      title: "是否確定清除？",
      showCancel: true,
      onConfirm: () => {
        dispatch(resetInbound({ type: type, station: station }));
      },
    });
  };

  const [o, setO] = useState(null);
  const handleOrder = (type) => {
    dispatch(updateOrderList({ type: type, order: o }));
  };

  const [allOrderList, setAllOrderList] = useState([]);
  useEffect(() => {
    getTable(setAllOrderList);
  }, []);

  return (
    <div id="modal" className={`${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} fixed inset-0 flex items-center justify-center bg-black/50 z-50`}>
      <div className="p-4 bg-white rounded-xl shadow-lg w-[50vw] max-h-[80vh] flex flex-col overflow-hidden">
        {/* title */}
        <div className="sticky top-0 bg-white z-10 border-b p-2">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">控制面板</h2>

            <button onClick={() => handleClear("one", currentStation)} className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-gray-500 text-white">
              清空入庫
            </button>
            <button onClick={() => handleClear("all", stations)} className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-gray-500 text-white">
              清空所有入庫
            </button>

            <button className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition-colors" onClick={onClose}>
              X
            </button>
          </div>
        </div>

        {/* 站點按鈕 */}
        <div className="flex gap-8 py-4 overflow-x-auto">
          <div className="flex items-center gap-2 relative">
            {stations.map((s) => (
              <button
                key={s}
                onClick={() => setStation(s)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition 
                ${station === s ? "bg-green-500 text-white" : "bg-gray-300 text-gray-800"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          {/* 站點顏色 */}
          {/* <div className="flex flex-col gap-4 py-4 w-1/2">
            <div className="text-lg font-bold flex items-center">
              <div>忙線站點：</div>
              <div className="flex">
                <select name="station" value={s || "A01"} className="px-4 py-1 border border-gray-300 rounded-md shadow-sm" onChange={(e) => setS(e.target.value)}>
                  {stations.map((v) => (
                    <option value={v}>{v}</option>
                  ))}
                </select>
                <button onClick={() => handleStation("add")} className="bg-blue-500 text-white px-4 py-1 rounded">
                  新增
                </button>
              </div>
              <div>
                <button onClick={() => handleStation("clear")} className="bg-red-500 text-white px-4 py-1 rounded">
                  全除
                </button>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {lackStation
                ? lackStation.map((v, idx) => (
                    <div key={idx} className="px-3 py-1 bg-gray-200 rounded-full flex gap-2 items-center">
                      <span>{v}</span>
                      <button onClick={() => handleStation("sub")} className="text-red-500 font-bold">
                        ✕
                      </button>
                    </div>
                  ))
                : ""}
            </div>
          </div> */}

          {/* 排除訂單 */}
          <div className="flex flex-col gap-4 py-4">
            <div className="text-lg font-bold flex items-center">
              <div>排除訂單：</div>
              <div className="flex">
                <select name="station" value={o || ""} className="px-4 py-1 border border-gray-300 rounded-md shadow-sm" onChange={(e) => setO(e.target.value)}>
                  {allOrderList.map((v, i) => (
                    <option key={i} value={v.INSTOCK_NO}>
                      {v.INSTOCK_NO}
                    </option>
                  ))}
                </select>
                <button onClick={() => handleOrder("add")} className="bg-blue-500 text-white px-4 py-1 rounded">
                  新增
                </button>
              </div>
              <div>
                <button onClick={() => handleOrder("clear")} className="bg-red-500 text-white px-4 py-1 rounded">
                  全除
                </button>
              </div>
            </div>
            <span className="text-sm text-black">*排除後要重新整理</span>
            <div className="flex gap-2 flex-wrap">
              {orderList
                ? orderList.map((v, idx) => (
                    <div key={idx} className="px-3 py-1 bg-gray-200 rounded-full flex gap-2 items-center">
                      <span>{v}</span>
                      <button onClick={() => handleOrder("sub")} className="text-red-500 font-bold">
                        ✕
                      </button>
                    </div>
                  ))
                : ""}
            </div>
          </div>
        </div>
        <hr className="w-full border-t border-gray-300 my-2" />

        {/* 內容 */}
        <div className="p-4">
          <h1 className="text-3xl text-left">
            <div>目前貨架：{shelf?.SHELVE_ID}</div>
          </h1>
        </div>
        {/* 控制欄 */}
        <div className="flex gap-8 py-4 overflow-y-auto">
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
                <span>入庫單號:{v?.INSTOCK_NO}</span>
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
