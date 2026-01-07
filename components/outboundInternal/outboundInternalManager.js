import { useDispatch, useSelector } from "react-redux";
import { manageroutboundInternal, resetoutboundInternal } from "@/redux/reducer/reduceroutboundInternal";
import ActionBtn from "../common/btns/actionBtn";
import Alert from "../common/alert/alert";

export default function outboundInternalManager({ isOpen, onClose }) {
  const dispatch = useDispatch();

  const { stations, currentStation } = useSelector((s) => s.workstation);
  const currentStationSafe = currentStation || stations?.[0] || "B01";

  // 取全部出庫資料
  const outboundInternalState = useSelector((state) => state.outboundInternal);
  const { orderList, lackStation } = outboundInternalState;
  const { step, screen, orderCode, waveNo, order, shelf, shelfItem, selected } = useSelector((state) => state.outboundInternal[currentStationSafe] || {});

  // 修改狀態
  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    dispatch(manageroutboundInternal({ station: currentStationSafe, name: name, value: value }));
  };

  // 清空當前站點
  const handleClearStation = () => {
    Alert({
      title: `是否確定清除 ${currentStationSafe}？`,
      showCancel: true,
      onConfirm: () => {
        dispatch(manageroutboundInternal({ station: currentStationSafe, name: "step", value: 1 }));
        dispatch(manageroutboundInternal({ station: currentStationSafe, name: "screen", value: "idle" }));
        dispatch(manageroutboundInternal({ station: currentStationSafe, name: "orderCode", value: "" }));
        dispatch(manageroutboundInternal({ station: currentStationSafe, name: "waveNo", value: null }));
        dispatch(manageroutboundInternal({ station: currentStationSafe, name: "order", value: {} }));
        dispatch(manageroutboundInternal({ station: currentStationSafe, name: "shelf", value: {} }));
        dispatch(manageroutboundInternal({ station: currentStationSafe, name: "shelfItem", value: [] }));
        dispatch(manageroutboundInternal({ station: currentStationSafe, name: "selected", value: [] }));
      },
    });
  };

  // 清空全部
  const handleClearAll = () => {
    Alert({
      title: "是否確定清除？",
      showCancel: true,
      onConfirm: () => {
        dispatch(resetoutboundInternal())
      },
    });
  };

  // 清除 lackStation
  const handleClearLackStation = () => {
    dispatch(updateLackStation({ type: "clear" }));
  };

  // 清除 orderList
  const handleClearOrderList = () => {
    dispatch(updateOrderList({ type: "clear" }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="p-4 bg-white rounded-xl shadow-lg w-[60vw] max-h-[80vh] flex flex-col overflow-hidden">
        {/* 標題 */}
        <div className="sticky top-0 bg-white z-10 border-b p-2">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">出庫控制面板 - {currentStationSafe}</h2>
            <button className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition-colors" onClick={onClose}>
              X
            </button>
          </div>
        </div>

        {/* 內容區 */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* 當前站點資訊 */}
          <div className="mb-4 p-3 bg-gray-100 rounded">
            <h3 className="font-bold mb-2">當前站點狀態</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>站點: {currentStationSafe}</div>
              <div>領用單: {orderCode || "無"}</div>
              <div>波次: {waveNo || "無"}</div>
              <div>貨架: {shelf?.SHELVE_ID || "無"}</div>
            </div>
          </div>

          {/* 控制項 */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span>步驟：</span>
              <select 
                name="step" 
                value={step || 1} 
                className="px-3 py-2 border rounded" 
                onChange={handleChange}
              >
                <option value={1}>1 - 選擇領用單</option>
                <option value={2}>2 - 確認資訊</option>
                <option value={3}>3 - 揀貨中</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span>畫面：</span>
              <select 
                name="screen" 
                value={screen || "idle"} 
                className="px-3 py-2 border rounded" 
                onChange={handleChange}
              >
                <option value="idle">idle (閒置)</option>
                <option value="loading">loading (等待車)</option>
                <option value="working">working (作業中)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span>波次：</span>
              <input 
                type="text" 
                name="waveNo" 
                value={waveNo || ""} 
                onChange={handleChange} 
                className="px-3 py-2 border rounded w-24" 
              />
            </div>
          </div>

          {/* 全局資料 */}
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <h3 className="font-bold mb-2">清單資料</h3>
            <div className="flex gap-4 items-center mb-2">
              <span>占用站點 (lackStation):</span>
              <span className="text-orange-600">{lackStation?.join(", ") || "無"}</span>
              <button 
                className="px-2 py-1 bg-orange-500 text-white rounded text-sm"
                onClick={handleClearLackStation}
              >
                清除
              </button>
            </div>
            <div className="flex gap-4 items-center">
              <span>已選訂單 (orderList):</span>
              <span className="text-blue-600">{orderList?.join(", ") || "無"}</span>
              <button 
                className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
                onClick={handleClearOrderList}
              >
                清除
              </button>
            </div>
          </div>

          {/* 貨架資訊 */}
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

          {/* 所有站點狀態 */}
          <div className="mb-4 p-3 bg-yellow-50 rounded">
            <h3 className="font-bold mb-2">所有站點狀態</h3>
            <div className={`grid gap-2 ${stations?.length === 4 ? 'grid-cols-4' : stations?.length === 5 ? 'grid-cols-5' : 'grid-cols-5'}`}>
              {stations?.map((station) => {
                const stationData = outboundInternalState[station] || {};
                return (
                  <div 
                    key={station} 
                    className={`p-2 rounded text-center text-sm ${
                      station === currentStationSafe ? "bg-blue-200" : "bg-white"
                    }`}
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

        {/* 底部按鈕 */}
        <div className="border-t p-4 flex justify-end gap-4">
          <ActionBtn 
            text={`清空 ${currentStationSafe}`} 
            variant="orange" 
            onClick={handleClearStation} 
          />
          <ActionBtn 
            text="清空全部" 
            variant="rose" 
            onClick={handleClearAll} 
          />
        </div>
      </div>
    </div>
  );
}
