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
import { checkTask_shelfTransfer, addTask_shelfTransfer } from "./shelfTransferFunction";

export default function ShelfTransferTable() {
  const dispatch = useDispatch();
  const { stations, currentStation } = useSelector((s) => s.workstation);

  const currentStationSafe = currentStation || stations?.[0] || "";
  const { orderList, lackStation } = useSelector((s) => s.shelfTransfer);
  const { step, screen, orderCode, order, selectedShelves } = useSelector((s) => s.shelfTransfer[currentStationSafe] || {});

  const headers = [
    { label: "", key: "checkbox", width: "10%" },
    { label: "訂單單號", key: "SALE_NO", width: "50%" },
    { label: "配置貨架數量", key: "SHELVE_COUNT", width: "30%" },
    { label: "箱數", key: "BOX_NO_SUM", width: "10%" },
  ];

  // ===== 理貨單 =====
  const [tableData, setTableData] = useState([]);
  const [searching, setSearching] = useState(false);
  const fetchList = async (keyword) => {
    if (!keyword) {
      setTableData([]);
      return;
    }
    setSearching(true);
    try {
      const res = await getShelfTransfer(keyword);
      if (res.data.success) {
        // 後端已按 SALE_NO 前兩段分組，直接使用
        setTableData(res.data.data);
      }
    } catch (error) {
      console.warn("getShelfTransfer: ", error);
    } finally {
      setSearching(false);
    }
  };

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
  };

  // ===== 根據相同的SHELVE_ID資料分組 =====
  const groupedShelveData = useMemo(() => {
    const grouped = {};
    shelveData.forEach((item) => {
      const id = item.SHELVE_ID;
      if (!grouped[id]) {
        grouped[id] = {
          SHELVE_ID: id,
          STOCK_AREA: item.STOCK_AREA,
          SHELVE_TYPE: item.SHELVE_TYPE,
          items: [],
        };
      }
      grouped[id].items.push(item);
    });
    return Object.values(grouped);
  }, [shelveData]);

  // =====過濾Table選中的資料=====
  const [selectedOrder, setSelectedOrder] = useState(null);
  const handleRowClick = (name, row, idKey) => {
    setSelectedOrder(row);
    setOrderInput(row.SALE_NO);
    setSelectedShelve([]);
    fetchShelveData(row.SALE_NO);
    dispatch(
      setShelfTransfer({
        station: currentStationSafe,
        orderCode: row.SALE_NO,
        order: row,
        waveNo: row.W_ID,
        selectedShelves: [],
        step: 1,
      }),
    );
  };

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
    setOrderInput(e.target.value);
  };

  const handleInputKeyDown = async (e) => {
    if (e.key !== "Enter") return;
    const value = e.target.value.trim();
    if (!value) return;

    // 呼叫 API 搜尋 SALE_NO
    await fetchList(value);
    setSelectedOrder(null);
    setShelveData([]);
    setSelectedShelve([]);
  };

  // =====處理右側貨架點擊（當前 SALE_NO 的貨架選擇）=====
  const [selectedShelve, setSelectedShelve] = useState([]);
  const handleShelveClick = (shelveGroup) => {
    const shelveId = shelveGroup.SHELVE_ID;
    const newSelected = selectedShelve.includes(shelveId) ? selectedShelve.filter((id) => id !== shelveId) : [...selectedShelve, shelveId];
    setSelectedShelve(newSelected);
    dispatch(
      setShelfTransfer({
        station: currentStationSafe,
        selectedShelves: newSelected,
      }),
    );
  };

  // ===== 累積選擇的貨架(跨 SALE_NO)=====
  const [accumulatedShelves, setAccumulatedShelves] = useState([]);

  // 加入按鈕：把當前選中的貨架加入清單
  const handleAddToAccumulated = () => {
    if (selectedShelve.length === 0) {
      Alert({ title: "請先選擇貨架" });
      return;
    }

    // 檢查是否超過站點數量
    const totalAfterAdd = accumulatedShelves.length + selectedShelve.length;
    if (totalAfterAdd > stations.length) {
      Alert({ title: `最多只能選擇 ${stations.length} 個貨架，目前已有 ${accumulatedShelves.length} 個` });
      return;
    }

    // 把選中的貨架加入累積清單
    const newItems = selectedShelve.map((shelveId) => {
      const shelveGroup = groupedShelveData.find((g) => g.SHELVE_ID === shelveId);
      return {
        SALE_NO: selectedOrder?.SALE_NO,
        SHELVE_ID: shelveId,
        STOCK_AREA: shelveGroup?.STOCK_AREA,
        items: shelveGroup?.items || [],
      };
    });

    // 過濾掉已存在的貨架
    const existingIds = accumulatedShelves.map((s) => s.SHELVE_ID);
    const uniqueNewItems = newItems.filter((item) => !existingIds.includes(item.SHELVE_ID));

    if (uniqueNewItems.length === 0) {
      Alert({ title: "選擇的貨架已在清單中" });
      return;
    }

    setAccumulatedShelves([...accumulatedShelves, ...uniqueNewItems]);
    setSelectedShelve([]);
    Alert({ title: `已加入 ${uniqueNewItems.length} 個貨架`, icon: "success", timer: 1000 });
  };

  // 從累積清單移除貨架
  const handleRemoveFromAccumulated = (shelveId) => {
    setAccumulatedShelves(accumulatedShelves.filter((s) => s.SHELVE_ID !== shelveId));
  };

  // 清空累積清單
  const handleClearAccumulated = () => {
    setAccumulatedShelves([]);
  };

  // 確定按鈕叫車（使用累積的貨架）
  const handleConfirm = async () => {
    if (accumulatedShelves.length < 1 || accumulatedShelves.length > stations.length) {
      Alert({ title: `請選擇 1~${stations.length} 個貨架` });
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
      const tasks = accumulatedShelves.map((shelve, index) => ({
        Command: "MOVE",
        SHELVE_ID: shelve.SHELVE_ID,
        BAR_CODE: null,
        FACE: 2,
        STATION: stations[index],
        PURPOSE: 4,
        STATUS: 0,
        CART_ID: "",
        DATA_ID: generateRandomNumber(),
        WAVENO: "",
        GGROUP: "",
      }));
      console.log("task: ", tasks);

      const res = await insertShelfTask({ tasks });

      if (res.data.success) {
        const initialShelveStatus = {};
        accumulatedShelves.forEach((shelve) => {
          initialShelveStatus[shelve.SHELVE_ID] = "loading";
        });

        // 取得所有不重複的 SALE_NO
        const uniqueSaleNos = [...new Set(accumulatedShelves.map((s) => s.SALE_NO).filter(Boolean))];

        // 更新所有相關站點的狀態
        accumulatedShelves.forEach((shelve, index) => {
          const stationId = stations[index];
          dispatch(
            setShelfTransfer({
              station: stationId,
              step: 3,
              screen: "loading",
              mode: "order",
              orderCode: uniqueSaleNos[0] || "",
              orderCodes: uniqueSaleNos,
              selectedShelves: accumulatedShelves.map((s) => s.SHELVE_ID),
              shelveStatus: initialShelveStatus,
              shelveData: {},
            }),
          );
        });

        // 確保當前站點也更新
        const updatedStations = accumulatedShelves.map((_, index) => stations[index]);
        if (currentStationSafe && !updatedStations.includes(currentStationSafe)) {
          dispatch(
            setShelfTransfer({
              station: currentStationSafe,
              step: 3,
              screen: "loading",
              mode: "order",
              orderCode: uniqueSaleNos[0] || "",
              orderCodes: uniqueSaleNos,
              selectedShelves: accumulatedShelves.map((s) => s.SHELVE_ID),
              shelveStatus: initialShelveStatus,
              shelveData: {},
            }),
          );
        }

        // 清空累積清單
        setAccumulatedShelves([]);
        await addTask_shelfTransfer(stations);
      } else {
        Alert({ title: res?.data?.message || "派車失敗", icon: "error" });
      }
    } catch (error) {
      console.warn("handleConfirm:", error);
    }
  };

  // 檢查是否可以按確定
  const canConfirm = accumulatedShelves.length >= 1 && accumulatedShelves.length <= stations.length;
  const canAdd = selectedShelve.length > 0 && accumulatedShelves.length + selectedShelve.length <= stations.length;

  return (
    <>
      {/* 標題 */}
      <div className="flex items-center justify-between">
        <div className="text-(length:--font-size-6xl) font-bold text-(--green-deep)">訂單理貨</div>
        <PageTitle title="請輸入訂單單號" />
        <Link href="/shelfTransfer">
          <ActionBtn icon="icon-goback" text="返回" variant="darkBlue" />
        </Link>
      </div>
      {/* input */}
      <div className="flex gap-4 py-2 items-stretch h-[72vh]">
        {/* 左邊：Table + 已選擇清單 */}
        <div className="w-[47%] flex flex-col gap-2">
          {/* Table */}
          <div className="flex-1 min-h-0">
            <Table variant="green" type="checkbox" name="shelfTransferList" headers={headers} data={tableData} needInput={true} idKey="SALE_NO" checked={selectedOrder} onChange={handleRowClick} />
          </div>
          {/* 已累積的貨架清單 */}
          {accumulatedShelves.length > 0 && (
            <div className="bg-white rounded-lg p-3 max-h-[30%] overflow-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold">已選擇 {accumulatedShelves.length} / {stations.length} 個貨架</span>
                <button onClick={handleClearAccumulated} className="text-sm text-red-500 hover:text-red-700">清空</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {accumulatedShelves.map((shelve) => (
                  <div key={shelve.SHELVE_ID} className="bg-white border rounded px-2 py-1 flex items-center gap-2">
                    <span className="text-sm font-medium">{shelve.SHELVE_ID}</span>
                    <span className="text-xs text-gray-500">({shelve.SALE_NO})</span>
                    <button onClick={() => handleRemoveFromAccumulated(shelve.SHELVE_ID)} className="text-red-500 hover:text-red-700 text-lg leading-none">&times;</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* 右邊畫面 */}
        <div className="w-[53%] flex flex-col overflow-hidden">
          <div className="flex space-x-4">
            <div className="flex items-center p-4">
              <label className="font-medium whitespace-nowrap">訂單單號：</label>
              <InputFrame type="text" name="orderNo" value={orderInput} onChange={handleInputChange} onKeyDown={handleInputKeyDown} placeholder="請輸入訂單單號" />
            </div>
          </div>
          <div className="flex flex-col bg-white p-8 pb-4 h-full justify-between overflow-hidden">
            <div className="custom-scrollbar " style={{ "--scrollbar-thumb-color": `var(--green-vivid)` }}>
              {selectedOrder && groupedShelveData.length > 0 ? (
                <>
                  <div className="flex-1 overflow-auto space-y-2 mb-6">
                    {groupedShelveData.map((shelveGroup, index) => {
                      const isSelected = selectedShelve.includes(shelveGroup.SHELVE_ID);
                      const isAlreadyAdded = accumulatedShelves.some((s) => s.SHELVE_ID === shelveGroup.SHELVE_ID);
                      return (
                        <div
                          key={shelveGroup.SHELVE_ID}
                          onClick={() => !isAlreadyAdded && handleShelveClick(shelveGroup)}
                          className={`py-1 transition-all ${isAlreadyAdded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}`}
                        >
                          <SchematicDiagram isSelected={isSelected || isAlreadyAdded}>
                            <div className="flex flex-col">
                              <div className="flex items-center justify-between gap-4 w-full">
                                <div className="whitespace-nowrap">
                                  貨架編號: {shelveGroup.SHELVE_ID}
                                  {isAlreadyAdded && <span className="ml-2 text-orange-500 text-sm">(已加入)</span>}
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
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-2xl">請選擇左側訂單查看詳細資訊</div>
              )}
            </div>
            {/* 按鈕區 */}
            <div className="flex flex-1 flex-col justify-end items-center p-4 gap-2">
              {/* 加入按鈕 */}
              {selectedOrder && (
                <ActionBtn
                  icon="icon-plus"
                  text={`加入`}
                  variant="green"
                  disabled={!canAdd}
                  onClick={handleAddToAccumulated}
                />
              )}
              {/* 確定按鈕 */}
              <ActionBtn icon="icon-check" text={`確定叫車`} variant="orange" disabled={!canConfirm} onClick={handleConfirm} />
            </div>
          </div>
        </div>
      </div>
      {/* 站點 */}
      <div className="w-full flex justify-between gap-4 z-20">
        {stations.map((station) => (
          <ActionBtn key={station} text={station} variant="green" className="flex-1" disabled={false} />
        ))}
      </div>
    </>
  );
}
