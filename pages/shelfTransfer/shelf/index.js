import { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import ActionBtn from "@/components/common/btns/actionBtn";
import InputFrame from "@/components/common/input/inputFrame";
import Table from "@/components/common/table/table";
import {
  getStockAreas,
  getWMSByAreaAndPrtNo,
  insertShelfTask,
} from "@/pages/api";
import { generateRandomNumber } from "@/utils/random";
import { setShelfTransfer } from "@/redux/reducer/reducerShelfTransfer";
import Alert from "@/components/common/alert/alert";
import ShelfTransferStation from "@/components/shelfTransfer/shelfTransferStation";
import LoadingShelf from "@/components/common/loading/loading-shelf";
import SchematicDiagram from "@/components/diagram/schematicDiagram";
import { checkTask_shelfTransfer, addTask_shelfTransfer } from "@/components/shelfTransfer/shelfTransferFunction";

export default function ShelfTransferShelf() {
  const dispatch = useDispatch();
  const { stations, currentStation } = useSelector((s) => s.workstation);

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
      Alert({ title: "請選擇庫別" });
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
        Alert({ title: "查無資料" });
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
            Alert({ title: `此站最多只能選擇${stations.length}個貨架` });
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
    const selectedData = tableData.filter((item) =>
      selectedRows.includes(item.SHELVE_ID)
    );
    // 根據 SHELVE_ID 分組
    const grouped = {};
    selectedData.forEach((item) => {
      const id = item.SHELVE_ID;
      if (!grouped[id]) {
        grouped[id] = {
          SHELVE_ID: id,
          STOCK_AREA: item.STOCK_AREA,
          SHELVE_TYPE: item.SHELVE_TYPE,
          REMARK: item.REMARK || "",
          items: [],
        };
      }
      grouped[id].items.push(item);
    });
    return Object.values(grouped);
  }, [selectedRows, tableData]);

  // ===== 叫車 =====
  const canConfirm =
    selectedRows.length >= 1 && selectedRows.length <= stations.length;

  const handleConfirm = async () => {
    if (!canConfirm) {
      Alert({ title: `請選擇1~${stations.length}個貨架` });
      return;
    }

    // 檢查是否有其他任務正在執行
    const task = await checkTask_shelfTransfer(stations);
    if (!task?.success) return;
    const hasTask = task?.data?.data?.some((item) => item.location === "shelfTransfer" || item.location === "");
    if (!hasTask) {
      Alert({ title: "目前有其他任務正在執行" });
      return;
    }

    try {
      const tasks = selectedRows.map((shelveId, index) => ({
        Command: "MOVE",
        SHELVE_ID: shelveId,
        BAR_CODE: null,
        FACE: 2,
        STATION: stations[index],
        PURPOSE: 4,
        STATUS: 0,
        CART_ID: "",
        DATA_ID: generateRandomNumber(),
        WAVENO: 0,
        GGROUP: "",
      }));
      const res = await insertShelfTask({ tasks });

      if (res?.data?.success) {
        const initialShelveStatus = {};
        selectedRows.forEach((shelveId) => {
          initialShelveStatus[shelveId] = "loading";
        });

        // 更新所有相關站點的狀態
        selectedRows.forEach((shelveId, index) => {
          const stationId = stations[index];
          dispatch(
            setShelfTransfer({
              station: stationId,
              step: 3,
              screen: "loading",
              mode: "shelf",
              orderCode: `${selectedArea}`,
              selectedShelves: selectedRows,
              shelveStatus: initialShelveStatus,
              shelveData: {},
            })
          );
        });

        // 確保當前站點也更新
        const updatedStations = selectedRows.map((_, index) => stations[index]);
        if (
          currentStationSafe &&
          !updatedStations.includes(currentStationSafe)
        ) {
          dispatch(
            setShelfTransfer({
              station: currentStationSafe,
              step: 3,
              screen: "loading",
              mode: "shelf",
              orderCode: `${selectedArea}`,
              selectedShelves: selectedRows,
              shelveStatus: initialShelveStatus,
              shelveData: {},
            })
          );
        }

        setTableData([]);
        setSelectedRows([]);
        await addTask_shelfTransfer(stations);
      } else {
        Alert({ title: res?.data?.message || "派車失敗", icon: "error" });
      }
    } catch (error) {
      console.warn("handleConfirm:", error);
      Alert({ title: "派車失敗" });
    }
  };

  if (screen === "loading") {
    return <LoadingShelf />;
  }

  if (step === 3) {
    return <ShelfTransferStation />;
  }

  return (
    <>
      {/* 標題 */}
      <div className="flex items-center justify-between">
        <div className="text-(length:--font-size-6xl) font-bold text-(--green-deep)">
          貨架調整
        </div>
        <div className="text-black sm:text-(length:--font-size-4xl) font-bold text-center flex-1">
          {tableData.length > 0
            ? `請在左側清單內勾選最多${stations.length}個貨架，點擊確定按鈕系統會派發無人車將貨架搬運至工作站`
            : "請先選擇庫區後輸入品項號，點擊檢視按鈕查詢要調整的貨架"}
        </div>
        <Link href="/shelfTransfer">
          <ActionBtn icon="icon-goback" text="返回" variant="darkBlue" />
        </Link>
      </div>
      {/* 篩選區 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="font-bold whitespace-nowrap">入倉庫別:</label>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="border-2 border-gray-300 rounded px-3 py-2 min-w-[120px]">
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
      <div className="flex-1 min-h-0 flex gap-4 py-2 items-stretch">
        <div className="w-[47%]">
          <Table
            variant="green"
            type="checkbox"
            name="shelfAdjustList"
            headers={headers}
            data={tableData}
            needInput={true}
            idKey="SHELVE_ID"
            height="68vh"
            checked={selectedRows}
            onChange={handleRowSelect}
          />
        </div>
        {/* 詳細資訊 */}
        <div className="w-[53%] bg-gray-50 rounded-lg p-6 flex flex-col h-[68vh]">
          {groupedShelveData.length > 0 ? (
            <div className="flex-1 min-h-0 overflow-auto space-y-6">
              {groupedShelveData.map((shelveGroup, index) => (
                <SchematicDiagram key={shelveGroup.SHELVE_ID}>
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between gap-4 w-full">
                      <div className="whitespace-nowrap">貨架編號: {shelveGroup.SHELVE_ID}</div>
                      <div className="flex-1 flex items-center gap-2 truncate" title={shelveGroup.REMARK || ""}>
                        備註: {shelveGroup.REMARK}
                      </div>
                      <div>入庫庫別: {shelveGroup.STOCK_AREA}</div>
                    </div>
                    <div className="border-t border-[#c4a57b] pt-3 mt-3"></div>
                    <table className="w-full border-collapse text-left">
                      <thead className="bg-gray-300 rounded-lg">
                        <tr>
                          <th className="rounded-tl-xl p-2 w-[25%]">產品品號</th>
                          <th className="p-2">品名</th>
                          <th className="p-2 w-[12%]">總箱數</th>
                          <th className="rounded-tr-xl p-2 w-[12%]">總包數</th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-100 rounded-lg">
                        {shelveGroup.items.map((item, itemIndex) => (
                          <tr key={itemIndex} className={itemIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className={`p-2 ${itemIndex === shelveGroup.items.length - 1 ? "rounded-bl-xl" : ""}`}>{item?.PRT_NO}</td>
                            <td className="p-2">{item?.PRT_NAME}</td>
                            <td className="p-2">{item?.BOX_NO}</td>
                            <td className={`p-2 ${itemIndex === shelveGroup.items.length - 1 ? "rounded-br-xl" : ""}`}>{item?.PP_NO}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SchematicDiagram>
              ))}
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex items-center justify-center h-full text-gray-400 text-2xl">
              {tableData.length > 0
                ? "請在左側勾選貨架查看詳細資訊"
                : "請先搜尋產品品號"}
            </div>
          )}
        </div>
      </div>
      {/* 按鈕區 */}
      <div className="flex justify-center">
        <ActionBtn
          icon="icon-check"
          text="確定"
          variant="orange"
          disabled={!canConfirm}
          onClick={handleConfirm}
        />
      </div>
    </>
  );
}
