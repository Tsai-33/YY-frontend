import { useDispatch, useSelector } from "react-redux";
import { managerOutboundInternalNew, resetOutboundInternalNew, updateLackStation, updateOrderList } from "@/redux/reducer/reducerOutboundInternalNew";
import ActionBtn from "../common/btns/actionBtn";
import Alert from "../common/alert/alert";

export default function OutboundInternalNewManager({ isOpen, onClose }) {
  const dispatch = useDispatch();

  const { stations, currentStation } = useSelector((s) => s.workstation);
  const currentStationSafe = currentStation || stations?.[0] || "B01";

  const outboundInternalNewState = useSelector((state) => state.outboundInternalNew);
  const { orderList, lackStation } = outboundInternalNewState;
  const { step, screen, orderCode, waveNo, order, shelf, shelfItem, selected, selectedShelves } = useSelector((state) => state.outboundInternalNew[currentStationSafe] || {});

  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    dispatch(managerOutboundInternalNew({ station: currentStationSafe, name: name, value: value }));
  };

  const handleClearStation = () => {
    Alert({
      title: `是否確定清除 ${currentStationSafe}？`,
      showCancel: true,
      onConfirm: () => {
        dispatch(managerOutboundInternalNew({ station: currentStationSafe, name: "step", value: 1 }));
        dispatch(managerOutboundInternalNew({ station: currentStationSafe, name: "screen", value: "idle" }));
        dispatch(managerOutboundInternalNew({ station: currentStationSafe, name: "orderCode", value: "" }));
        dispatch(managerOutboundInternalNew({ station: currentStationSafe, name: "waveNo", value: null }));
        dispatch(managerOutboundInternalNew({ station: currentStationSafe, name: "order", value: {} }));
        dispatch(managerOutboundInternalNew({ station: currentStationSafe, name: "shelf", value: {} }));
        dispatch(managerOutboundInternalNew({ station: currentStationSafe, name: "shelfItem", value: [] }));
        dispatch(managerOutboundInternalNew({ station: currentStationSafe, name: "selected", value: [] }));
        dispatch(managerOutboundInternalNew({ station: currentStationSafe, name: "selectedShelves", value: [] }));
      },
    });
  };

  const handleClearAll = () => {
    Alert({
      title: "是否確定清除？",
      showCancel: true,
      onConfirm: () => {
        dispatch(resetOutboundInternalNew());
      },
    });
  };

  const handleClearLackStation = () => {
    dispatch(updateLackStation({ type: "clear" }));
  };

  const handleClearOrderList = () => {
    dispatch(updateOrderList({ type: "clear" }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="p-4 bg-white rounded-xl shadow-lg w-[60vw] max-h-[80vh] flex flex-col overflow-hidden">
        <div className="sticky top-0 bg-white z-10 border-b p-2">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">領用出庫控制面板(New) - {currentStationSafe}</h2>
            <button className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition-colors" onClick={onClose}>
              X
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div className="mb-4 p-3 bg-gray-100 rounded">
            <h3 className="font-bold mb-2">當前站點狀態</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>站點: {currentStationSafe}</div>
              <div>領用單: {orderCode || "無"}</div>
              <div>波次: {waveNo || "無"}</div>
              <div>貨架: {shelf?.SHELVE_ID || "無"}</div>
              <div>已選貨架: {(selectedShelves || []).map(s => s.SHELVE_ID).join(", ") || "無"}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span>步驟：</span>
              <select name="step" value={step || 1} className="px-3 py-2 border rounded" onChange={handleChange}>
                <option value={1}>1 - 選擇領用單</option>
                <option value={2}>2 - 選擇貨架</option>
                <option value={3}>3 - 揀貨中</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span>畫面：</span>
              <select name="screen" value={screen || "idle"} className="px-3 py-2 border rounded" onChange={handleChange}>
                <option value="idle">idle (閒置)</option>
                <option value="loading">loading (等待車)</option>
                <option value="working">working (作業中)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span>波次：</span>
              <input type="text" name="waveNo" value={waveNo || ""} onChange={handleChange} className="px-3 py-2 border rounded w-24" />
            </div>
          </div>

          <div className="mb-4 p-3 bg-blue-50 rounded">
            <h3 className="font-bold mb-2">清單資料</h3>
            <div className="flex gap-4 items-center mb-2">
              <span>占用站點 (lackStation):</span>
              <span className="text-orange-600">{lackStation?.join(", ") || "無"}</span>
              <button className="px-2 py-1 bg-orange-500 text-white rounded text-sm" onClick={handleClearLackStation}>
                清除
              </button>
            </div>
            <div className="flex gap-4 items-center">
              <span>已選訂單 (orderList):</span>
              <span className="text-blue-600">{orderList?.join(", ") || "無"}</span>
              <button className="px-2 py-1 bg-blue-500 text-white rounded text-sm" onClick={handleClearOrderList}>
                清除
              </button>
            </div>
          </div>

          <div className="mb-4 p-3 bg-green-50 rounded">
            <h3 className="font-bold mb-2">貨架產品 (shelfItem)</h3>
            {shelfItem?.length > 0 ? (
              <div className="space-y-2">
                {shelfItem.map((v, index) => (
                  <div key={index} className="flex gap-4 text-sm bg-white p-2 rounded">
                    <span>品號: {v.PRT_NO}</span>
                    <span>品名: {v.PRT_NAME}</span>
                    <span>箱數: {v.BOX_NO}</span>
                    <span>包數: {v.PP_NO}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">無資料</div>
            )}
          </div>

          <div className="mb-4 p-3 bg-yellow-50 rounded">
            <h3 className="font-bold mb-2">所有站點狀態</h3>
            <div className={`grid gap-2 ${stations?.length === 4 ? "grid-cols-4" : stations?.length === 5 ? "grid-cols-5" : "grid-cols-5"}`}>
              {stations?.map((station) => {
                const stationData = outboundInternalNewState[station] || {};
                return (
                  <div
                    key={station}
                    className={`p-2 rounded text-center text-sm ${station === currentStationSafe ? "bg-blue-200" : "bg-white"}`}
                  >
                    <div className="font-bold">{station}</div>
                    <div>Step: {stationData.step || 1}</div>
                    <div>Screen: {stationData.screen || "idle"}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t p-4 flex justify-end gap-4">
          <ActionBtn text={`清空 ${currentStationSafe}`} variant="orange" onClick={handleClearStation} />
          <ActionBtn text="清空全部" variant="rose" onClick={handleClearAll} />
        </div>
      </div>
    </div>
  );
}
