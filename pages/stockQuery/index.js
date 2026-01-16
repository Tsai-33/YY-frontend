import React, { useState } from "react";
import PageHeader from "@/components/common/pageHeader/pageHeader";
import TextInput from "@/components/common/input/textInput";
import SelectInput from "@/components/common/input/selectInput";
import OnlyReadTable from "@/components/common/table/onlyReadTable";
import { searchStock, stockDownload } from "../api";
import Alert from "@/components/common/alert/alert";

export default function StockQuery() {
  const tableHeader = [
    { label: "產品品號", key: "PRT_NO", width: 265 },
    { label: "產品品名", key: "PRT_NAME", width: 370 },
    { label: "庫別", key: "STOCK_AREA", width: 100 },
    {
      label: "產品數量",
      key: "PP_NO",
      width: 200,
      render: (row) => row.PP_NO,
      renderDetail: (d) => d.TOTAL_PP_NO || "---",
    },
    { label: "單位", key: "UNIT", width: 100 },
    {
      label: "箱數",
      key: "BOX_NO",
      width: 100,
      render: (row) => row.BOX_NO,
      renderDetail: (d) => d.TOTAL_BOX_NO || "---",
    },
    { label: "訂單單號", key: "SALE_NO", width: 265 },
    {
      label: "入倉單號",
      key: "INSTOCK_NO",
      width: 265,
      hideInMain: true,
      renderDetail: (d) => d.INSTOCK_NO || "---",
    },
    { label: "出倉單號", key: "OUTSTOCK_NO", width: 265 },
    { label: "產品規格", key: "SPEC_DESC", width: 200 },
    { label: "異動日期", key: "BILL_TIME", width: 200 },
    { label: "訂單預交日", key: "WORK_TIME", width: 250 },
    { label: "每箱包數", key: "BOX_PACK", width: 200 },
    { label: "材積", key: "VOLUMN", width: 110 },
    { label: "貨號", key: "PRT_CODE", width: 235 },
    { label: "客戶代號", key: "CUS_NO", width: 200 },
    { label: "品號簡碼", key: "BRIFT_CODE", width: 200 },
    { label: "備註", key: "SEAL", width: 100 },
    { label: "貨架號碼", key: "SHELVE_ID", width: 200 },
  ];

  const [filters, setFilters] = useState({
    SALE_NO: "",
    PRT_NO: "",
    PRT_NAME: "",
    PRT_CODE: "",
    STOCK_AREA: "",
    BILL_TIME: "",
    WORK_TIME: "",
    SEAL: "",
    CUS_NO: "",
  });

  const [stockData, setStockData] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = async () => {
    const payload = {
      ...filters,
      BILL_TIME: filters.BILL_TIME
        ? Number(filters.BILL_TIME.replace(/-/g, ""))
        : null,
      WORK_TIME: filters.WORK_TIME
        ? Number(filters.WORK_TIME.replace(/-/g, ""))
        : null,
    };

    const res = await searchStock(payload);

    setHasSearched(true);

    if (res?.data?.success) {
      const data = res?.data?.data;
      setStockData(data);
    } else {
      Alert({ title: res?.error?.message });
    }
  };

  const handleDownload = async () => {
    const payload = {
      ...filters,
      BILL_TIME: filters.BILL_TIME
        ? Number(filters.BILL_TIME.replace(/-/g, ""))
        : null,
      WORK_TIME: filters.WORK_TIME
        ? Number(filters.WORK_TIME.replace(/-/g, ""))
        : null,
    };

    try {
      const res = await stockDownload(payload);
      if (res?.success) {
        const blob = res?.data;
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "庫存報表.xlsx"; // 檔案名稱
        document.body.appendChild(a);
        a.click();

        // 清除記憶體
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.warn("下載失敗", error);
      alert("下載失敗，請稍後再試");
    }
  };

  return (
    <>
      {/* 頂部區域 */}
      <PageHeader title="" backTo="/workspace" />
      {/* 主要內容區域 */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-5 gap-6">
            <TextInput
              label="訂單單號:"
              className=""
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
              label="產品/進貨日期:"
              type="date"
              value={filters.BILL_TIME}
              onChange={(e) => handleChange("BILL_TIME", e.target.value)}
              disabled={stockData.length > 0}
            />
            <SelectInput
              label="備註:"
              value={filters.SEAL}
              options={[
                { label: "封膜OK", value: 1 },
                { label: "護角OK", value: 2 },
              ]}
              onChange={(value) => handleChange("SEAL", value)}
              disabled={stockData.length > 0}
            />
          </div>
          <div className="grid grid-cols-5 gap-6 items-end">
            <TextInput
              label="產品品名:"
              value={filters.PRT_NAME}
              onChange={(e) => handleChange("PRT_NAME", e.target.value)}
              disabled={stockData.length > 0}
            />
            <TextInput
              label="貨號:"
              value={filters.PRT_CODE}
              onChange={(e) => handleChange("PRT_CODE", e.target.value)}
              disabled={stockData.length > 0}
            />
            <TextInput
              label="客戶代號:"
              value={filters.CUS_NO}
              onChange={(e) => handleChange("CUS_NO", e.target.value)}
              disabled={stockData.length > 0}
            />
            <TextInput
              label="訂單預交日:"
              type="date"
              value={filters.WORK_TIME}
              onChange={(e) => handleChange("WORK_TIME", e.target.value)}
              disabled={stockData.length > 0}
            />

            <div className="flex justify-end gap-3">
              <button
                className={`px-4 py-2 bg-green-600 text-white rounded-md text-lg font-bold ${
                  stockData.length > 0 ? "cursor-pointer" : "cursor-not-allowed"
                }`}
                onClick={handleDownload}
                disabled={stockData.length === 0}>
                下載
              </button>
              <button
                className="px-4 py-2 bg-gray-400 text-white rounded-md text-lg font-bold cursor-pointer"
                onClick={() => {
                  setFilters({
                    SALE_NO: "",
                    PRT_NO: "",
                    PRT_NAME: "",
                    PRT_CODE: "",
                    STOCK_AREA: "",
                    BILL_TIME: "",
                    WORK_TIME: "",
                    SEAL: "",
                    CUS_NO: "",
                  });
                  setStockData([]);
                  setHasSearched(false);
                }}>
                清除
              </button>
              <button
                className={`px-4 py-2 bg-blue-600 text-white rounded-md text-lg font-bold ${
                  stockData.length > 0 ? "cursor-not-allowed" : "cursor-pointer"
                }`}
                onClick={handleSearch}
                disabled={stockData.length > 0}>
                查詢
              </button>
            </div>
          </div>
        </div>
        <div>
          <OnlyReadTable
            headers={tableHeader}
            data={stockData}
            type="radio"
            name="stockQuery"
            variants="green"
            idKey="INDEX"
            height="67vh"
            hasSearched={hasSearched}
          />
        </div>
      </div>
    </>
  );
}
