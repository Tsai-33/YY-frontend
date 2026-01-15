import React, { useState, useEffect } from "react";
import { getMapNode, updateMapLayout } from "@/pages/api";
import Swal from "sweetalert2";
import Map from "@/components/stockAreaTest/map";
import PageHeader from "@/components/common/pageHeader/pageHeader";
import WarehouseList from "@/components/stockAreaTest/warehouseList";

export default function StockAreaTest() {
  // 地圖貨架資料
  const [shelvesMapData, setShelvesMapData] = useState([]);
  const [loading, setLoading] = useState(false);
  // 目前選中的操作目標 (例如: 'F01', 'F02'...)
  const [activeWh, setActiveWh] = useState(null);
  // 是否開啟橡皮擦模式
  const [isEraserMode, setIsEraserMode] = useState(false);
  // 所有的點位分配資料 { "NODE_CODE": "WAREHOUSE_ID" }
  const [nodeAssignments, setNodeAssignments] = useState({});

  // 載入資料
  const fetchData = async () => {
    try {
      setLoading(true);

      // 取得所有貨架地圖資料
      const shelvesRes = await getMapNode();
      // console.log("shelvesRes.data:", shelvesRes.data.data);
      if (shelvesRes.data.success && shelvesRes.data.data) {
        setShelvesMapData(shelvesRes.data.data);

        const savedAssignments = {};
        shelvesRes.data.data.forEach((item) => {
          if (item.STOCK_AREA) {
            savedAssignments[item.NODE_CODE] = item.STOCK_AREA;
          }
        });
        setNodeAssignments(savedAssignments);
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

  useEffect(() => {
    fetchData();
  }, []);

  // 處理確定按鈕
  const handleConfirm = async () => {
    try {
      setLoading(true);

      const payloadData = Object.entries(nodeAssignments).map(
        ([nodeCode, whId]) => ({
          node_code: nodeCode,
          warehouse_id: whId,
        })
      );

      const payload = { map_id: "4", data: payloadData };
      // console.log("payload:", payload);
      const res = await updateMapLayout(payload);
      console.log("res:", res.data);

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
    <>
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-700">載入中...</p>
          </div>
        </div>
      )}

      {/* 頂部區域 */}
      <PageHeader title="" backTo="/workspace" />

      <div className="flex-1 flex gap-4 items-stretch min-h-0">
        {/* 左側 - 倉別配置表格 */}
        <div className="w-[30%] flex flex-col h-[81vh]">
          <WarehouseList
            activeWh={activeWh}
            setActiveWh={(id) => {
              setActiveWh(id);
              setIsEraserMode(false); // 切換倉別時自動關閉橡皮擦
            }}
            isEraserMode={isEraserMode}
            setIsEraserMode={setIsEraserMode}
            nodeAssignments={nodeAssignments}
          />
        </div>
        {/* 右側 - 倉庫地圖 */}
        <div className="w-[70%] flex-1 flex flex-col gap-2 min-h-0">
          <Map
            shelvesData={shelvesMapData}
            activeWh={activeWh}
            isEraserMode={isEraserMode}
            nodeAssignments={nodeAssignments}
            setNodeAssignments={setNodeAssignments}
            handleConfirm={handleConfirm}
          />
        </div>
      </div>
    </>
  );
}
