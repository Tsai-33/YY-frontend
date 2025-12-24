import { useDispatch, useSelector } from "react-redux";
import { managerOutboundExternal, resetOutboundExternal } from "@/redux/reducer/reducerOutboundExternal";
import ActionBtn from "../common/btns/actionBtn";
import Alert from "../common/alert/alert";

export default function OutboundExternalManager({ isOpen, onClose }) {
  const dispatch = useDispatch();

  const { stations, currentStation } = useSelector((s) => s.workstation);
  const currentStationSafe = currentStation || stations?.[0] || "B01";

  // 取全部出庫資料
  const outboundExternalState = useSelector((state) => state.outboundExternal);
  const { orderList, lackStation } = outboundExternalState;
  const { step, screen, orderCode, waveNo, order, shelf, shelfItem, selected } = useSelector((state) => state.outboundExternal[currentStationSafe] || {});

  // 修改狀態
  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    dispatch(managerOutboundExternal({ station: currentStationSafe, name: name, value: value }));
  };

  // 清空當前站點
  const handleClearStation = () => {
    Alert({
      title: `是否確定清除 ${currentStationSafe}？`,
      showCancel: true,
      onConfirm: () => {
        dispatch(managerOutboundExternal({ station: currentStationSafe, name: "step", value: 1 }));
        dispatch(managerOutboundExternal({ station: currentStationSafe, name: "screen", value: "idle" }));
        dispatch(managerOutboundExternal({ station: currentStationSafe, name: "orderCode", value: "" }));
        dispatch(managerOutboundExternal({ station: currentStationSafe, name: "waveNo", value: null }));
        dispatch(managerOutboundExternal({ station: currentStationSafe, name: "order", value: {} }));
        dispatch(managerOutboundExternal({ station: currentStationSafe, name: "shelf", value: {} }));
        dispatch(managerOutboundExternal({ station: currentStationSafe, name: "shelfItem", value: [] }));
        dispatch(managerOutboundExternal({ station: currentStationSafe, name: "selected", value: [] }));
      },
    });
  };

  // 清空全部
  const handleClearAll = () => {
    Alert({
      title: "是否確定清除？",
      showCancel: true,
      onConfirm: () => {
        dispatch(resetOutboundExternal())
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
              <div>銷貨單: {orderCode || "無"}</div>
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
                <option value={1}>1 - 選擇銷貨單</option>
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
            <div className="grid grid-cols-5 gap-2">
              {stations?.map((station) => {
                const stationData = outboundExternalState[station] || {};
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

  // return (
  //   <div id="modal" className={`${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} fixed inset-0 flex items-center justify-center bg-black/50 z-50`}>
  //     <div className="p-4 bg-white rounded-xl shadow-lg w-[50vw] max-h-[80vh] flex flex-col overflow-hidden">
  //       {/* title */}
  //       <div className="sticky top-0 bg-white z-10 border-b p-2">
  //         <div className="flex justify-between items-center">
  //           <h2 className="text-2xl font-bold">控制面板</h2>
            
  //           <div className="flex items-center gap-3">
  //             <button className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition-colors" onClick={onClose}>
  //               X
  //             </button>
  //           </div>
  //         </div>
  //       </div>
  //       {/* 內容 */}
  //       <div className="p-4">
  //         <h1 className="text-3xl text-left relative">
  //           <div>目前貨架：{shelf?.SHELVE_ID}</div>
  //           <div>目前站點：{shelf?.STATION}</div>
  //           {/* <ActionBtn text="清空入庫" variant="rose" onClick={handleClear} className="absolute top-0 right-0 py-2"  /> */}
  //         </h1>
  //       </div>
  //       <div className="flex gap-8 py-4 overflow-y-auto">
  //         <div className="flex items-center">
  //           <span>步驟：</span>
  //           <select name="step" value={step} className="px-3 py-2 border border-gray-300 rounded-md shadow-sm" onChange={(e) => handleChange(e)}>
  //             <option value={1}>1</option>
  //             <option value={2}>2</option>
  //             <option value={3}>3</option>
  //             <option value={4}>4</option>
  //             <option value={5}>5</option>
  //           </select>
  //         </div>
  //         <div className="flex items-center">
  //           <span>行為：</span>
  //           <select name="screen" value={screen} className="px-3 py-2 border border-gray-300 rounded-md shadow-sm" onChange={(e) => handleChange(e)}>
  //             <option value="loading">等待</option>
  //             <option value="working">執行中</option>
  //             <option value="idle">閒置</option>
  //           </select>
  //         </div>
  //         <div className="flex items-center">
  //           <span>WID：</span>
  //           <input type="text" name="waveNo" value={waveNo} onChange={(e) => handleChange(e)} className="px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
  //         </div>
  //       </div>
  //       <hr className="w-full border-t border-gray-300 my-2" />
  //       <div>
  //         貨架資訊：
  //         {shelfItem?.map((v, index) => {
  //           return (
  //             <div key={index} className="flex justify-between items-center w-full">
  //               <div className="flex gap-4 text-right">
  //                 <span>入庫單號:{v.OUTSTOCK_NO}</span>
  //                 <span>產品名稱:{v.PRT_NAME}</span>
  //                 <span>單包數:{v.BOX_PACK}</span>
  //                 <span>總包數:{v.PP_NO}</span>
  //               </div>
  //             </div>
  //           );
  //         })}
  //       </div>
  //     </div>
  //   </div>
  // );
}
