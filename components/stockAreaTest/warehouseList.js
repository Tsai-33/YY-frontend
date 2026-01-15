import React from "react";

// 沿用您的顏色配置
const warehouseConfig = [
  { id: "F01", name: "外銷成品倉", color: "#008B48" },
  { id: "F02", name: "外銷訂單倉", color: "#FF0000" },
  { id: "F03", name: "貿易倉", color: "#FFCD42" },
  { id: "F09", name: "待驗收倉", color: "#8A38F5" },
  { id: "D01", name: "成品倉", color: "#007BFF" },
  { id: "D02", name: "成品2倉", color: "#FA8350" },
  { id: "D05", name: "成品3倉", color: "#7ABF9E" },
  { id: "D09", name: "不良品倉", color: "#2D5780" },
  { id: "M01", name: "物料倉", color: "#FF7C90" },
  { id: "M02", name: "原料倉", color: "#000000" },
];

export default function WarehouseList({
  activeWh,
  setActiveWh,
  isEraserMode,
  setIsEraserMode,
  nodeAssignments,
}) {
  // 計算特定倉別的已選點數
  const getCount = (whId) => {
    return Object.values(nodeAssignments).filter((id) => id === whId).length;
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-inner border-r border-gray-200 rounded-lg">
      <div className="p-4 flex items-center gap-2">
        <h2 className="text-lg font-bold text-gray-800">1. 選擇操作倉別</h2>
        <span className=" text-gray-500">
          (點選下方倉別後，即可在右側地圖進行框選分配。)
        </span>
      </div>

      {/* 倉別列表區域 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {warehouseConfig.map((wh) => {
          const isActive = activeWh === wh.id; // 使用 ID 比對
          const count = getCount(wh.id);

          return (
            <button
              key={wh.id}
              onClick={() => setActiveWh(wh.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                isActive
                  ? "bg-white border-blue-500 shadow-md ring-2 ring-blue-100 translate-x-1"
                  : "bg-gray-100 border-transparent hover:bg-gray-200 text-gray-600"
              }`}>
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full shadow-sm"
                  style={{ backgroundColor: wh.color }}
                />
                <div className="flex items-start text-s font-semibold">
                  <span
                    style={{
                      color: wh.color,
                    }}>
                    {wh.id}
                  </span>
                  <span
                    style={{
                      color: wh.color,
                    }}>
                    ({wh.name})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-s px-2 py-0.5 rounded-full ${
                    count > 0
                      ? "bg-gray-200 text-gray-700"
                      : "bg-gray-100 text-gray-400"
                  }`}>
                  {count} 點
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 底部模式切換區域 - 僅在選定倉別後出現 */}
      {activeWh && (
        <div className="p-4 border-t space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-800">2. 修改模式</span>
            <span className="text-[16px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
              已選定 {activeWh}
            </span>
          </div>

          <button
            onClick={() => setIsEraserMode(!isEraserMode)}
            className={`w-full py-2 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${
              isEraserMode
                ? "bg-red-500 border-red-600 text-white shadow-inner"
                : "bg-white border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-500"
            }`}>
            {isEraserMode ? (
              <>
                <span>🛑</span> 橡皮擦：清除中
              </>
            ) : (
              <>
                <span>🧹</span> 切換為橡皮擦
              </>
            )}
          </button>

          <p className="text-[14px] text-center text-gray-400">
            {isEraserMode
              ? `注意：框選將只移除屬於 ${activeWh} 的點位`
              : `提示：框選將為 ${activeWh} 增加可用點位`}
          </p>
        </div>
      )}

      {!activeWh && (
        <div className="p-4 text-center border-t">
          <p className="text-xs text-gray-400 italic">尚未選擇操作對象</p>
        </div>
      )}
    </div>
  );
}
