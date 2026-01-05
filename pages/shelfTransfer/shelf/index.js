import { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import PageHeader from "@/components/common/pageHeader/pageHeader";
import ActionBtn from "@/components/common/btns/actionBtn";
import InputFrame from "@/components/common/input/inputFrame";
import Table from "@/components/common/table/table";
import { getStockAreas, getWMSByAreaAndPrtNo, insertShelfTask } from "@/pages/api";
import { generateRandomNumber } from "@/utils/random";
import { setShelfTransfer } from "@/redux/reducer/reducerShelfTransfer";
import { initWorkstation } from "@/redux/reducer/reducerWorkStations";
import Alert from "@/components/common/alert/alert";
import ShelfTransferStation from "@/components/shelfTransfer/shelfTransferStation";
import LoadingShelf from "@/components/common/loading/loading-shelf";
import SchematicDiagram from "@/components/diagram/schematicDiagram";

export default function ShelfTransferShelf() {
    const dispatch = useDispatch();
    const { stations, currentStation } = useSelector((s) => s.workstation);

    // TODO 暫時不透過 workspace 進來
    useEffect(() => {
        if (!currentStation) {
            dispatch(initWorkstation("172.16.11.75"));
        }
    }, [currentStation, dispatch]);

    const currentStationSafe = currentStation || stations?.[0] || "";
    const { step, screen, selectedShelves } = useSelector(
        (s) => s.shelfTransfer[currentStationSafe] || {}
    );

    // ===== 庫別下拉選單 =====
    const [stockAreas, setStockAreas] = useState([]);
    const [selectedArea, setSelectedArea] = useState("");

    useEffect(() => {
        fetchStockAreas();
    }, []);

    const fetchStockAreas = async () => {
        try {
            const res = await getStockAreas();
            if (res.data.success) {
                setStockAreas(res.data.data || []);
            }
        } catch (error) {
            console.warn("getStockAreas:", error);
        }
    };

    // ===== 產品品號 =====
    const [prtNo, setPrtNo] = useState("");
    const prtNoRef = useRef(null);
    const [searching, setSearching] = useState(false);

    // ===== 查詢結果 =====
    const [tableData, setTableData] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);

    const handleSearch = async (e) => {
        if (e.key !== "Enter") return;

        const inputValue = e.target.value.trim();
        if (!inputValue) return;
        if (searching) return;

        if (!selectedArea) {
            Alert({ text: "請選擇庫別" });
            return;
        }
        setSearching(true);
        try {
            const res = await getWMSByAreaAndPrtNo(selectedArea, inputValue);
            if (res.data.success && res.data.data?.length > 0) {
                setTableData(res.data.data);
                setSelectedRows([]);
                setPrtNo(inputValue);
            } else {
                setTableData([]);
                Alert({ text: "查無資料" });
            }
        } catch (error) {
            console.warn("getWMSByAreaAndPrtNo:", error);
        } finally {
            setSearching(false);
        }
    };

    // ===== 清除 =====
    const handleClear = () => {
        setPrtNo("");
        setTableData([]);
        setSelectedRows([]);
        prtNoRef.current?.focus();
    };

    // ===== Table =====
    const headers = [
        { label: "", key: "checkbox", width: "10%" },
        { label: "產品品號", key: "PRT_NO", width: "40%" },
        { label: "貨架編號", key: "SHELVE_ID", width: "30%" },
        { label: "箱數", key: "BOX_NO", width: "20%" },
    ];

    const handleRowSelect = (name, value, idKey) => {
        const shelveId = value[idKey];
        if (name === "checkbox") {
            setSelectedRows((prev) => {
                if (prev.includes(shelveId)) {
                    return prev.filter((id) => id !== shelveId);
                } else {
                    if (prev.length >= stations.length) {
                        Alert({ text: `最多只能選擇${stations.length}個貨架` });
                        return prev;
                    }
                    return [...prev, shelveId];
                }
            });
        }
    };

    // ===== 根據 selectedRows 過濾出要顯示的貨架詳細資訊 =====
    const groupedShelveData = useMemo(() => {
        if (selectedRows.length === 0) return [];
        // 過濾出被選中的資料
        const selectedData = tableData.filter(item => selectedRows.includes(item.SHELVE_ID));
        // 根據 SHELVE_ID 分組
        const grouped = {};
        selectedData.forEach(item => {
            const id = item.SHELVE_ID;
            if (!grouped[id]) {
                grouped[id] = {
                    SHELVE_ID: id,
                    STOCK_AREA: item.STOCK_AREA,
                    SHELVE_TYPE: item.SHELVE_TYPE,
                    items: []
                };
            }
            grouped[id].items.push(item);
        });
        return Object.values(grouped);
    }, [selectedRows, tableData]);

    // ===== 叫車 =====
    const canConfirm = selectedRows.length >= 1 && selectedRows.length <= stations.length;

    const handleConfirm = async () => {
        if (!canConfirm) {
            Alert({ text: `請選擇1~${stations.length}個貨架` });
        }

        try {
            const tasks = selectedRows.map((shelveId, index) => ({
                Command: "MOVE",
                SHELVE_ID: shelveId,
                BAR_CODE: null,
                FACE: 2,
                STATION: stations[index],
                PURPOSE: 0,
                STATUS: 0,
                CART_ID: "",
                DATA_ID: generateRandomNumber(),
                WAVENO: 0,
                GGROUP: "",
            }));
            const res = await insertShelfTask({ tasks });

            if (res.data.success) {
                const initialShelveStatus = {};
                selectedRows.forEach((shelveId) => {
                    initialShelveStatus[shelveId] = "loading";
                });

                // 更新所有相關站點的狀態
                selectedRows.forEach((shelveId, index) => {
                    const stationId = stations[index];
                    dispatch(setShelfTransfer({
                        station: stationId,
                        step: 3,
                        screen: "loading",
                        mode: "shelf",
                        orderCode: `${selectedArea}`,
                        selectedShelves: selectedRows,
                        shelveStatus: initialShelveStatus,
                        shelveData: {},
                    }));
                });

                // 確保當前站點也更新
                const updatedStations = selectedRows.map((_, index) => stations[index]);
                if (currentStationSafe && !updatedStations.includes(currentStationSafe)) {
                    dispatch(setShelfTransfer({
                        station: currentStationSafe,
                        step: 3,
                        screen: "loading",
                        mode: "shelf",
                        orderCode: `${selectedArea}`,
                        selectedShelves: selectedRows,
                        shelveStatus: initialShelveStatus,
                        shelveData: {},
                    }));
                }

                setTableData([]);
                setSelectedRows([]);
            } else {
                Alert({ text: res.data.message || "派車失敗", icon: "error" });
            }
        } catch (error) {
            console.warn("handleConfirm:", error);
            Alert({ text: "派車失敗" });
        }
    }

    if (screen === "loading") {
        return <LoadingShelf />;
    }

    if (step === 3) {
        return <ShelfTransferStation />;
    }

    return (
        <>
            <div className="flex flex-col h-screen p-4">
                {/* 標題 */}
                <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl font-bold">貨架調整</div>
                    <div className="text-2xl font-bold text-center flex-1">
                        {tableData.length > 0
                            ? `請在左側清單內勾選最多${stations.length}個貨架，點擊確定按鈕系統會派發無人車將貨架搬運至工作站`
                            : "請先選擇庫區後輸入品項號，點擊檢視按鈕查詢要調整的貨架"
                        }
                    </div>
                    <Link href="/shelfTransfer">
                        <ActionBtn icon="icon-goback" text="返回" variant="darkBlue" />
                    </Link>
                </div>
                {/* 篩選區 */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <label className="font-bold whitespace-nowrap">入倉庫別:</label>
                        <select
                            value={selectedArea}
                            onChange={(e) => setSelectedArea(e.target.value)}
                            className="border-2 border-gray-300 rounded px-3 py-2 min-w-[120px]"
                        >
                            <option value="">請選擇庫別</option>
                            {stockAreas.map((area) => (
                                <option key={area.STOCK_AREA} value={area.STOCK_AREA}>
                                    {area.STOCK_AREA}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="font-bold whitespace-nowrap">產品品號:</label>
                        <InputFrame
                            type="text"
                            ref={prtNoRef}
                            onKeyDown={handleSearch}
                            disabled={searching}
                            placeholder=""
                            className="w-[250px]"
                        />
                        {searching && <span className="ml-2">查詢中...</span>}
                    </div>
                    <ActionBtn
                        icon="icon-delete"
                        text="清除"
                        variant="gray"
                        onClick={handleClear}
                    />
                </div>
                {/* 主要內容區 */}
                <div className="flex gap-4 flex-1">
                    <div className="w-2/5">
                        <Table
                            variant="green"
                            type="checkbox"
                            name="shelfAdjustList"
                            headers={headers}
                            data={tableData}
                            needInput={true}
                            idKey="SHELVE_ID"
                            height="65vh"
                            checked={selectedRows}
                            onChange={handleRowSelect}
                        />
                    </div>
                    {/* 詳細資訊 */}
                    <div className="w-3/5 bg-gray-50 rounded-lg p-6 flex flex-col h-[70vh]">
                        {groupedShelveData.length > 0 ? (
                            <div className="flex-1 overflow-auto space-y-6">
                                {groupedShelveData.map((shelveGroup, index) => (
                                    <SchematicDiagram key={shelveGroup.SHELVE_ID}>
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl font-bold">
                                                    貨架編號：{shelveGroup.SHELVE_ID}
                                                </div>
                                            </div>
                                            <div className="text-2xl font-bold">
                                                入庫庫別：{shelveGroup.STOCK_AREA}
                                            </div>
                                        </div>
                                        {/* 該貨架的所有產品 */}
                                        {shelveGroup.items.map((item, itemIndex) => (
                                            <div key={itemIndex} className="border-t border-[#c4a57b] pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="text-2xl font-bold">
                                                        產品品號：{item.PRT_NO}
                                                    </div>
                                                    <div className="text-2xl font-bold">
                                                        棧板規格：{item.SHELVE_TYPE}
                                                    </div>
                                                </div>
                                                <div className="text-2xl font-bold mb-2">
                                                    品名：{item.PRT_NAME}
                                                </div>
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
                                        <div className="text-2xl font-bold text-right mt-4">
                                            {index + 1}/{groupedShelveData.length}
                                        </div>
                                    </SchematicDiagram>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center h-full text-gray-400 text-2xl">
                                {tableData.length > 0 
                                    ? "請在左側勾選貨架查看詳細資訊" 
                                    : "請先搜尋產品品號"
                                }
                            </div>
                        )}
                    </div>
                </div>
                {/* 按鈕區 */}
                <div className="flex justify-center py-4">
                    <ActionBtn
                        icon="icon-check"
                        text="確定"
                        variant="orange"
                        disabled={!canConfirm}
                        onClick={handleConfirm}
                    />
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
    );
}