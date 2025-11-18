import Table from "@/components/common/table/table";
import ActionBtn from "@/components/common/btns/actionBtn";
import InputFrame from "@/components/common/input/inputFrame";
import PageTitle from "@/components/common/pageTitle";
import { testTable, testShelve } from "./testData";
import Link from "next/link";
import { useState } from "react";

export default function ShelfTransferTable() {

    const headers = [
        { label: "訂單單號", key: "orderNumber", width: "50%" },
        { label: "配置貨架數量", key: "deploy", width: "40%" },
        { label: "箱數", key: "box", width: "10%" },
    ];

    // =====過濾Table選中的資料=====
    const [selectedOrder, setSelectedOrder] = useState(null);
    const selectedShelveData = selectedOrder
        ? testShelve.filter(item => item.orderNumber === selectedOrder.orderNumber)
        : [];
    const handleRowClick = (row) => {
        setSelectedOrder(row);
    }
    
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
                            height="70vh"
                            checked={selectedOrder}
                            onChange={handleRowClick}
                        />
                    </div>
                    {/* 右邊畫面 */}
                    <div className="w-1/2 flex flex-col h-[70vh]">
                        <div className="bg-gray-50 rounded-lg p-6 flex flex-col h-full">
                            {selectedOrder && selectedShelveData.length > 0 ? (
                                <>
                                    <div className="flex-1 overflow-auto space-y-4 mb-6">
                                        {selectedShelveData.map((shelve, index) => (
                                            <div key={index} className="bg-[#DCB692] rounded-lg p-6 shadow-md">
                                                {/* 貨架、庫別 */}
                                                <div className="flex justify-between items-center mb-4">
                                                    <div className="text-2xl font-bold">
                                                        貨架編號：{shelve.shelve_Id}
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
                                                    {/* <div className="text-lg font-bold text-red-600">
                                                        配置貨架數：{1}
                                                    </div> */}
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
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-400 text-2xl">
                                    請選擇左側訂單查看詳細資訊
                                </div>
                            )}
                            {/* 確定按鈕 */}
                            <div className="mt-auto flex items-center justify-center">
                                <ActionBtn icon="icon-check" text="確定" variant="orange" disabled="true"/>
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