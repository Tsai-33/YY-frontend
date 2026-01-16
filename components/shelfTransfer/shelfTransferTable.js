import Table from "@/components/common/table/table";
import ActionBtn from "@/components/common/btns/actionBtn";
import InputFrame from "@/components/common/input/inputFrame";
import PageTitle from "@/components/common/pageHeader/pageTitle";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getShelfTransfer, getWMSBySaleNo, insertShelfTask } from "@/pages/api";
import { generateRandomNumber } from "@/utils/random";
import SchematicDiagram from "../diagram/schematicDiagram";
import { setShelfTransfer } from "@/redux/reducer/reducerShelfTransfer";
import { initWorkstation } from "@/redux/reducer/reducerWorkStations";
import Alert from "../common/alert/alert";

export default function ShelfTransferTable() {
    const dispatch = useDispatch();
    const { stations, currentStation } = useSelector((s) => s.workstation);

    // TODO 暫時不透過workspace進來
    useEffect(() => {
        if (!currentStation) {
            dispatch(initWorkstation("172.16.11.75"));
        }
    }, [currentStation, dispatch]);
    const currentStationSafe = currentStation || stations?.[0] || "";
    const { orderList, lackStation } = useSelector((s) => s.shelfTransfer);
    const { step, screen, orderCode, order, selectedShelves } = useSelector(
        (s) => s.shelfTransfer[currentStationSafe] || {}
    );

    const headers = [
        { label: "", key: "checkbox", width: "10%" },
        { label: "訂單單號", key: "SALE_NO", width: "50%" },
        { label: "配置貨架數量", key: "SHELVE_COUNT", width: "30%" },
        { label: "箱數", key: "BOX_NO_SUM", width: "10%" },
    ];

    // ===== 理貨單 =====
    const [tableData, setTableData] = useState([]);
    useEffect(() => {
        fetchList();
    }, []);
    const fetchList = async () => {
        try {
            const res = await getShelfTransfer();
            if (res.data.success) {
                const detail = res.data.data;
                setTableData(detail);
            }
        } catch (error) {
            console.warn("getShelfTransfer: ", error);
        }
    }

    // ===== 貨架內容 =====
    const [shelveData, setShelveData] = useState([]);
    const fetchShelveData = async (sale_no) => {
        if (!sale_no) {
            setShelveData([]);
            return;
        }
        try {
            const res = await getWMSBySaleNo(sale_no);
            if (res.data.success) {
                const detail = res.data.data;
                setShelveData(detail);
            } else {
                setShelveData([]);
            }
        } catch (error) {
            console.warn("getWMSBySaleNo: ", error);
        }
    }

    // ===== 根據相同的SHELVE_ID資料分組 =====
    const groupedShelveData = useMemo(() => {
        const grouped = {};
        shelveData.forEach(item => {
            const id = item.SHELVE_ID;
            if (!grouped[id]) {
                grouped[id] = {
                    SHELVE_ID: id,
                    STOCK_AREA: item.STOCK_AREA,
                    SHELVE_TYPE: item.SHELVE_TYPE,
                    items:[]
                };
            }
            grouped[id].items.push(item);
        });
        return Object.values(grouped);
    }, [shelveData]);

    // =====過濾Table選中的資料=====
    const [selectedOrder, setSelectedOrder] = useState(null);
    // const selectedShelveData = selectedOrder
    //     ? testShelve.filter(item => item.SALE_NO === selectedOrder.SALE_NO)
    //     : [];
    const handleRowClick = (row) => {
        setSelectedOrder(row);
        setOrderInput(row.SALE_NO);
        setSelectedShelve([]);
        fetchShelveData(row.SALE_NO);
        dispatch(setShelfTransfer({
            station: currentStationSafe,
            orderCode: row.SALE_NO,
            order: row,
            waveNo: row.W_ID,
            selectedShelves: [],
            step: 1,
        }));
    }

    // =====處理訂單單號Input=====
    const [orderInput, setOrderInput] = useState("");
    useEffect(() => {
        if (orderCode) {
            setOrderInput(orderCode);
        }
        if (selectedShelves?.length > 0) {
            setSelectedShelve(selectedShelves);
        }
    }, [orderCode, selectedShelves]);
    const handleInputChange = (e) => {
        const value = e.target.value;
        setOrderInput(value);
        // 匹配
        const matchOrder = tableData.find(
            item => item.SALE_NO === value
        );

        if (matchOrder) {
            setSelectedOrder(matchOrder);
            fetchShelveData(matchOrder.SALE_NO);
        } else {
            setSelectedOrder(null);
        }
    }

    // =====處理右側貨架點擊=====
    const [selectedShelve, setSelectedShelve] = useState([]);
    const handleShelveClick = (shelveGroup) => {
        const shelveId = shelveGroup.SHELVE_ID;
        const newSelected = selectedShelve.includes(shelveId)
            ? selectedShelve.filter(id => id !== shelveId)
            : [...selectedShelve, shelveId];
        setSelectedShelve(newSelected);
        dispatch(setShelfTransfer({
            station: currentStationSafe,
            selectedShelves: newSelected,
        }));
    }

    // 確定按鈕叫車
    const handleConfirm = async () => {
        if (selectedShelve.length < 2 || selectedShelve.length > stations.length) {
            Alert({html: `請選擇2~${stations.length}個貨架`});
            return;
        }
        try {
            const tasks = selectedShelve.map((shelveId, index) => ({
                Command: "MOVE",
                SHELVE_ID: shelveId,
                BAR_CODE: null,
                FACE: 2,
                STATION: stations[index],
                PURPOSE: 4,
                STATUS: 0,
                CART_ID: "",
                DATA_ID: generateRandomNumber(),
                WAVENO: selectedOrder?.W_ID || 0,
                GGROUP: "",
            }));

            const res = await insertShelfTask({ tasks });

            if (res.data.success) {
                const initialShelveStatus = {};
                selectedShelve.forEach(shelveId => {
                    initialShelveStatus[shelveId] = "loading";
                });

                // 更新所有相關站點的狀態
                selectedShelve.forEach((shelveId, index) => {
                    const stationId = stations[index];
                    dispatch(setShelfTransfer({
                        station: stationId,
                        step: 3,
                        screen: "loading",
                        mode: "order",
                        orderCode: orderInput,
                        selectedShelves: selectedShelve,
                        shelveStatus: initialShelveStatus,
                        shelveData: {},
                    }));
                });

                // 確保當前站點也更新
                const updatedStations = selectedShelve.map((_, index) => stations[index]);
                if (currentStationSafe && !updatedStations.includes(currentStationSafe)) {
                    dispatch(setShelfTransfer({
                        station: currentStationSafe,
                        step: 3,
                        screen: "loading",
                        mode: "order",
                        orderCode: orderInput,
                        selectedShelves: selectedShelve,
                        shelveStatus: initialShelveStatus,
                        shelveData: {},
                    }));
                }

                setTableData((prev) => prev.filter((v) => v.SALE_NO !== orderInput));
            } else {
                Alert({ html: res.data.message || "派車失敗", icon: "error" });
            }
        } catch (error) {
            console.warn("handleConfirm:", error);
        }
    }

    // 檢查是否可以按確定(至少2個最多站點數量)
    const canConfirm = selectedShelve.length >= 2 && selectedShelve.length <= stations.length;

    return (
        <>
            <div className="flex flex-col h-screen p-4">
                {/* 標題 */}
                <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl font-bold">理貨</div>
                    <PageTitle title="請輸入訂單單號"/>
                    <Link href="/shelfTransfer">
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
                            data={tableData}
                            needInput={true}
                            idKey="SALE_NO"
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
                            {selectedOrder && groupedShelveData.length > 0 ? (
                                <>
                                    <div className="flex-1 overflow-auto space-y-6 mb-6">
                                        {groupedShelveData.map((shelveGroup, index) => {
                                            const isSelected = selectedShelve.includes(shelveGroup.SHELVE_ID);
                                            return (
                                                <div
                                                    key={shelveGroup.SHELVE_ID}
                                                    onClick={() => handleShelveClick(shelveGroup)}
                                                    className={`
                                                        cursor-pointer transition-all
                                                        ${isSelected 
                                                            ? 'ring-4 ring-green-500 ring-offset-4 rounded-3xl' 
                                                            : 'hover:shadow-lg'
                                                        }
                                                    `}
                                                >
                                                    <SchematicDiagram>
                                                        {/* 貨架、庫別 */}
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-2xl font-bold">
                                                                    貨架編號：{shelveGroup.SHELVE_ID}
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
                                                                入庫庫別：{shelveGroup.STOCK_AREA}
                                                            </div>
                                                        </div>

                                                        {/* 該貨架的所有產品 */}
                                                        {shelveGroup.items.map((item, itemIndex) => (
                                                            <div key={itemIndex} className="border-t border-[#c4a57b] pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0">
                                                                {/* 產品品號、棧板規格 */}
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <div className="text-2xl font-bold">
                                                                        產品品號：{item.PRT_NO}
                                                                    </div>
                                                                    <div className="text-2xl font-bold">
                                                                        棧板規格：{item.SHELVE_TYPE}
                                                                    </div>
                                                                </div>
                                                                {/* 品名 */}
                                                                <div className="text-2xl font-bold mb-2">
                                                                    品名：{item.PRT_NAME}
                                                                </div>
                                                                {/* 箱數、包數 */}
                                                                <div className="flex gap-12">
                                                                    <div className="text-2xl font-bold">
                                                                        箱數：{item.BOX_NO} 箱
                                                                    </div>
                                                                    <div className="text-2xl font-bold">
                                                                        包數：{item.BOX_PACK} 包
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* 進度 */}
                                                        <div className="text-2xl font-bold text-right mt-4">
                                                            {index + 1}/{groupedShelveData.length}
                                                        </div>
                                                    </SchematicDiagram>
                                                </div>
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
                                <ActionBtn icon="icon-check" text="確定" variant="orange" disabled={!canConfirm} onClick={handleConfirm}/>
                            </div>
                        </div>
                    </div>
                </div>
                {/* 站點 */}
                <div className="flex gap-2">
                    {stations.map((station, index) => (
                        <button
                            key={station}
                            className="flex-1 bg-green-600 text-white py-3 rounded-lg text-lg font-medium"
                        >
                            站點 {index + 1}
                        </button>
                    ))}
                </div>
            </div>
        </>
    )
}