import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import WarehouseTable from "@/components/warehousePlan/warehouseTable";
import WarehouseMap from "@/components/warehousePlan/warehouseMap";
import ActionBtn from "@/components/common/btns/actionBtn";
import { getWarehouses, getAllShelvesMap, updateWarehouses } from "@/pages/api";
import Swal from "sweetalert2";

export default function WarehousePlanIndex() {
  const router = useRouter();

  // 初始化倉別資料
  const [warehouseData, setWarehouseData] = useState([
    { id: "F01", name: "F01", description: "外銷成品倉", totalShelves: "0", locationStart: "0", locationEnd: "0" },
    { id: "F02", name: "F02", description: "外銷訂單倉", totalShelves: "0", locationStart: "0", locationEnd: "0" },
    { id: "F03", name: "F03", description: "貿易倉", totalShelves: "0", locationStart: "0", locationEnd: "0" },
    { id: "F09", name: "F09", description: "待驗收倉", totalShelves: "0", locationStart: "0", locationEnd: "0" },
    { id: "D01", name: "D01", description: "成品倉", totalShelves: "0", locationStart: "0", locationEnd: "0" },
    { id: "D02", name: "D02", description: "成品2倉", totalShelves: "0", locationStart: "0", locationEnd: "0" },
    { id: "D05", name: "D05", description: "成品3倉", totalShelves: "0", locationStart: "0", locationEnd: "0" },
    { id: "D09", name: "D09", description: "不良品倉", totalShelves: "0", locationStart: "0", locationEnd: "0" },
    { id: "M01", name: "M01", description: "物料倉", totalShelves: "0", locationStart: "0", locationEnd: "0" },
    { id: "M02", name: "M02", description: "原料倉", totalShelves: "0", locationStart: "0", locationEnd: "0" },
  ]);

  // 地圖貨架資料
  const [shelvesMapData, setShelvesMapData] = useState([]);
  const [loading, setLoading] = useState(false);

  // 載入資料
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 取得倉別資料
      const warehousesRes = await getWarehouses();
      if (warehousesRes.data.success && warehousesRes.data.data) {
        setWarehouseData(warehousesRes.data.data);
      }

      // 取得所有貨架地圖資料
      const shelvesRes = await getAllShelvesMap();
      if (shelvesRes.data.success && shelvesRes.data.data) {

        setShelvesMapData(shelvesRes.data.data);
      }
    } catch (error) {
      console.error("載入資料失敗:", error);
      Swal.fire({
        icon: "error",
        title: "載入失敗",
        text: "無法載入倉別資料，請稍後再試",
      });
    } finally {
      setLoading(false);
    }
  };

  // 處理輸入變更
  const handleInputChange = (id, field, value) => {
    setWarehouseData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // 處理確定按鈕
  const handleConfirm = async () => {
    try {
      setLoading(true);

      const res = await updateWarehouses(warehouseData);

      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "更新成功",
          text: "倉別配置已更新",
          timer: 1500,
          showConfirmButton: false,
        });

        // 重新載入資料
        await fetchData();
      }
    } catch (error) {
      console.error("更新失敗:", error);
      Swal.fire({
        icon: "error",
        title: "更新失敗",
        text: error.response?.data?.message || "無法更新倉別配置，請稍後再試",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-700">載入中...</p>
          </div>
        </div>
      )}

      <div className="flex flex-1 gap-4 px-2 py-4 min-h-0">
        {/* 左側 - 倉別配置表格 */}
        <div className="col-span-4 flex flex-col min-h-0">
          <WarehouseTable
            warehouseData={warehouseData}
            onInputChange={handleInputChange}
            onConfirm={handleConfirm}
          />
        </div>
        {/* 右側 - 倉庫地圖 */}
        <div className="col-span-8 flex flex-col min-h-0 min-w-0">
          {/* 上傳按鈕 */}
          <div className="mb-2 flex justify-end flex-shrink-0">
            <ActionBtn
              icon="icon-upload"
              text="上傳地圖資料"
              variant="blue"
              onClick={() => router.push("/warehousePlan/uploadMap")}
            />
          </div>
          <WarehouseMap shelvesData={shelvesMapData} />
        </div>
      </div>
    </div>
  );
}