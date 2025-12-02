import React, { useState } from "react";
import PageHeader from "@/components/common/pageHeader/pageHeader";
import TextInput from "@/components/common/input/textInput";
import SelectInput from "@/components/common/input/selectInput";
import OnlyReadTable from "@/components/common/table/onlyReadTable";
import { searchStock } from "../api";

export default function StockQuery() {
  const tableHeader = [
    { label: "入倉單號", key: "INSTOCK_NO", width: 200 },
    { label: "訂單單號", key: "SALE_NO", width: 200 },
    { label: "出倉單號", key: "OUTSTOCK_NO", width: 200 },
    { label: "產品品號", key: "PRT_NO", width: 200 },
    { label: "產品品名", key: "PRT_NAME", width: 200 },
    { label: "產品規格", key: "SPEC_DESC", width: 200 },
    { label: "庫別", key: "STOCK_AREA", width: 100 },
    { label: "異動日期", key: "BILL_TIME", width: 200 },
    { label: "訂單預交日", key: "WORK_TIME", width: 250 },
    { label: "出入倉別", key: "SHIP_TYPE", width: 200 },
    { label: "產品數量", key: "PP_NO", width: 200 },
    { label: "單位", key: "UNIT", width: 100 },
    { label: "箱數", key: "BOX_NO", width: 100 },
    { label: "每箱包數", key: "BOX_PACK", width: 200 },
    { label: "材積", key: "VOLUMN", width: 100 },
    { label: "貨號", key: "PRT_CODE", width: 100 },
    { label: "客戶代號", key: "CUS_NO", width: 200 },
    { label: "產品簡碼", key: "BRIFT_CODE", width: 200 },
    { label: "備註", key: "SEAL", width: 100 },
  ];

  const mockData = [
    // {
    //   INDEX: 1,
    //   MAKE_NO: "M510-11411220068-0001",
    //   OUTSTOCK_NO: "",
    //   PRT_NO: "Y01TSL090910YT",
    //   STOCK_AREA: "F01",
    //   BAR_CODE: "2025-11-20",
    //   PP_NO: 20,
    //   BOX_NO: 1,
    //   VOLUMN: "3.128",
    //   PRT_CODE: "C-78541",
    //   PRT_NAME: "本色束帶,100條/包,20包/箱",
    //   CUS_NO: "0813008",
    //   REMARK: "急件",
    //   BRIFT_CODE: "YT090910",
    //   SPEC_DESC: "8.7*920mm",
    // },
    // {
    //   INDEX: 2,
    //   MAKE_NO: "M510-11411220068-0001",
    //   OUTSTOCK_NO: "",
    //   PRT_NO: "Y01TSL090910YT",
    //   STOCK_AREA: "F01",
    //   BAR_CODE: "2025-11-20",
    //   PP_NO: 20,
    //   BOX_NO: 1,
    //   VOLUMN: "3.128",
    //   PRT_CODE: "C-78541",
    //   PRT_NAME: "本色束帶,100條/包,20包/箱",
    //   CUS_NO: "0813008",
    //   REMARK: "急件",
    //   BRIFT_CODE: "YT090910",
    //   SPEC_DESC: "8.7*920mm",
    // },
    // {
    //   INDEX: 3,
    //   MAKE_NO: "M510-11411220068-0001",
    //   OUTSTOCK_NO: "",
    //   PRT_NO: "Y01TSL090910YT",
    //   STOCK_AREA: "F01",
    //   BAR_CODE: "2025-11-20",
    //   PP_NO: 20,
    //   BOX_NO: 1,
    //   VOLUMN: "3.128",
    //   PRT_CODE: "C-78541",
    //   PRT_NAME: "本色束帶,100條/包,20包/箱",
    //   CUS_NO: "0813008",
    //   REMARK: "急件",
    //   BRIFT_CODE: "YT090910",
    //   SPEC_DESC: "8.7*920mm",
    // },
    // {
    //   INDEX: 4,
    //   MAKE_NO: "M510-11411220068-0001",
    //   OUTSTOCK_NO: "",
    //   PRT_NO: "Y01TSL090910YT",
    //   STOCK_AREA: "F01",
    //   BAR_CODE: "2025-11-20",
    //   PP_NO: 20,
    //   BOX_NO: 1,
    //   VOLUMN: "3.128",
    //   PRT_CODE: "C-78541",
    //   PRT_NAME: "本色束帶,100條/包,20包/箱",
    //   CUS_NO: "0813008",
    //   REMARK: "急件",
    //   BRIFT_CODE: "YT090910",
    //   SPEC_DESC: "8.7*920mm",
    // },
    // {
    //   INDEX: 5,
    //   MAKE_NO: "M510-11411220068-0001",
    //   OUTSTOCK_NO: "",
    //   PRT_NO: "Y01TSL090910YT",
    //   STOCK_AREA: "F01",
    //   BAR_CODE: "2025-11-20",
    //   PP_NO: 20,
    //   BOX_NO: 1,
    //   VOLUMN: "3.128",
    //   PRT_CODE: "C-78541",
    //   PRT_NAME: "本色束帶,100條/包,20包/箱",
    //   CUS_NO: "0813008",
    //   REMARK: "急件",
    //   BRIFT_CODE: "YT090910",
    //   SPEC_DESC: "8.7*920mm",
    // },
    // {
    //   INDEX: 6,
    //   MAKE_NO: "M510-11411220068-0001",
    //   OUTSTOCK_NO: "",
    //   PRT_NO: "Y01TSL090910YT",
    //   STOCK_AREA: "F01",
    //   BAR_CODE: "2025-11-20",
    //   PP_NO: 20,
    //   BOX_NO: 1,
    //   VOLUMN: "3.128",
    //   PRT_CODE: "C-78541",
    //   PRT_NAME: "本色束帶,100條/包,20包/箱",
    //   CUS_NO: "0813008",
    //   REMARK: "急件",
    //   BRIFT_CODE: "YT090910",
    //   SPEC_DESC: "8.7*920mm",
    // },
    // {
    //   INDEX: 7,
    //   MAKE_NO: "M510-11411220068-0001",
    //   OUTSTOCK_NO: "",
    //   PRT_NO: "Y01TSL090910YT",
    //   STOCK_AREA: "F01",
    //   BAR_CODE: "2025-11-20",
    //   PP_NO: 20,
    //   BOX_NO: 1,
    //   VOLUMN: "3.128",
    //   PRT_CODE: "C-78541",
    //   PRT_NAME: "本色束帶,100條/包,20包/箱",
    //   CUS_NO: "0813008",
    //   REMARK: "急件",
    //   BRIFT_CODE: "YT090910",
    //   SPEC_DESC: "8.7*920mm",
    // },
    // {
    //   INDEX: 8,
    //   MAKE_NO: "M510-11411220068-0001",
    //   OUTSTOCK_NO: "",
    //   PRT_NO: "Y01TSL090910YT",
    //   STOCK_AREA: "F01",
    //   BAR_CODE: "2025-11-20",
    //   PP_NO: 20,
    //   BOX_NO: 1,
    //   VOLUMN: "3.128",
    //   PRT_CODE: "C-78541",
    //   PRT_NAME: "本色束帶,100條/包,20包/箱",
    //   CUS_NO: "0813008",
    //   REMARK: "急件",
    //   BRIFT_CODE: "YT090910",
    //   SPEC_DESC: "8.7*920mm",
    // },
    // {
    //   INDEX: 9,
    //   MAKE_NO: "M510-11411220068-0001",
    //   OUTSTOCK_NO: "",
    //   PRT_NO: "Y01TSL090910YT",
    //   STOCK_AREA: "F01",
    //   BAR_CODE: "2025-11-20",
    //   PP_NO: 20,
    //   BOX_NO: 1,
    //   VOLUMN: "3.128",
    //   PRT_CODE: "C-78541",
    //   PRT_NAME: "本色束帶,100條/包,20包/箱",
    //   CUS_NO: "0813008",
    //   REMARK: "急件",
    //   BRIFT_CODE: "YT090910",
    //   SPEC_DESC: "8.7*920mm",
    // },
    // {
    //   INDEX: 10,
    //   MAKE_NO: "M510-11411220068-0001",
    //   OUTSTOCK_NO: "",
    //   PRT_NO: "Y01TSL090910YT",
    //   STOCK_AREA: "F01",
    //   BAR_CODE: "2025-11-20",
    //   PP_NO: 20,
    //   BOX_NO: 1,
    //   VOLUMN: "3.128",
    //   PRT_CODE: "C-78541",
    //   PRT_NAME: "本色束帶,100條/包,20包/箱",
    //   CUS_NO: "0813008",
    //   REMARK: "急件",
    //   BRIFT_CODE: "YT090910",
    //   SPEC_DESC: "8.7*920mm",
    // },
    // {
    //   INDEX: 11,
    //   MAKE_NO: "M510-11411220068-0001",
    //   OUTSTOCK_NO: "",
    //   PRT_NO: "Y01TSL090910YT",
    //   STOCK_AREA: "F01",
    //   BAR_CODE: "2025-11-20",
    //   PP_NO: 20,
    //   BOX_NO: 1,
    //   VOLUMN: "3.128",
    //   PRT_CODE: "C-78541",
    //   PRT_NAME: "本色束帶,100條/包,20包/箱",
    //   CUS_NO: "0813008",
    //   REMARK: "急件",
    //   BRIFT_CODE: "YT090910",
    //   SPEC_DESC: "8.7*920mm",
    // },
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
    if (res.data.success) {
      const data = res.data.data;
      setStockData(data);
    }
  };

  return (
    <>
      {/* 頂部區域 */}
      <PageHeader title="" backTo="/workspace" />
      {/* 主要內容區域 */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-5 gap-6">
            <TextInput
              label="訂單單號:"
              className=""
              value={filters.SALE_NO}
              onChange={(e) => handleChange("SALE_NO", e.target.value)}
            />
            <TextInput
              label="產品品號:"
              value={filters.PRT_NO}
              onChange={(e) => handleChange("PRT_NO", e.target.value)}
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
            />
            <TextInput
              label="產品/進貨日期:"
              type="date"
              value={filters.BILL_TIME}
              onChange={(e) => handleChange("BILL_TIME", e.target.value)}
            />
            <SelectInput
              label="備註:"
              value={filters.SEAL}
              options={[
                { label: "封膜OK", value: 1 },
                { label: "護角OK", value: 2 },
              ]}
              onChange={(value) => handleChange("SEAL", value)}
            />
          </div>
          <div className="grid grid-cols-5 gap-6 items-end">
            <TextInput
              label="產品品名:"
              value={filters.PRT_NAME}
              onChange={(e) => handleChange("PRT_NAME", e.target.value)}
            />
            <TextInput
              label="貨號:"
              value={filters.PRT_CODE}
              onChange={(e) => handleChange("PRT_CODE", e.target.value)}
            />
            <TextInput
              label="客戶代號:"
              value={filters.CUS_NO}
              onChange={(e) => handleChange("CUS_NO", e.target.value)}
            />
            <TextInput
              label="訂單預交日:"
              type="date"
              value={filters.WORK_TIME}
              onChange={(e) => handleChange("WORK_TIME", e.target.value)}
            />

            <div className="flex gap-3">
              <button
                className="px-4 py-2 bg-gray-400 text-white rounded-md text-lg font-bold"
                onClick={() =>
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
                  })
                }>
                清除
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-lg font-bold"
                onClick={handleSearch}>
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
          />
        </div>
      </div>
    </>
  );
}
