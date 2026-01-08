import React from "react";
import ActionBtn from "@/components/common/btns/actionBtn";
import InputFrame from "@/components/common/input/inputFrame";

export default function WarehouseTable({
  warehouseData,
  onInputChange,
  onConfirm,
}) {
  // 定義每個倉別的顏色 (根據圖片中的顏色)
  const getWarehouseColor = (id) => {
    const colorMap = {
      F01: "text-green-700", // Dark green
      F02: "text-red-600", // Red
      F03: "text-yellow-500", // Yellow
      F09: "text-purple-600", // Purple
      D01: "text-blue-600", // Blue
      D02: "text-orange-500", // Orange
      D05: "text-[#7ABF9E]", // Green
      D09: "text-blue-900", // Dark blue
      M01: "text-pink-400", // Pink
      M02: "text-black", // Black
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
    <div className="bg-white p-3 flex flex-col flex-1 rounded-lg shadow-sm min-h-0 overflow-hidden">
      {/* 表格 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <table className="w-full text-black font-bold border-collapse text-sm">
          <thead className="sticky top-0 bg-gray-100">
            <tr className="border-b-2 border-gray-300">
              <th className="px-2 py-2 text-center border-b border-gray-300 font-bold">
                倉別
              </th>
              <th className="px-2 py-2 text-center border-b border-gray-300 font-bold">
                貨架總數
              </th>
              <th className="px-2 py-2 text-center border-b border-gray-300 font-bold">
                位置區間
              </th>
            </tr>
          </thead>
          <tbody>
            {warehouseData.map((item, index) => (
              <tr
                key={item.id}
                className={`border-b border-gray-200 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}>
                {/* 倉別欄位 */}
                <td className="px-2 py-1.5 text-left">
                  <span
                    className={`font-bold text-xs ${getWarehouseColor(
                      item.id
                    )}`}>
                    {item.name} ({item.description})
                  </span>
                </td>
                {/* 貨架總數欄位 */}
                <td className="px-2 py-1.5 text-center">
                  <InputFrame
                    type="number"
                    name={`totalShelves-${item.id}`}
                    value={item.totalShelves}
                    onChange={(e) =>
                      handleInputChange(item.id, "totalShelves", e.target.value)
                    }
                    className="w-14 text-center bg-white! border-gray-300! border rounded px-1 py-0.5 text-xs"
                    inputMode="numeric"
                    borderColor="#d1d5db"
                  />
                </td>
                {/* 位置區間欄位 */}
                <td className="px-2 py-1.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <InputFrame
                      type="text"
                      name={`locationStart-${item.id}`}
                      value={item.locationStart}
                      onChange={(e) =>
                        handleInputChange(
                          item.id,
                          "locationStart",
                          e.target.value
                        )
                      }
                      className="w-12 text-center bg-white! border-gray-300! border rounded px-1 py-0.5 text-xs"
                      placeholder="起始"
                      borderColor="#d1d5db"
                    />
                    <span className="text-sm font-bold text-gray-700">~</span>
                    <InputFrame
                      type="text"
                      name={`locationEnd-${item.id}`}
                      value={item.locationEnd}
                      onChange={(e) =>
                        handleInputChange(
                          item.id,
                          "locationEnd",
                          e.target.value
                        )
                      }
                      className="w-12 text-center bg-white! border-gray-300! border rounded px-1 py-0.5 text-xs"
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
      <div className="mt-2 flex justify-center shrink-0">
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
