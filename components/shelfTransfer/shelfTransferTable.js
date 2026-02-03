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
  // useEffect(() => {
  //     if (!currentStation) {
  //         dispatch(initWorkstation("172.16.11.75"));
  //     }
  // }, [currentStation, dispatch]);
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
  useEffect(() => {
    fetchList();
  }, []);
  const fetchList = async () => {
    try {
      const res = await getShelfTransfer();
      if (res.data.success) {
        const detail = res.data.data;
        // 根據 SALE_NO 分組合併，避免重複顯示
        const grouped = {};
        detail.forEach((item) => {
          const saleNo = item.SALE_NO;
          if (!grouped[saleNo]) {
            grouped[saleNo] = {
              ...item,
              SHELVE_COUNT: 0,
              BOX_NO_SUM: 0,
            };
          }
          grouped[saleNo].SHELVE_COUNT += item.SHELVE_COUNT || 0;
          grouped[saleNo].BOX_NO_SUM += item.BOX_NO_SUM || 0;
        });
        setTableData(Object.values(grouped));
      }
    } catch (error) {
      console.warn("getShelfTransfer: ", error);
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
  // const selectedShelveData = selectedOrder
  //     ? testShelve.filter(item => item.SALE_NO === selectedOrder.SALE_NO)
  //     : [];
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

  const handleInputKeyDown = (e) => {
    if (e.key !== "Enter") return;
    const value = e.target.value.trim();
    if (!value) return;

    const matchOrder = tableData.find((item) => item.SALE_NO === value);

    if (matchOrder) {
      setSelectedOrder(matchOrder);
      fetchShelveData(matchOrder.SALE_NO);
    } else {
      setSelectedOrder(null);
    }
  };

  // =====處理右側貨架點擊=====
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

  // 確定按鈕叫車
  const handleConfirm = async () => {
    if (selectedShelve.length < 1 || selectedShelve.length > stations.length) {
      Alert({ title: `請選擇1~${stations.length}個貨架` });
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
        WAVENO: selectedOrder?.W_ID,
        GGROUP: "",
      }));
      console.log("task: ", tasks)

      const res = await insertShelfTask({ tasks });

      if (res.data.success) {
        const initialShelveStatus = {};
        selectedShelve.forEach((shelveId) => {
          initialShelveStatus[shelveId] = "loading";
        });

        // 更新所有相關站點的狀態
        selectedShelve.forEach((shelveId, index) => {
          const stationId = stations[index];
          dispatch(
            setShelfTransfer({
              station: stationId,
              step: 3,
              screen: "loading",
              mode: "order",
              orderCode: orderInput,
              selectedShelves: selectedShelve,
              shelveStatus: initialShelveStatus,
              shelveData: {},
            }),
          );
        });

        // 確保當前站點也更新
        const updatedStations = selectedShelve.map((_, index) => stations[index]);
        if (currentStationSafe && !updatedStations.includes(currentStationSafe)) {
          dispatch(
            setShelfTransfer({
              station: currentStationSafe,
              step: 3,
              screen: "loading",
              mode: "order",
              orderCode: orderInput,
              selectedShelves: selectedShelve,
              shelveStatus: initialShelveStatus,
              shelveData: {},
            }),
          );
        }

        setTableData((prev) => prev.filter((v) => v.SALE_NO !== orderInput));
      } else {
        Alert({ title: res?.data?.message || "派車失敗", icon: "error" });
      }
    } catch (error) {
      console.warn("handleConfirm:", error);
    }
  };

  // 檢查是否可以按確定(至少1個最多站點數量)
  const canConfirm = selectedShelve.length >= 1 && selectedShelve.length <= stations.length;

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
        {/* Table */}
        <div className="w-[47%] flex flex-col">
          <Table variant="green" type="checkbox" name="shelfTransferList" headers={headers} data={tableData} needInput={true} idKey="SALE_NO" checked={selectedOrder} onChange={handleRowClick} />
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
                      return (
                        <div key={shelveGroup.SHELVE_ID} onClick={() => handleShelveClick(shelveGroup)} className="py-1 cursor-pointer transition-all hover:shadow-lg">
                          <SchematicDiagram isSelected={isSelected}>
                            <div className="flex flex-col">
                              <div className="flex items-center justify-between gap-4 w-full">
                                <div className="whitespace-nowrap">貨架編號: {shelveGroup.SHELVE_ID}</div>
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
            {/* 確定按鈕 */}
            <div className="flex flex-1 flex-col justify-end items-center p-4">
              <ActionBtn icon="icon-check" text="確定" variant="orange" disabled={!canConfirm} onClick={handleConfirm} />
            </div>
          </div>
        </div>
      </div>
      {/* 站點 */}
      <div className="w-full flex justify-between gap-4 z-20">
        {stations.map((station) => (
          <ActionBtn text={station} variant="green" className="flex-1" disabled={false} />
        ))}
      </div>
    </>
  );
}
