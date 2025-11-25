import Table from "@/components/common/table/table";
import ActionBtn from "@/components/common/btns/actionBtn";
import InputFrame from "@/components/common/input/inputFrame";
import PageTitle from "@/components/common/pageTitle";
import { testTable } from "./testData";
import Link from "next/link";
import { useState, useMemo } from "react";

export default function OutboundTable() {

    const headers = [
        { label: "領用單號", key: "orderNumber", width: "70%" },
        { label: "出庫日期", key: "outbound_date", width: "30%" },
    ];

    // 試著用useMemo排序資料
    const sortedData = useMemo(() => {
        return [...testTable].sort((a, b) => {
            // 降序
            return a.outbound_date - b.outbound_date;
        })
    }, []);
    
    return (
        <>
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
                        />
                    </div>
                    {/* 右邊畫面 */}
                    <div className="w-1/2 flex flex-col h-[70vh]">
                        <div className="flex flex-row justify-between">
                            <div className="mb-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <label className="text-lg font-medium whitespace-nowrap">
                                        領用單條碼：
                                    </label>
                                    <InputFrame 
                                        type="text"
                                        name="orderNo"
                                        className="w-[400px]"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className=" bg-gray-200 rounded p-6 flex flex-col h-[70vh]">
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