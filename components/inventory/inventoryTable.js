import React, { useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setInventory,
  setPage,
  setBatchNo,
} from "@/redux/reducer/reducerInventory";
import { getInventoryItems, createInventoryTask } from "../../pages/api";
import PageHeader from "@/components/common/pageHeader/pageHeader";
import TextInput from "@/components/common/input/textInput";
import SelectInput from "@/components/common/input/selectInput";
import DateInput from "../common/input/dateInput";
import CheckInput from "../common/input/checkInput";
import Modal from "../common/modal/modal";
import ReadTable from "./readTable";
import Swal from "sweetalert2";

export default function InventoryTable() {
  const dispatch = useDispatch();
  const { stations, currentJob } = useSelector((s) => s.workstation);

  const tableHeader = [
    { label: "序號", key: "INDEX", width: 110 },
    { label: "產品品號", key: "PRT_NO", width: 300 },
    { label: "產品數量", key: "PP_NO", width: 170 },
    { label: "單位", key: "UNIT", width: 120 },
    { label: "訂單/工單", key: "SALE_NO", width: 300 },
    { label: "入庫庫別", key: "STOCK_AREA", width: 150 },
    { label: "客戶代號", key: "CUS_NO", width: 250 },
    { label: "貨架號", key: "SHELVE_ID", width: 160 },
    {
      label: "盤點時間",
      key: "CHECK_TIME",
      width: 325,
      render: (row) => formatRawSQLDateTime(row.CHECK_TIME),
    },
  ];

  const [filters, setFilters] = useState({
    STOCK_AREA: "",
    SALE_NO: "",
    PRT_NO: "",
    CUS_NO: "",
    CHECK_TIME_START: "",
    CHECK_TIME_END: "",
    HAS_EXCEPTION: false,
  });

  const [stockData, setStockData] = useState([]);
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [tempTime, setTempTime] = useState({
    start: filters.CHECK_TIME_START,
    end: filters.CHECK_TIME_END,
  });

  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  function formatDate(dateStr) {
    if (!dateStr) return "";

    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${y}/${m}/${day}`;
  }

  function formatRawSQLDateTime(dateTime) {
    if (!dateTime) return "";
    // 如果已經是 Date 物件，轉成 ISO 字串後再裁切掉 T/Z
    if (dateTime instanceof Date) {
      return dateTime
        .toISOString()
        .replace("T", " ")
        .replace("Z", "")
        .slice(0, 19);
    }

    // 如果是字串，就直接處理
    if (typeof dateTime === "string") {
      return dateTime.replace("T", " ").replace("Z", "").slice(0, 19);
    }
  }

  const timeRangeText = useMemo(() => {
    const { CHECK_TIME_START, CHECK_TIME_END } = filters;

    if (!CHECK_TIME_START && !CHECK_TIME_END) return "請選擇時間";

    if (CHECK_TIME_START && CHECK_TIME_END)
      return `排除${formatDate(CHECK_TIME_START)}~${formatDate(
        CHECK_TIME_END
      )}之中的資料`;

    if (CHECK_TIME_START)
      return `排除 ${formatDate(CHECK_TIME_START)} 之後的資料`;

    return `排除 ${formatDate(CHECK_TIME_END)} 之前的資料`;
  }, [filters]);

  // ============================
  // ⭐ 輸入篩選條件，進行搜尋
  // ============================
  const handleSearch = async () => {
    if (!filters.STOCK_AREA) {
      Swal.fire("請先選擇入庫庫別！");
      return;
    }

    const payload = {
      STOCK_AREA: filters.STOCK_AREA,
      SALE_NO: filters.SALE_NO,
      PRT_NO: filters.PRT_NO,
      CUS_NO: filters.CUS_NO,
      CHECK_TIME_START: filters.CHECK_TIME_START,
      CHECK_TIME_END: filters.CHECK_TIME_END,
      ...(filters.HAS_EXCEPTION && { HAS_EXCEPTION: true }),
    };

    try {
      const res = await getInventoryItems(payload);
      if (res?.data?.success) {
        const data = res?.data?.data;

        dispatch(
          setInventory({
            station: "*",
            data: {
              filter: {
                stockArea: payload.STOCK_AREA,
                cusNo: payload.CUS_NO,
                saleNo: payload.SALE_NO,
                prtNo: payload.PRT_NO,
                hasException: payload.HAS_EXCEPTION,
              },
            },
          })
        );

        setStockData(data);
      }
    } catch (error) {
      console.warn(error);
    }
  };

  // ============================
  // ⭐ 檢視篩選條件，確定盤點
  // ============================
  const handleComfirm = async () => {
    if (!stockData || stockData.length === 0) return;

    const uniqueShelves = [...new Set(stockData.map((item) => item.SHELVE_ID))];

    const payload = {
      currentJob: currentJob,
      shelves: uniqueShelves,
      stations: stations,
    };

    try {
      const res = await createInventoryTask(payload);
      if (res?.data?.success) {
        dispatch(setPage("inventory-shelf"));
        dispatch(setBatchNo(res?.data?.data?.batchNo));
        dispatch(
          setInventory({
            station: "*",
            data: { screen: "loading" },
          })
        );
      }
    } catch (error) {
      console.warn(error);
    }
  };
  return (
    <>
      {/* 頂部區域 */}
      {stockData?.length === 0 ? (
        <PageHeader
          title="請輸入下方盤點參數查詢盤點貨架，輸入完請點擊檢視按鈕"
          backTo="/workspace"
        />
      ) : (
        <PageHeader title="請選擇盤點方式" backTo="/workspace" />
      )}

      {/* 主要內容區域 */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-10">
            <SelectInput
              label="入庫庫別:"
              value={filters.STOCK_AREA}
              options={[
                { label: "F01 (外銷成品倉)", value: "F01" },
                { label: "F02 (外銷訂單倉)", value: "F02" },
                { label: "F03 (貿易倉)", value: "F03" },
                { label: "F09(待驗收倉)", value: "F09" },
                { label: "D01 (成品倉)", value: "D01" },
                { label: "D02 (成品2倉)", value: "D02" },
                { label: "D05 (成品3倉)", value: "D05" },
                { label: "D09(不良品倉)", value: "D09" },
                { label: "M01(物料倉)", value: "M01" },
                { label: "M02(原料倉)", value: "M02" },
              ]}
              onChange={(value) => handleChange("STOCK_AREA", value)}
              disabled={stockData.length > 0}
            />
            <TextInput
              label="訂單/工單單號:"
              value={filters.SALE_NO}
              onChange={(e) => handleChange("SALE_NO", e.target.value)}
              disabled={stockData.length > 0}
            />
            <TextInput
              label="產品品號:"
              value={filters.PRT_NO}
              onChange={(e) => handleChange("PRT_NO", e.target.value)}
              disabled={stockData.length > 0}
            />
            <TextInput
              label="客戶代號:"
              value={filters.CUS_NO}
              onChange={(e) => handleChange("CUS_NO", e.target.value)}
              disabled={stockData.length > 0}
            />
          </div>
          <div className="grid grid-cols-3 gap-10 items-center">
            <DateInput
              label="時間區間："
              onClick={() => setTimeModalOpen(true)}
              timeRangeText={timeRangeText}
              disabled={stockData.length > 0}
            />
            <CheckInput
              label={"標註異常資料"}
              onChange={(e) => handleChange("HAS_EXCEPTION", e.target.checked)}
              checked={filters.HAS_EXCEPTION}
              disabled={stockData.length > 0}
            />
            <div className="flex gap-5 justify-end">
              <button
                className="px-4 py-2 bg-gray-400 text-white rounded-md text-lg font-bold cursor-pointer"
                onClick={() => {
                  setFilters({
                    STOCK_AREA: "",
                    SALE_NO: "",
                    PRT_NO: "",
                    CUS_NO: "",
                    HAS_EXCEPTION: 0,
                  });
                  setTempTime({ start: "", end: "" });
                  setStockData([]);
                  dispatch(
                    setInventory({
                      station: "*",
                      data: { prtNo: "", stockArea: "", cusNo: "", saleNo: "" },
                    })
                  );
                }}>
                清除
              </button>
              <button
                className={`px-4 py-2 ${
                  stockData.length === 0 ? "bg-blue-600" : "bg-orange-600"
                }  text-white rounded-md text-lg font-bold cursor-pointer`}
                onClick={stockData.length === 0 ? handleSearch : handleComfirm}>
                {stockData.length === 0 ? "查詢" : "確定"}
              </button>
            </div>
          </div>
        </div>
        <div>
          <ReadTable
            headers={tableHeader}
            data={stockData || []}
            type="radio"
            name="stockQuery"
            variants="green"
            idKey="INDEX"
          />
        </div>
      </div>

      <Modal
        showModal={timeModalOpen}
        title="時間區間"
        onClose={() => setTimeModalOpen(false)}
        onConfirm={() => {
          setFilters((prev) => ({
            ...prev,
            CHECK_TIME_START: formatRawSQLDateTime(tempTime.start),
            CHECK_TIME_END: formatRawSQLDateTime(tempTime.end),
          }));
          setTimeModalOpen(false);
        }}
        width={`35vw`}
        height={`40vh`}>
        <div className="flex flex-col items-center gap-2.5">
          <div className="text-(length:--font-size-4xl) font-bold text-[#000E19]">
            請輸入排除盤點紀錄時間區間
          </div>
          <div className="flex items-center gap-6 w-full text-[#000E19] ">
            {/* 起始時間 */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-(length:--font-size-xl) font-bold">
                起始時間
              </label>
              <input
                type="datetime-local"
                title="起始時間"
                value={tempTime.start || ""}
                onChange={(e) =>
                  setTempTime((t) => ({ ...t, start: e.target.value }))
                }
                className="border rounded px-3 py-2 bg-[#878787] text-white border-[#878787] focus:outline-none focus:ring-2 focus:ring-white/40"
              />
            </div>
            <div className="text-(length:--font-size-4xl) font-bold">~</div>
            {/* 結束時間 */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-(length:--font-size-xl) font-bold">
                結束時間
              </label>
              <input
                type="datetime-local"
                value={tempTime.end || ""}
                onChange={(e) =>
                  setTempTime((t) => ({ ...t, end: e.target.value }))
                }
                className="border rounded px-3 py-2 bg-[#878787] text-white border-[#878787] focus:outline-none focus:ring-2 focus:ring-white/40"
              />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
