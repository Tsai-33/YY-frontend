import React from "react";
import ActionBtn from "@/components/common/btns/actionBtn";
import InputFrame from "@/components/common/input/inputFrame";

export default function WarehouseTable({ warehouseData, onInputChange, onConfirm }) {
  // 定義每個倉別的顏色 (根據圖片中的顏色)
  const getWarehouseColor = (id) => {
    const colorMap = {
      F01: "text-black", // 預設黑色
      F02: "text-red-600", // 紅色
      F03: "text-yellow-500", // 黃色
      F09: "text-purple-600", // 紫色
      D01: "text-blue-600", // 藍色
      D02: "text-orange-500", // 橘色/淺紅色
      D05: "text-green-600", // 綠色
      D09: "text-teal-600", // 深藍/青綠色
      M01: "text-green-800", // 深綠色
      M02: "text-green-400", // 淺綠色
    };
    return colorMap[id] || "text-black";
  };

  // 處理輸入變更
  const handleInputChange = (id, field, value) => {
    if (onInputChange) {
      onInputChange(id, field, value);
    }
  };

  return (
    <div className="bg-white p-4 flex flex-col flex-1 rounded-lg shadow-sm">
      {/* 表格 */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-black font-bold border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="px-4 py-3 text-center border-b border-gray-300 font-bold">倉別</th>
              <th className="px-4 py-3 text-center border-b border-gray-300 font-bold">貨架總數</th>
              <th className="px-4 py-3 text-center border-b border-gray-300 font-bold">位置區間</th>
            </tr>
          </thead>
          <tbody>
            {warehouseData.map((item, index) => (
              <tr 
                key={item.id} 
                className={`border-b border-gray-200 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                {/* 倉別欄位 */}
                <td className="px-4 py-3 text-left">
                  <div className="flex flex-col">
                    <span className={`font-bold text-base ${getWarehouseColor(item.id)}`}>
                      {item.name} ({item.description})
                    </span>
                  </div>
                </td>
                {/* 貨架總數欄位 */}
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center">
                    <InputFrame
                      type="number"
                      name={`totalShelves-${item.id}`}
                      value={item.totalShelves}
                      onChange={(e) => handleInputChange(item.id, "totalShelves", e.target.value)}
                      className="w-20 text-center !bg-white !border-gray-300 border rounded px-2 py-1"
                      inputMode="numeric"
                      borderColor="#d1d5db"
                    />
                  </div>
                </td>
                {/* 位置區間欄位 */}
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <InputFrame
                      type="text"
                      name={`locationStart-${item.id}`}
                      value={item.locationStart}
                      onChange={(e) => handleInputChange(item.id, "locationStart", e.target.value)}
                      className="w-24 text-center !bg-white !border-gray-300 border rounded px-2 py-1"
                      placeholder="起始"
                      borderColor="#d1d5db"
                    />
                    <span className="text-lg font-bold text-gray-700">~</span>
                    <InputFrame
                      type="text"
                      name={`locationEnd-${item.id}`}
                      value={item.locationEnd}
                      onChange={(e) => handleInputChange(item.id, "locationEnd", e.target.value)}
                      className="w-24 text-center !bg-white !border-gray-300 border rounded px-2 py-1"
                      placeholder="結束"
                      borderColor="#d1d5db"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 確定按鈕 */}
      <div className="mt-4 flex justify-center">
        <ActionBtn
          icon="icon-check"
          text="確定"
          variant="orange"
          onClick={onConfirm}
        />
      </div>
    </div>
  );
}
