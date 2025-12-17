import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setInventory, setPage } from "@/redux/reducer/reducerInventory";
import ActionBtn from "@/components/common/btns/actionBtn";
import PageHeader from "@/components/common/pageHeader/pageHeader";
import TextInput from "@/components/common/input/textInput";
import SelectInput from "@/components/common/input/selectInput";
import OnlyReadTable from "@/components/common/table/onlyReadTable";
import { getInventoryItems, createInventoryTask } from "../../pages/api";

export default function InventoryTable() {
  const dispatch = useDispatch();
  const { stations, currentJob } = useSelector((s) => s.workstation);

  const tableHeader = [
    { label: "序號", key: "INDEX", width: 150 },
    { label: "產品品號", key: "PRT_NO", width: 300 },
    { label: "產品數量", key: "PP_NO", width: 220 },
    { label: "單位", key: "UNIT", width: 140 },
    { label: "訂單/工單", key: "SALE_NO", width: 435 },
    { label: "入庫庫別", key: "STOCK_AREA", width: 200 },
    { label: "客戶代號", key: "CUS_NO", width: 250 },
    { label: "貨架號", key: "SHELVE_ID", width: 190 },
  ];

  const [filters, setFilters] = useState({
    STOCK_AREA: "",
    SALE_NO: "",
    PRT_NO: "",
    CUS_NO: "",
  });

  const [stockData, setStockData] = useState([]);

  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = async () => {
    if (!filters.STOCK_AREA) {
      alert("請先選擇入庫庫別！");
      return;
    }

    const payload = {
      ...filters,
    };
    try {
      const res = await getInventoryItems(payload);
      if (res.data.success) {
        const data = res.data.data;
        console.log("data:", data);

        dispatch(
          setInventory({
            station: "*",
            data: {
              filter: {
                stockArea: payload.STOCK_AREA,
                cusNo: payload.CUS_NO,
                saleNo: payload.SALE_NO,
                prtNo: payload.PRT_NO,
              },
            },
          })
        );

        setStockData(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleComfirm = async () => {
    if (!stockData || stockData.length === 0) return;

    const uniqueShelves = [...new Set(stockData.map((item) => item.SHELVE_ID))];

    const payload = {
      currentJob: currentJob,
      shelves: uniqueShelves,
      stations: stations,
    };

    console.log("payload:", payload);
    try {
      const res = await createInventoryTask(payload);
      if (res.data.success) {
        // console.log("成功送出資料:", payload);
        dispatch(setPage("inventory-shelf"));
        dispatch(setBatchNo(res.data.data.batchNo));
        dispatch(
          setInventory({
            station: "*",
            data: { screen: "loading" },
          })
        );
      }
    } catch (error) {
      console.error(error);
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
        <div className="flex justify-between">
          <div className="flex gap-10">
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
              label="訂單/工單單號:"
              value={filters.SALE_NO}
              onChange={(e) => handleChange("SALE_NO", e.target.value)}
            />
            <TextInput
              label="產品品號:"
              value={filters.PRT_NO}
              onChange={(e) => handleChange("PRT_NO", e.target.value)}
            />
            <TextInput
              label="客戶代號:"
              value={filters.CUS_NO}
              onChange={(e) => handleChange("CUS_NO", e.target.value)}
            />
          </div>
          <button
            className="px-4 py-2 bg-gray-400 text-white rounded-md text-lg font-bold"
            onClick={() => {
              setFilters({
                STOCK_AREA: "",
                SALE_NO: "",
                PRT_NO: "",
                CUS_NO: "",
              });
              setStockData([]);
              dispatch(
                setInventory({
                  station: "*",
                  data: { prtNo: "" },
                })
              );
            }}>
            清除
          </button>
        </div>
        <div>
          <OnlyReadTable
            headers={tableHeader}
            data={stockData || []}
            type="radio"
            name="stockQuery"
            variants="green"
            idKey="INDEX"
          />
        </div>
      </div>
      {/* 底部按鈕區域 */}
      <div className="w-full flex justify-center">
        <ActionBtn
          text={stockData.length === 0 ? "檢視" : "確定"}
          variant={stockData.length === 0 ? "darkBlue" : "orange"}
          onClick={stockData.length === 0 ? handleSearch : handleComfirm}
        />
      </div>
    </>
  );
}
