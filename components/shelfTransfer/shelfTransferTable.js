import Table from "@/components/common/table/table";
import ActionBtn from "@/components/common/btns/actionBtn";
import InputFrame from "@/components/common/input/inputFrame";
import PageTitle from "@/components/common/pageHeader/pageTitle";
import { testTable, testShelve } from "./testData";
import Link from "next/link";
import { useState } from "react";

export default function ShelfTransferTable() {
    const headers = [
        { label: "", key: "checkbox", width: "10%" },
        { label: "訂單單號", key: "orderNumber", width: "50%" },
        { label: "配置貨架數量", key: "deploy", width: "30%" },
        { label: "箱數", key: "box", width: "10%" },
    ];

    // =====過濾Table選中的資料=====
    const [selectedOrder, setSelectedOrder] = useState(null);
    const selectedShelveData = selectedOrder
        ? testShelve.filter(item => item.orderNumber === selectedOrder.orderNumber)
        : [];
    const handleRowClick = (row) => {
        setSelectedOrder(row);
        setOrderInput(row.orderNumber);
        setSelectedShelve([]);
    }

    // =====處理訂單單號Input=====
    const [orderInput, setOrderInput] = useState("");
    const handleInputChange = (e) => {
        const value = e.target.value;
        setOrderInput(value);
        // 匹配
        const matchOrder = testTable.find(
            item => item.orderNumber === value
        );

        if (matchOrder) {
            setSelectedOrder(matchOrder);
        } else {
            setSelectedOrder(null);
        }
    }

    // =====處理右側貨架點擊=====
    const [selectedShelve, setSelectedShelve] = useState([]);
    const handleShelveClick = (shelve) => {
        setSelectedShelve(prev => {
            const isAlreadySelected = prev.some(s => s.shelve_Id === shelve.shelve_Id);
            // 選中->移除
            if (isAlreadySelected) {
                return prev.filter(s => s.shelve_Id !== shelve.shelve_Id);
            }
            // 未選->加入
            else {
                return [...prev, shelve];
            }
        })
    }
    // 檢查是否可以按確定(至少2個最多5個)
    const canConfirm = selectedShelve.length >= 2 && selectedShelve.length <= 5;
    

    return (
        <>
            <div className="flex flex-col h-screen p-4">
                {/* 標題 */}
                <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl font-bold">理貨</div>
                    <PageTitle title="請輸入訂單單號"/>
                    <Link href="/workspace">
                        <ActionBtn icon="icon-goback" text="返回" variant="darkBlue" />
                    </Link>
                </div>
                {/* input */}
                <div className="flex gap-2 flex-1 mb-1">
                    {/* Table */}
                    <div className="w-1/2">
                        <Table 
                            variant="green"
                            type="checkbox"
                            name="shelfTransferList"
                            headers={headers}
                            data={testTable}
                            needInput={true}
                            idKey="orderNumber"
                            height="76vh"
                            checked={selectedOrder}
                            onChange={handleRowClick}
                        />
                    </div>
                    {/* 右邊畫面 */}
                    <div className="w-1/2 flex flex-col h-[70vh]">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <label className="text-lg font-medium whitespace-nowrap">
                                    訂單單號：
                                </label>
                                <InputFrame 
                                    type="text"
                                    name="orderNo"
                                    className="border-2 rounded px-4 py-2 w-[400px]"
                                    value={orderInput}
                                    onChange={handleInputChange}
                                    placeholder="請輸入訂單單號"
                                />
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6 flex flex-col h-[70vh]">
                            {selectedOrder && selectedShelveData.length > 0 ? (
                                <>
                                    <div className="flex-1 overflow-auto space-y-6 mb-6">
                                        {console.log('selectedShelveData: ', selectedShelveData)}
                                        {selectedShelveData.map((shelve, index) => {
                                            const isSelected = selectedShelve.some(s => s.shelve_Id === shelve.shelve_Id);
                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => handleShelveClick(shelve)}
                                                    className={`
                                                        w-full bg-[#DCB692] rounded-lg p-6 shadow-md 
                                                        relative transition-all
                                                        ${isSelected 
                                                            ? 'ring-4 ring-green-500 ring-offset-4' 
                                                            : 'hover:shadow-lg'
                                                        }
                                                    `}
                                                >
                                                    {/* 貨架、庫別 */}
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-2xl font-bold">
                                                                貨架編號：{shelve.shelve_Id}
                                                            </div>
                                                            {/* 打勾 */}
                                                            {isSelected && (
                                                                <div className="bg-green-500 rounded-full w-8 h-8 flex items-center justify-center">
                                                                    <svg 
                                                                        className="w-5 h-5 text-white" 
                                                                        fill="none" 
                                                                        stroke="currentColor" 
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path 
                                                                            strokeLinecap="round" 
                                                                            strokeLinejoin="round" 
                                                                            strokeWidth={3} 
                                                                            d="M5 13l4 4L19 7" 
                                                                        />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-2xl font-bold">
                                                            入庫庫別：{shelve.stock}
                                                        </div>
                                                    </div>
                                                    {/* 產品品號、棧板規格 */}
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className="text-2xl font-bold">
                                                            產品品號：{shelve.material}
                                                        </div>
                                                        <div className="text-2xl font-bold">
                                                            棧板規格：{shelve.stock_class}
                                                        </div>
                                                    </div>
                                                    {/* 品名、配置貨架數 */}
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className="text-2xl font-bold">
                                                            品名：{shelve.materialSpec}
                                                        </div>
                                                    </div>
                                                    {/* 箱數、包數、進度 */}
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div className="text-2xl font-bold mr-12">
                                                                箱數：{shelve.box}
                                                            </div>
                                                            <div className="text-2xl font-bold">
                                                                包數：{shelve.bag}包
                                                            </div>
                                                        </div>
                                                        <div className="text-2xl font-bold">
                                                            {index + 1}/{selectedShelveData.length}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-400 text-2xl">
                                    請選擇左側訂單查看詳細資訊
                                </div>
                            )}
                            {/* 確定按鈕 */}
                            <div className="mt-auto flex items-center justify-center">
                                <ActionBtn icon="icon-check" text="確定" variant="orange" disabled={!canConfirm}/>
                            </div>
                        </div>
                    </div>
                </div>
                {/* 站點 */}
                <div className="flex gap-2">
                    <button className="flex-1 bg-green-600 text-white py-3 rounded-lg text-lg font-medium">
                        站點 1
                    </button>
                    <button className="flex-1 bg-green-600 text-white py-3 rounded-lg text-lg font-medium">
                        站點 2
                    </button>
                    <button className="flex-1 bg-green-600 text-white py-3 rounded-lg text-lg font-medium">
                        站點 3
                    </button>
                    <button className="flex-1 bg-green-600 text-white py-3 rounded-lg text-lg font-medium">
                        站點 4
                    </button>
                    <button className="flex-1 bg-green-600 text-white py-3 rounded-lg text-lg font-medium">
                        站點 5
                    </button>
                </div>
            </div>
        </>
    )
}