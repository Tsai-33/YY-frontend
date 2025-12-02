import { useDispatch, useSelector } from "react-redux";
import { managerInbound, resetInbound } from "@/redux/reducer/reducerInbound";
import ActionBtn from "../common/btns/actionBtn";
import Alert from "../common/alert/alert";

export default function InboundManager({ isOpen, onClose }) {
  const dispatch = useDispatch();

  const { currentStation } = useSelector((s) => s.workstation);
  const { orderList, step, screen, orderCode, waveNo, order, shelf, shelfItem } = useSelector((state) => state.inbound);
  const handleChange = (e, index) => {
    const name = e.target.name;
    const value = e.target.value;
    dispatch(managerInbound({ station: currentStation, name: name, value: value, index: index }));
  };

  const handleClear = () => {
    Alert({
      title: "是否確定清除？",
      showCancel: true,
      onConfirm: () => {
        dispatch(resetInbound())
      },
    });
  };

  return (
    <div id="modal" className={`${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} fixed inset-0 flex items-center justify-center bg-black/50 z-50`}>
      <div className="p-4 bg-white rounded-xl shadow-lg w-[50vw] max-h-[80vh] flex flex-col overflow-hidden">
        {/* title */}
        <div className="sticky top-0 bg-white z-10 border-b p-2">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">控制面板</h2>
            
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition-colors" onClick={onClose}>
                X
              </button>
            </div>
          </div>
        </div>
        {/* 內容 */}
        <div className="p-4">
          <h1 className="text-3xl text-left relative">
            <div>目前貨架：{shelf?.SHELVE_ID}</div>
            <div>目前站點：{shelf?.STATION}</div>
            <ActionBtn text="清空入庫" variant="rose" onClick={handleClear} className="absolute top-0 right-0 py-2"  />
          </h1>
        </div>
        <div className="flex gap-8 py-4 overflow-y-auto">
          <div className="flex items-center">
            <span>步驟：</span>
            <select name="step" value={step} className="px-3 py-2 border border-gray-300 rounded-md shadow-sm" onChange={(e) => handleChange(e)}>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </div>
          <div className="flex items-center">
            <span>行為：</span>
            <select name="screen" value={screen} className="px-3 py-2 border border-gray-300 rounded-md shadow-sm" onChange={(e) => handleChange(e)}>
              <option value="loading">等待</option>
              <option value="working">執行中</option>
              <option value="idle">閒置</option>
            </select>
          </div>
          <div className="flex items-center">
            <span>WID：</span>
            <input type="text" name="waveNo" value={waveNo} onChange={(e) => handleChange(e)} className="px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
        </div>
        <hr className="w-full border-t border-gray-300 my-2" />
        <div>
          貨架資訊：
          {shelfItem?.map((v, index) => {
            return (
              <div key={index} className="flex justify-between items-center w-full">
                <div className="flex gap-4 text-right">
                  <span>入庫單號:{v.INSTOCK_NO}</span>
                  <span>產品名稱:{v.PRT_NAME}</span>
                  <span>單包數:{v.BOX_PACK}</span>
                  <span>總包數:{v.PP_NO}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
