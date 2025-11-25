import Table from "@/components/common/table/table";
import ActionBtn from "@/components/common/btns/actionBtn";
import InputFrame from "@/components/common/input/inputFrame";
import PageTitle from "@/components/common/pageTitle";
import Loading from "../common/loading/loading";
import { testTable, testShelve } from "./testData";
import Link from "next/link";
import { useState, useMemo } from "react";

export default function OutboundExternalTable() {
    const [isLoading, setIsLoading] = useState(false);
    const headers = [
        { label: "銷貨單號", key: "orderNumber", width: "70%" },
        { label: "出庫日期", key: "outbound_date", width: "30%" },
    ];

    // =====過濾Table選中的資料=====
    const [selectedOrder, setSelectedOrder] = useState(null);
    const selectedShelveData = selectedOrder
        ? testShelve.filter(item => item.orderNumber === selectedOrder.orderNumber)
        : [];
    const handleRowClick = (row) => {
        setSelectedOrder(row);
        setOrderInput(row.orderNumber);
    }

    // =====處理銷貨單號Input=====
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

    // 試著用useMemo排序資料
    const sortedData = useMemo(() => {
        return [...testTable].sort((a, b) => {
            // 降序
            return a.outbound_date - b.outbound_date;
        })
    }, []);

    // 確定按鈕
    const handleConfirm = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
        }, 2000)
    }
    
    return (
        <>
            {isLoading && <Loading />}
            <div className="flex flex-col h-screen p-4">
                {/* 標題 */}
                <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl font-bold">出庫</div>
                    <PageTitle title="請點擊清單內工單單號或訂單單號、掃描工單或訂單條碼、外箱條碼"/>
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
                            data={sortedData}
                            needInput={false}
                            idKey="orderNumber"
                            height="70vh"
                            checked={selectedOrder}
                            onChange={handleRowClick}
                        />
                    </div>
                    {/* 右邊畫面 */}
                    <div className="w-1/2 flex flex-col h-[70vh]">
                        <div className="flex flex-row justify-between">
                            <div className="mb-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <label className="text-lg font-medium whitespace-nowrap">
                                        銷貨單條碼：
                                    </label>
                                    <InputFrame 
                                        type="text"
                                        name="orderNo"
                                        className="w-[400px]"
                                        value={orderInput}
                                        onChange={handleInputChange}
                                        placeholder="請輸入銷貨單號"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className=" bg-gray-200 rounded p-6 flex flex-col h-[70vh]">
                            {selectedOrder && selectedShelveData.length > 0 ? (
                                <>
                                    <div className="flex-1 overflow-auto space-y-6 mb-6">
                                        {selectedShelveData.map((shelve, index) => {
                                            return(
                                            <div
                                                key={index}
                                                className="w-full bg-[#DCB692] rounded-lg p-6 shadow-md"
                                            >
                                                {/* 貨架、庫別 */}
                                                <div className="flex justify-between items-center mb-4">
                                                    <div className="text-2xl font-bold">
                                                        貨架編號：{shelve.shelve_Id}
                                                    </div>
                                                    <div className="text-2xl font-bold">
                                                        出庫庫別：{shelve.stock}
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
                                            </div>
                                            )
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-400 text-2xl">
                                    {orderInput 
                                        ? "找不到匹配的訂單" 
                                        : "請輸入銷貨單號或點擊左側訂單查看詳細資訊"
                                    }
                                </div>
                            )}
                            {/* 確定按鈕 */}
                            <div className="mt-auto flex items-center justify-center">
                                <ActionBtn 
                                    icon="icon-check" 
                                    text="確定" 
                                    variant="orange" 
                                    disabled={!selectedOrder}
                                    onClick={handleConfirm}
                                />
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