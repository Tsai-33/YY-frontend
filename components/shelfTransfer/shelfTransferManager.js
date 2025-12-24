import { useDispatch, useSelector } from "react-redux";
import { 
    managerShelfTransfer, 
    resetShelfTransfer, 
    resetStation,
    updateLackStation,
    updateOrderList 
} from "@/redux/reducer/reducerShelfTransfer";
import ActionBtn from "../common/btns/actionBtn";
import Alert from "../common/alert/alert";

export default function ShelfTransferManager({ isOpen, onClose }) {
    const dispatch = useDispatch();
    const { stations, currentStation } = useSelector((s) => s.workstation);
    const currentStationSafe = currentStation || stations?.[0];

    // 拿全部理貨資料
    const shelfTransferState = useSelector((state) => state.shelfTransfer);
    const { orderList, lackStation } = shelfTransferState;    
    const { 
        step, 
        screen, 
        mode,
        orderCode, 
        waveNo, 
        selectedShelves,
        shelveData,
        shelveStatus,
        targetShelve,
        selectedItems,
        shelveChecks
    } = useSelector((state) => state.shelfTransfer[currentStationSafe] || {});

    // 更新狀態
    const handleChange = (e) => {
        const name = e.target.name;
        const value = e.target.value;
        dispatch(managerShelfTransfer({ station: currentStationSafe, name, value }));
    };

    // 清空當前站點
    const handleClearStation = () => {
        Alert({
            title: `是否確定清除 ${currentStationSafe}？`,
            showCancel: true,
            onConfirm: () => {
                dispatch(resetStation({ station: currentStationSafe }));
            },
        });
    };

    // 清空全部
    const handleClearAll = () => {
        Alert({
            title: "是否確定清除全部？",
            showCancel: true,
            onConfirm: () => {
                dispatch(resetShelfTransfer());
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
            <div className="p-4 bg-white rounded-xl shadow-lg w-[70vw] max-h-[85vh] flex flex-col overflow-hidden">
                <div className="sticky top-0 bg-white z-10 border-b p-2">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">理貨控制面板</h2>
                        <button 
                            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition-colors" 
                            onClick={onClose}
                        >
                            X
                        </button>
                    </div>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    <div className="mb-4 p-3 bg-gray-100 rounded">
                        <h3 className="font-bold mb-2">當前站點狀態</h3>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                            {/* <div>站點: {currentStationSafe}</div> */}
                            <div>模式: {mode === "order" ? "訂單理貨" : mode === "shelf" ? "貨架調整" : "無"}</div>
                            <div>訂單/庫別: {orderCode || "無"}</div>
                            <div>波次: {waveNo || "無"}</div>
                            <div>目的貨架: {targetShelve || "無"}</div>
                            <div>選中貨架數: {selectedShelves?.length || 0}</div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mb-4">
                        <div className="flex items-center gap-2">
                            <span>步驟：</span>
                            <select 
                                name="step" 
                                value={step || 1} 
                                className="px-3 py-2 border rounded" 
                                onChange={handleChange}
                            >
                                <option value={1}>1 - 選擇訂單/貨架</option>
                                <option value={2}>2 - 選擇目標貨架</option>
                                <option value={3}>3 - 理貨中</option>
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
                            <span>模式：</span>
                            <select 
                                name="mode" 
                                value={mode || ""} 
                                className="px-3 py-2 border rounded" 
                                onChange={handleChange}
                            >
                                <option value="">無</option>
                                <option value="order">order (訂單理貨)</option>
                                <option value="shelf">shelf (貨架調整)</option>
                            </select>
                        </div>
                    </div>

                    {/* <div className="mb-4 p-3 bg-blue-50 rounded">
                        <h3 className="font-bold mb-2">全局資料</h3>
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
                    </div> */}

                    {/* 選中的貨架 */}
                    {/* <div className="mb-4 p-3 bg-green-50 rounded">
                        <h3 className="font-bold mb-2">選中的貨架 (selectedShelves)</h3>
                        {selectedShelves?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {selectedShelves.map((shelveId, index) => (
                                    <span 
                                        key={index} 
                                        className={`px-3 py-1 rounded text-white ${
                                            shelveStatus?.[shelveId] === "ready" 
                                                ? "bg-green-500" 
                                                : shelveStatus?.[shelveId] === "returned"
                                                ? "bg-gray-400"
                                                : "bg-yellow-500"
                                        }`}
                                    >
                                        {shelveId} ({shelveStatus?.[shelveId] || "loading"})
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="text-gray-500">無選中貨架</div>
                        )}
                    </div> */}

                    {/* 貨架資料 */}
                    <div className="mb-4 p-3 rounded">
                        <h3 className="font-bold mb-2">貨架資料 (shelveData)</h3>
                        {Object.keys(shelveData || {}).length > 0 ? (
                            <div className="space-y-3">
                                {Object.entries(shelveData).map(([shelveId, items]) => (
                                    <div key={shelveId} className="bg-white p-2 rounded border">
                                        <div className="font-bold mb-1">
                                            {shelveId} - {items?.length || 0} 項
                                            {shelveChecks?.[shelveId] !== undefined && (
                                                <span className="ml-2 text-sm text-gray-500">
                                                    (SEAL: {shelveChecks[shelveId]})
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-1 text-sm">
                                            {items?.map((item, idx) => (
                                                <div key={idx} className="bg-gray-50 p-1 rounded">
                                                    {item.PRT_NO} - {item.PRT_NAME?.substring(0, 15)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-gray-500">無資料</div>
                        )}
                    </div>

                    {/* 選中的項目 */}
                    <div className="mb-4 p-3 rounded">
                        <h3 className="font-bold mb-2">選中的項目 (selectedItems)</h3>
                        {Object.keys(selectedItems || {}).length > 0 ? (
                            <div className="space-y-2">
                                {Object.entries(selectedItems).map(([shelveId, itemIds]) => (
                                    itemIds?.length > 0 && (
                                        <div key={shelveId} className="bg-white p-2 rounded">
                                            <span className="font-bold">{shelveId}:</span>
                                            <span className="ml-2">{itemIds.join(", ")}</span>
                                        </div>
                                    )
                                ))}
                            </div>
                        ) : (
                            <div className="text-gray-500">無選中項目</div>
                        )}
                    </div>

                    {/* 所有站點狀態 */}
                    {/* <div className="mb-4 p-3 bg-cyan-50 rounded">
                        <h3 className="font-bold mb-2">所有站點狀態</h3>
                        <div className="grid grid-cols-5 gap-2">
                            {stations?.map((station) => {
                                const stationData = shelfTransferState[station] || {};
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
                                        <div>Mode: {stationData.mode || "-"}</div>
                                        <div className="text-xs">
                                            貨架: {stationData.selectedShelves?.length || 0}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div> */}
                </div>

                <div className="border-t p-4 flex justify-end gap-4">
                    {/* <ActionBtn 
                        text={`清空 ${currentStationSafe}`} 
                        variant="orange" 
                        onClick={handleClearStation} 
                    /> */}
                    <ActionBtn 
                        text="清空全部" 
                        variant="rose" 
                        onClick={handleClearAll} 
                    />
                </div>
            </div>
        </div>
    )
}