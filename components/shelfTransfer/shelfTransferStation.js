import ActionBtn from "@/components/common/btns/actionBtn";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { 
    updateShelveData, 
    updateSelectedItems, 
    setTargetShelve,
    setShelveCheck,
    setShelfTransfer,
    resetStation 
} from "@/redux/reducer/reducerShelfTransfer";
import { updateTransferItems, sendToWMS, updateShelveCheck, transferItems } from "@/pages/api";
import { generateRandomNumber } from "@/utils/random";
import Alert from "../common/alert/alert";
import InputFrame from "../common/input/inputFrame";

export default function ShelfTransferStation() {
    const dispatch = useDispatch();
    const { stations, currentStation } = useSelector((s) => s.workstation);
    const currentStationSafe = currentStation || stations?.[0] || "";

    const {
        mode,
        orderCode,
        selectedShelves,
        shelveData,
        shelveStatus,
        targetShelve,
        selectedItems,
        shelveChecks = {}
    } = useSelector((s) => s.shelfTransfer[currentStationSafe] || {});

    // ===== 固定 5 個Table 選了幾個貨架就有幾個有值 =====
    const totalSlots = 5;
    const shelvePositions = [
        ...(selectedShelves || []), 
        ...Array(Math.max(0, totalSlots - selectedShelves.length)).fill("貨架代號")
    ];

    // =====找出選到的項目他的貨架ID=====
    const getActiveShelveId = () => {
        for (const shelveId in selectedItems) {
            if (selectedItems[shelveId] && selectedItems[shelveId].length > 0) {
                return shelveId;
            }
        }
        return null;
    };
    const activeShelveId = getActiveShelveId();

    // =====處理資料的勾選取消=====
    const handleItemChange = (shelveId, item) => {
        dispatch(updateSelectedItems({
            station: currentStationSafe,
            shelveId,
            itemId: item.id,
        }));
    };

    // =====處理下拉式選單的內容=====
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const getAvailableTargetShelves = () => {
        return shelvePositions.filter(
            shelveId => shelveId !== activeShelveId && shelveId !== "貨架代號"
        );
    };

    const handleTargetSelect = (shelveId) => {
        dispatch(setTargetShelve({
            station: currentStationSafe,
            targetShelve: shelveId,
        }));
        setIsDropdownOpen(false);
    }

    // =====按下確定後轉移項目=====
    const confirmCheck = () => {
        const hasSelectedItems = selectedItems?.[activeShelveId]?.length > 0;
        const hasTargetShelve = targetShelve !== "";
        return hasSelectedItems && hasTargetShelve;
    }

    const handleConfirm = async () => {
        if (!confirmCheck()) {
            Alert("請確認已選擇的貨架");
            return;
        }
        try {
            const selectedItemsIds = selectedItems[activeShelveId] || [];
            const sourceData = shelveData[activeShelveId] || [];

            const itemsToMove = sourceData.filter(item =>
                selectedItemsIds.includes(item.id)
            );
            
            let res;

            if (mode === "shelf") {
                // 貨架調整
                res = await transferItems({
                    items: itemsToMove,
                    sourceShelveId: activeShelveId,
                    targetShelveId: targetShelve
                });
            } else {
                // 訂單理貨
                res = await updateTransferItems({
                    items: itemsToMove,
                    targetShelveId: targetShelve
                });
            }

            if (res.data.success) {
                dispatch(updateShelveData({
                    station: currentStationSafe,
                    sourceShelve: activeShelveId,
                    targetShelve: targetShelve,
                    itemIds: selectedItemsIds,
                }));
            } else {
                Alert(res.data.message || "轉移失敗");
            }
        } catch (error) {
            console.warn("handleConfirm:", error);
        }
    };

    // ===== 處理護角/封膜/打包 checkbox =====
    const CHECK_VALUES = {
        CORNER: 1,  // 護角
        SEAL: 2,    // 封膜
        PACK: 4     // 打包
    };
    // 檢查是否打勾
    const hasCheck = (value, bit) => (value & bit) !== 0;

    const handleShelveCheck = async (shelveId, bitValue) => {
        try {
            const res = await updateShelveCheck({
                shelveId,
                bitValue
            });

            if (res.data.success) {
                dispatch(setShelveCheck({
                    station: currentStationSafe,
                    shelveId,
                    value: res.data.data.newValue
                }));
            } else {
                Alert({ text: "更新失敗" });
            }
        } catch (error) {
            console.warn("updateShelveCheck: ", error);
        }
    };

    
    // ===== 退回貨架 =====
    const handleReturnShelve = async (shelveId) => {
        if (!shelveId) {
            Alert({ html: "抓不到站點位置" });
            return;
        }

        // 找出該貨架對應的站點
        const shelveIndex = selectedShelves?.indexOf(shelveId);
        if (shelveIndex === -1) {
            Alert({ html: "找不到對應的站點" });
            return;
        }
        const stationId = `B0${shelveIndex + 1}`;
        // setLoading(true);
        try {
            const dataId = generateRandomNumber();
            const data = { 
                action: "wcstask", 
                dataid: dataId, 
                command: "RETURN", 
                SHELVE_ID: shelveId, 
                FACE: 2, 
                STATION: stationId, 
                PURPOSE: 0 
            };
            console.log('data: ', data)
            const res = await sendToWMS(data);
            if (res.data.success) {
                console.log(stationId + "退回");
            }
        } catch (err) {
            console.warn("handleReturnShelf :", err);
        } finally {
            // setLoading(false);
        }
    };

    return (
        <>
            <div className="flex flex-col h-screen p-4 bg-gray-100">
                <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-2xl font-bold">理貨工作站B01-B05</div>
                        <div className="text-2xl flex justify-center flex-1 text-black font-bold">
                            請在一個貨架編號下方選擇理貨的貨物,再選擇要移動到的目的貨架編號點擊確定按鈕
                        </div>
                    </div>
                    <div className="text-lg text-gray-600 mb-3">
                        {mode === "order" ? "訂單單號：" + orderCode : "入庫倉別：" + orderCode}
                    </div>
                    {/* 下拉選貨架、確定按鈕 */}
                    <div className="flex gap-4 justify-center">
                        {/* 下拉式選單 */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                disabled={!activeShelveId}
                                className={`px-4 py-2 rounded-lg text-base font-medium flex items-center gap-2 transition-colors ${
                                    activeShelveId
                                        ? "bg-gray-400 text-white hover:bg-gray-500"
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                            >
                                {targetShelve ? `目的貨架: ${targetShelve}` : "下拉選擇目的貨架"}
                                <span className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>
                                    ▼
                                </span>
                            </button>
                            {/* 下拉式選單內容 */}
                            {isDropdownOpen && activeShelveId && (
                                <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-50 min-w-[200px]">
                                    {getAvailableTargetShelves().map((shelveId, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleTargetSelect(shelveId)}
                                            className={`w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                                                index !== 0 ? 'border-t border-gray-200' : ''
                                            } ${
                                                targetShelve === shelveId ? 'bg-blue-50 text-blue-600 font-semibold' : ''
                                            }`}
                                        >
                                            {shelveId}
                                            {/* {targetShelve === shelveId && (
                                                <span className="ml-2">✓</span>
                                            )} */}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <ActionBtn
                            icon={"icon-check"} 
                            text={"確定"}
                            variant={"violet"}
                            onClick={handleConfirm}
                            disabled={!confirmCheck()}
                        />
                    </div>
                </div>
                {/* 貨架Table(固定五個) */}
                <div className="flex-1 flex flex-col">
                    <div className="flex gap-2 mb-3 flex-1">
                        {shelvePositions.map((shelveId, index) => {
                            // 判斷是不是空白欄位貨架
                            const isEmptySlot = shelveId === "貨架代號";

                            {/* 取貨架資料 */}
                            const isLastOne = shelveId === "貨架代號";
                            const status = !isEmptySlot ? shelveStatus?.[shelveId] : undefined;
                            const isReturned = status === "returned";
                            const data = !isEmptySlot ? (shelveData?.[shelveId] || []) : [];
                            const hasData = data.length > 0;

                            // 拿到那個貨架的陣列
                            const checkedItems = selectedItems?.[shelveId] || [];

                            // 如果不是當前的貨架就鎖起來
                            const isDisabled = activeShelveId && activeShelveId !== shelveId;

                            // 判斷這個貨架是不是被勾選的貨架
                            const isActive = activeShelveId === shelveId;

                            // 護角 / 封膜 / 打包 checkbox 判斷
                            const checkValue = shelveChecks[shelveId] || 0;

                            return (
                                <div
                                    key={index}
                                    className={`
                                        flex-1 bg-white rounded-lg shadow-md p-4 flex flex-col transition-all ${
                                            isDisabled ? 'opacity-50' : ''
                                        } ${
                                            isActive ? 'ring-4 ring-green-500' : ''
                                        } ${
                                            targetShelve === shelveId ? 'ring-4 ring-blue-500' : ''
                                        }
                                    `}
                                >
                                    {/* 貨架編號 */}
                                    <div className={`text-xl font-bold text-center mb-2 pb-2 border-b-2 border-gray-300 ${
                                        isLastOne ? 'text-gray-400' : ''
                                    } ${
                                        isActive ? 'text-green-600' : ''
                                    } ${
                                        targetShelve === shelveId ? 'text-blue-600' : ''
                                    }`}>
                                        {shelveId}
                                    </div>
                                    {isEmptySlot ? (
                                        <div className="flex-1 flex items-center justify-center text-gray-300"></div>
                                    ) : isReturned ? (
                                        <div className="flex-1 flex items-center justify-center text-gray-300">
                                            已退回
                                        </div>
                                    ) : (
                                        <>
                                            <div className={`flex-1 overflow-auto mb-3 ${
                                                isDisabled ? 'pointer-events-none' : ''
                                            }`}>
                                                {hasData ? (
                                                    <div className="space-y-1">
                                                        {data.map((item) => {
                                                            const isChecked = checkedItems.includes(item.id);
                                                            return (
                                                                <label
                                                                    key={item.id}
                                                                    className={`
                                                                        flex items-center gap-2 px-2 py-1 cursor-pointer
                                                                        border border-gray-300 rounded
                                                                        hover:bg-gray-50 transition-colors
                                                                    `}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={() => handleItemChange(shelveId, item)}
                                                                        className="w-4 h-4 "
                                                                    />
                                                                    <span className="text-xl truncate">
                                                                        {item.PRT_NO}
                                                                    </span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="flex-1 flex items-center justify-center text-gray-300 h-full">
                                                        無資料
                                                    </div>
                                                )}
                                            </div>
                                            {/* 護角 / 封膜 / 打包 checkbox */}
                                            {hasData && (
                                                <div className="flex gap-4 mb-3 justify-between">
                                                    <label className="flex items-center gap-2 cursor-pointer border rounded-md bg-gray-500 text-white">
                                                        <input 
                                                            type="checkbox"
                                                            checked={hasCheck(checkValue, CHECK_VALUES.CORNER)}
                                                            onChange={() => handleShelveCheck(shelveId, CHECK_VALUES.CORNER)}
                                                            disabled={isDisabled}
                                                            className="w-5 h-5 m-2"
                                                        />
                                                        <span className="text-2xl mx-4 my-2">護角</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer border rounded-md bg-gray-500 text-white">
                                                        <input
                                                            type="checkbox"
                                                            checked={hasCheck(checkValue, CHECK_VALUES.SEAL)}
                                                            onChange={() => handleShelveCheck(shelveId, CHECK_VALUES.SEAL)}
                                                            disabled={isDisabled}
                                                            className="w-5 h-5 m-2"
                                                        />
                                                        <span className="text-2xl mx-4 my-2">封膜</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer border rounded-md bg-gray-500 text-white">
                                                        <input
                                                            type="checkbox"
                                                            checked={hasCheck(checkValue, CHECK_VALUES.PACK)}
                                                            onChange={() => handleShelveCheck(shelveId, CHECK_VALUES.PACK)}
                                                            disabled={isDisabled}
                                                            className="w-5 h-5 m-2"
                                                        />
                                                        <span className="text-2xl mx-4 my-2">打包</span>
                                                    </label>
                                                </div>
                                            )}
                                            {/* 退回貨架 */}
                                            <ActionBtn 
                                                icon="icon-returnShelf"
                                                text={"退回貨架"}
                                                variant={"orange"}
                                                disabled={isDisabled}
                                                onClick={() => handleReturnShelve(shelveId)}
                                            />
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {/* 站點 */}                                                                                        
                    <div className="flex gap-2">
                        {shelvePositions.slice(0, 5).map((shelveId, index) => {
                            const isEmptySlot = shelveId === "貨架代號";
                            const status = shelveStatus?.[shelveId];
                            const hasData = shelveData?.[shelveId]?.length > 0;

                            return (
                                <button
                                    key={index}
                                    className={`flex-1 text-white py-3 rounded-lg text-lg font-bold transition-colors ${
                                        isEmptySlot
                                            ? "bg-green-600"                          // 空白欄位固定綠色
                                            : hasData
                                            ? "bg-blue-400 hover:bg-blue-500"       // 有資料藍色
                                            : status === "loading"
                                            ? "bg-yellow-500"                         // loading
                                            : "bg-green-600 hover:bg-green-700"     // 其他
                                    }`}
                                >
                                    站點 { index + 1 }
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    )
}