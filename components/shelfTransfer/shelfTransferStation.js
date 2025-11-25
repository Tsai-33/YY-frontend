import Table from "@/components/common/table/table";
import ActionBtn from "@/components/common/btns/actionBtn";
import InputFrame from "@/components/common/input/inputFrame";
import PageTitle from "@/components/common/pageTitle";
import { testShelveGroups } from "./testData";
import Link from "next/link";
import { useState } from "react";

export default function ShelfTransferStation() {
    const [orderNumber] = useState("D200-11403030002");
    const [workStation] = useState("理貨工作站B01-B05");
    // 選中的項目
    const [selectedItems, setSelectedItems] = useState({}); 
    // 目的貨架
    const [targetShelve, setTargetShelve] = useState("");
    // 控制下拉選單
    const headers = [
        { label: "項目編號", key: "id", width: "100%" }
    ]
    const shelvePositions = ["R0002", "R0003", "R0004", "R0005", "貨架代號"]
    const [shelveData, setShelveData] = useState({
        "R0002": [
            { id: "M510-11403200013-0001" }
        ],
        "R0003": [
            { id: "M510-11403200017-0012" },
            { id: "M510-11403200017-0013" },
            { id: "M510-11403200017-0014" },
            { id: "M510-11403200017-0015" },
            { id: "M510-11403200017-0016" },
            { id: "M510-11403200017-0017" },
            { id: "M510-11403200017-0018" },
            { id: "M510-11403200017-0019" },
            { id: "M510-11403200017-0020" }
        ],
        "R0004": [
            { id: "M510-11403200020-0001" }
        ],
        "R0005": [
            { id: "M510-11403200041-0001" },
            { id: "M510-11403200041-0002" },
            { id: "M510-11403200041-0003" },
            { id: "M510-11403200041-0004" },
            { id: "M510-11403200041-0005" },
            { id: "M510-11403200041-0006" },
            { id: "M510-11403200041-0007" },
            { id: "M510-11403200041-0008" },
            { id: "M510-11403200041-0009" }
        ]
        // "貨架代號" 沒有資料
    });

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
        setSelectedItems(prev => {
            // 取那個貨架目前選到的項目
            const currentSelected = prev[shelveId] || [];
            const itemId = item.id;

            // 檢查有沒有選中
            const isSelected = currentSelected.includes(itemId);

            // 如果原本是選中的就移除
            if (isSelected) {
                return {
                    ...prev,
                    [shelveId]: currentSelected.filter(id => id !== itemId)
                };
            } else {
                return {
                    ...prev,
                    [shelveId]: [...currentSelected, itemId]
                };
            }
        });
    };

    // =====處理下拉式選單的內容=====
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const getAvailableTargetShelves = () => {
        return shelvePositions.filter(
            shelveId => shelveId !== activeShelveId && shelveId !== "貨架代號"
        );
    };

    const handleTargetSelect = (shelveId) => {
        setTargetShelve(shelveId);
        setIsDropdownOpen(false);
    }

    // =====按下確定後轉移項目=====
    const confirmCheck = () => {
        const hasSelectedItems = selectedItems[activeShelveId]?.length > 0;
        const hasTargetShelve = targetShelve !== "";
        return hasSelectedItems && hasTargetShelve;
    }

    const handleConfirm = () => {
        if (!confirmCheck()) {
            alert("請確認已選擇的貨架");
            return;
        }

        // 來源貨架的ID
        const selectedItemIds = selectedItems[activeShelveId] || [];

        // 要移動的項目
        const itemsToMove = shelveData[activeShelveId].filter(
            item => selectedItemIds.includes(item.id)
        );

        // 更新貨架資料
        setShelveData(prev => {
            // 來源貨架要移除的項目
            const sourceShelveItems = prev[activeShelveId].filter(
                item => !selectedItemIds.includes(item.id)
            );

            // 把項目入到目的貨架
            const targetShelveItems = [...(prev[targetShelve] || []), ...itemsToMove];

            return {
                ...prev,
                [activeShelveId]: sourceShelveItems,
                [targetShelve]: targetShelveItems
            }
        });

        setSelectedItems({});
        setTargetShelve("");
    };

    return (
        <>
            <div className="flex flex-col h-screen p-4 bg-gray-100">
                <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-2xl font-bold">{workStation}</div>
                        <div className="text-2xl flex justify-center flex-1 text-black font-bold">
                            請在一個貨架編號下方選擇理貨的貨物,再選擇要移動到的目的貨架編號點擊確定按鈕
                        </div>
                    </div>
                    <div className="text-lg text-gray-600 mb-3">
                        訂單單號：{orderNumber}
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
                            {/* 取貨架資料 */}
                            const data = shelveData[shelveId] || [];
                            const hasData = data.length > 0;
                            const isLastOne = shelveId === "貨架代號";

                            // 拿到那個貨架的陣列
                            const checkedItems = selectedItems[shelveId] || [];

                            // 如果不是當前的貨架就鎖起來
                            const isDisabled = activeShelveId && activeShelveId !== shelveId;

                            // 判斷這個貨架是不是被勾選的貨架
                            const isActive = activeShelveId === shelveId;

                            return (
                                <div
                                    key={index}
                                    // className="flex-1 bg-white rounded-lg shadow-md p-4 flex flex-col"
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
                                    {hasData ? (
                                        <>
                                            <div className={`flex-1 overflow-hidden mb-3 ${
                                                isDisabled ? 'pointer-events-none' : ''
                                            }`}>
                                                <Table 
                                                    variant="green"
                                                    type="checkbox"
                                                    name={`shelve-${shelveId}`}
                                                    headers={headers}
                                                    data={data}
                                                    needInput={true}
                                                    idKey="id"
                                                    height="100%"
                                                    checked={checkedItems}
                                                    onChange={(item) => handleItemChange(shelveId, item)}
                                                />
                                            </div>
                                            {/* 退回貨架 */}
                                            <ActionBtn 
                                                icon="icon-returnShelf"
                                                text={"退回貨架"}
                                                variant={"orange"}
                                                disabled={isDisabled}
                                            />
                                        </>
                                    ) : (
                                        // {/* 沒有資料時 */}
                                        <div className="flex-1 flex items-center justify-center text-gray-300">
                                            {isLastOne ? "" : "無資料"}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {/* 站點 */}                                                                                        
                    <div className="flex gap-2">
                        {shelvePositions.slice(0, 5).map((shelveId, index) => {
                            const hasData = shelveData[shelveId] && shelveData[shelveId].length > 0;

                            return (
                                <button
                                    key={index}
                                    className={`flex-1 text-white py-3 rounded-lg text-lg font-bold transition-colors ${
                                        hasData
                                            ? "bg-blue-400 hover:bg-blue-500"
                                            : "bg-green-600 hover:bg-green-700"
                                    }`}
                                >
                                    站點 { index + 1 }
                                </button>
                            );
                        })}
                        {/* <button className="flex-1 bg-blue-400 text-white py-4 rounded-lg text-xl font-bold hover:bg-blue-500 transition-colors">
                            站點 1
                        </button>
                        <button className="flex-1 bg-blue-400 text-white py-4 rounded-lg text-xl font-bold hover:bg-blue-500 transition-colors">
                            站點 2
                        </button>
                        <button className="flex-1 bg-blue-400 text-white py-4 rounded-lg text-xl font-bold hover:bg-blue-500 transition-colors">
                            站點 3
                        </button>
                        <button className="flex-1 bg-blue-400 text-white py-4 rounded-lg text-xl font-bold hover:bg-blue-500 transition-colors">
                            站點 4
                        </button>
                        <button className="flex-1 bg-green-600 text-white py-4 rounded-lg text-xl font-bold hover:bg-green-700 transition-colors">
                            站點 5
                        </button> */}
                    </div>
                </div>
            </div>
        </>
    )
}