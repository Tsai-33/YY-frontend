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
    // 選中的時候
    const [selectedItems, setSelectedItems] = useState({});
    const headers = [
        { label: "項目編號", key: "id", width: "100%" }
    ]
    const shelvePositions = ["R0002", "R0003", "R0004", "R0005", "貨架代號"]
    const shelveData = {
        "R0002": [
            { id: "M510-11403200013-0001", selected: false }
        ],
        "R0003": [
            { id: "M510-11403200017-0012", selected: false },
            { id: "M510-11403200017-0013", selected: false },
            { id: "M510-11403200017-0014", selected: false },
            { id: "M510-11403200017-0015", selected: false },
            { id: "M510-11403200017-0016", selected: false },
            { id: "M510-11403200017-0017", selected: false },
            { id: "M510-11403200017-0018", selected: false },
            { id: "M510-11403200017-0019", selected: false },
            { id: "M510-11403200017-0020", selected: false }
        ],
        "R0004": [
            { id: "M510-11403200020-0001", selected: false }
        ],
        "R0005": [
            { id: "M510-11403200041-0001", selected: false },
            { id: "M510-11403200041-0002", selected: false },
            { id: "M510-11403200041-0003", selected: false },
            { id: "M510-11403200041-0004", selected: false },
            { id: "M510-11403200041-0005", selected: false },
            { id: "M510-11403200041-0006", selected: false },
            { id: "M510-11403200041-0007", selected: false },
            { id: "M510-11403200041-0008", selected: false },
            { id: "M510-11403200041-0009", selected: false }
        ]
        // "貨架代號" 沒有資料
    };

    return (
        <>
            <div className="flex flex-col h-screen p-4 bg-gray-100">
                <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-2xl font-bold">{workStation}</div>
                        <div className="text-xl">
                            請在一個貨架編號下方選擇理貨的貨物,再選擇要移動到的目的貨架編號點擊確定按鈕
                        </div>
                    </div>
                    <div className="text-lg text-gray-600 mb-3">
                        訂單單號：{orderNumber}
                    </div>
                    {/* 下拉選貨架、確定按鈕 */}
                    <div className="flex gap-4">
                        <button 
                            // onClick={handlePullDown}
                            className="bg-gray-400 text-white px-6 py-3 rounded-lg text-lg font-medium flex items-center gap-2 hover:bg-gray-500 transition-colors"
                        >
                            下拉選擇目的貨架
                            <span>V</span>
                        </button>
                        <ActionBtn
                            icon={"icon-check"} 
                            text={"確定"}
                            variant={"violet"}
                            onClick={""}
                            disabled={false}
                        />
                    </div>
                </div>
                {/* 貨架Table(固定五個) */}
                <div className="flex-1 flex flex-col">
                    <div className="flex gap-4 mb-4 flex-1">
                        {shelvePositions.map((shelveId, index) => {
                            {/* 取貨架資料 */}
                            const data = shelveData[shelveId] || [];
                            const hasData = data.length > 0;
                            const isLastOne = shelveId === "貨架代號";

                            return (
                                <div
                                    key={index}
                                    className="flex-1 bg-white rounded-lg shadow-md p-4 flex flex-col"
                                >
                                    {/* 貨架編號 */}
                                    <div className={`text-2xl font-bold text-center mb-3 pb-3 border-b-2 border-gray-300 ${
                                        isLastOne ? 'text-gray-400' : ''
                                    }`}>
                                        {shelveId}
                                    </div>
                                    {hasData ? (
                                        <>
                                            <div className="flex-1 overflow-hidden mb-4">
                                                <Table 
                                                    variant="green"
                                                    type="checkbox"
                                                    name={`shelve-${shelveId}`}
                                                    data={data}
                                                    needInput={true}
                                                    idKey="id"
                                                    height="100%"
                                                    checked={selectedItems}
                                                    // onChange={(item) => handleItemChange(shelveId, item)}
                                                />
                                            </div>
                                            {/* 退回貨架 */}
                                            <ActionBtn 
                                                icon="icon-returnShelf"
                                                text={"退回貨架"}
                                                variant={"orange"}
                                                disabled={false}
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
                        <button className="flex-1 bg-blue-400 text-white py-4 rounded-lg text-xl font-bold hover:bg-blue-500 transition-colors">
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
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}