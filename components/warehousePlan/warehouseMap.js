import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect, Text, Group } from "react-konva";

const statusColor = {
  empty: "#e0e0e0",
  full: "#3498db",
  reserved: "#f1c40f",
  error: "#e74c3c",
  selected: "#9b59b6",
};

// 根據區域的顏色 (warehouseId)
const warehouseColors = {
  F01: "#15803D", // Dark green
  F02: "#DC2626", // Red
  F03: "#EAB308", // Yellow
  F09: "#9333EA", // Purple
  D01: "#2563EB", // Blue
  D02: "#F97316", // Orange
  D05: "#7ABF9E", // Green
  D09: "#1e293b", // Dark blue
  M01: "#ec4899", // Pink
  M02: "#000000", // Black
};

// STOCK_AREA = null 時的顏色 (未指定)
const NULL_STOCK_AREA_COLOR = "#D9D9D9"; // 淺灰色

export default function WarehouseMap({ shelvesData = [] }) {
  const [showMapCodes, setShowMapCodes] = useState(false);
  const [stageSize, setStageSize] = useState({ width: 1000, height: 600 });
  const containerRef = useRef(null);
  const [hoveredShelf, setHoveredShelf] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [popupDirection, setPopupDirection] = useState("bottom");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 使用 requestAnimationFrame 更新尺寸以確保 DOM 已渲染
    const updateSize = () => {
      if (!container) return;
      requestAnimationFrame(() => {
        if (!container) return;
        const rect = container.getBoundingClientRect();
        // 確保 width 和 height > 0
        if (rect.width > 0 && rect.height > 0) {
          const newSize = {
            width: Math.floor(rect.width),
            height: Math.floor(rect.height),
          };
          // 僅在尺寸改變時更新
          setStageSize((prevSize) => {
            if (
              prevSize.width !== newSize.width ||
              prevSize.height !== newSize.height
            ) {
              return newSize;
            }
            return prevSize;
          });
        }
      });
    };

    // 立即更新 (使用小延遲以確保 DOM 已渲染)
    setTimeout(updateSize, 0);

    // 使用 ResizeObserver 監聽尺寸變化
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(container);

    // 添加 window resize 監聽器以確保窗口調整大小時更新
    const handleWindowResize = () => {
      updateSize();
    };
    window.addEventListener("resize", handleWindowResize);

    // 清理
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  // 計算邊界和縮放以適合所有貨架到 Stage
  const calculateBounds = () => {
    if (!shelvesData || shelvesData.length === 0) {
      return {
        minX: 0,
        minY: 0,
        maxX: 1000,
        maxY: 1000,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      };
    }

    // 過濾並解析有效座標
    const validXs = shelvesData
      .map((s) => parseFloat(s.dockX))
      .filter((x) => !isNaN(x));
    const validYs = shelvesData
      .map((s) => parseFloat(s.dockY))
      .filter((y) => !isNaN(y));

    if (validXs.length === 0 || validYs.length === 0) {
      return {
        minX: 0,
        minY: 0,
        maxX: 1000,
        maxY: 1000,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      };
    }

    const minX = Math.min(...validXs);
    const maxX = Math.max(...validXs);
    const minY = Math.min(...validYs);
    const maxY = Math.max(...validYs);

    const width = maxX - minX;
    const height = maxY - minY;

    const margin = 50;
    const availableWidth = stageSize.width - 2 * margin;
    const availableHeight = stageSize.height - 2 * margin;

    // 計算縮放以適合兩個方向
    let scale = 1;
    if (width > 0 && height > 0) {
      scale = Math.min(availableWidth / width, availableHeight / height, 1);
    } else if (width > 0) {
      scale = Math.min(availableWidth / width, 1);
    } else if (height > 0) {
      scale = Math.min(availableHeight / height, 1);
    }

    // 確保縮放有效
    scale = isNaN(scale) || scale <= 0 ? 1 : scale;

    // 計算偏移以居中
    const offsetX = margin - minX * scale;
    // const offsetY = margin - minY * scale;

    const displayedDataHeight = (maxY - minY) * scale;
    const verticalMargin = (stageSize.height - displayedDataHeight) / 2;
    const offsetY = verticalMargin + maxY * scale;

    return { minX, minY, maxX, maxY, scale, offsetX, offsetY };
  };

  const bounds = calculateBounds();

  const calculatePopupPosition = (
    pointerX,
    pointerY,
    stageWidth,
    stageHeight
  ) => {
    const popupWidth = 250; // popup 的最大寬度
    const popupHeight = 150; // 估算 popup 高度
    const offset = 15; // 與游標的距離
    const padding = 10; // 安全內距

    let x = pointerX + offset;
    let y = pointerY + offset;
    let direction = "bottom";

    // 檢查 X: 如果超過右側，調整到左側
    if (x + popupWidth + padding > stageWidth) {
      x = pointerX - popupWidth - offset;
      // 如果仍然超過左側，置於中間
      if (x < padding) {
        x = stageWidth - popupWidth - padding;
      }
    }

    // 檢查 Y: 如果超過下方，顯示在上方
    if (y + popupHeight + padding > stageHeight) {
      y = pointerY - popupHeight - offset;
      direction = "top";
      // 如果仍然超過上方，置於中間
      if (y < padding) {
        y = padding;
      }
    } else {
      // 確保不超過上方
      if (y < padding) {
        y = padding;
      }
    }

    return { x, y, direction };
  };
  // 從後端數據渲染貨架
  const renderShelves = () => {
    if (!shelvesData || shelvesData.length === 0) {
      return (
        <Text
          x={stageSize.width / 2}
          y={stageSize.height / 2}
          text="無資料"
          fontSize={40}
          fill="#999"
          align="center"
        />
      );
    }

    return shelvesData
      .map((shelf, index) => {
        const parsedDockX = parseFloat(shelf.dockX);
        const parsedDockY = parseFloat(shelf.dockY);

        // 如果座標無效則跳過
        if (isNaN(parsedDockX) || isNaN(parsedDockY)) {
          console.warn(
            `⚠️ Invalid coordinates for shelf ${shelf.shelfCode}:`,
            shelf
          );
          return null;
        }

        // 應用縮放和偏移
        const dockX = parsedDockX * bounds.scale + bounds.offsetX;
        // const dockY = parsedDockY * bounds.scale + bounds.offsetY;
        const dockY = bounds.offsetY - parsedDockY * bounds.scale;

        // 縮放後再次檢查
        if (isNaN(dockX) || isNaN(dockY)) {
          console.warn(
            `⚠️ Invalid scaled coordinates for shelf ${shelf.shelfCode}`
          );
          return null;
        }

        // 選擇顏色: 如果 STOCK_AREA = null 則使用灰色，否則根據 warehouseId 使用顏色
        const color =
          shelf.warehouseId === "UNKNOWN"
            ? NULL_STOCK_AREA_COLOR
            : warehouseColors[shelf.warehouseId] || statusColor.empty;
        const size = Math.max(Math.round(60 * bounds.scale), 10);

        return (
          <Group key={shelf.shelfCode || `shelf-${index}`}>
            <Rect
              x={dockX}
              y={dockY}
              width={size}
              height={size}
              fill={color}
              stroke="#666"
              strokeWidth={1}
              cornerRadius={0}
              onMouseEnter={(e) => {
                const stage = e.target.getStage();
                const pointerPos = stage.getPointerPosition();
                setHoveredShelf(shelf);

                // 計算安全的 popup 位置
                const adjusted = calculatePopupPosition(
                  pointerPos.x,
                  pointerPos.y,
                  stageSize.width,
                  stageSize.height
                );
                setPopupPosition({ x: adjusted.x, y: adjusted.y });
                setPopupDirection(adjusted.direction);

                // 將游標改為 pointer
                const container = stage.container();
                container.style.cursor = "pointer";
              }}
              onMouseLeave={(e) => {
                setHoveredShelf(null);
                // 將游標改回 default
                const container = e.target.getStage().container();
                container.style.cursor = "default";
              }}
              onMouseMove={(e) => {
                const stage = e.target.getStage();
                const pointerPos = stage.getPointerPosition();

                // 重新計算安全的 popup 位置
                const adjusted = calculatePopupPosition(
                  pointerPos.x,
                  pointerPos.y,
                  stageSize.width,
                  stageSize.height
                );
                setPopupPosition({ x: adjusted.x, y: adjusted.y });
                setPopupDirection(adjusted.direction);
              }}
            />
            {showMapCodes && (
              <Text
                text={shelf.shelfNumber + " - " + shelf.shelfCode || ""}
                x={dockX}
                y={dockY + size + 2}
                fontSize={Math.max(12, 14 * bounds.scale)}
                fill="#333"
              />
            )}
          </Group>
        );
      })
      .filter(Boolean);
  };

  return (
    <div className="bg-white p-3 flex flex-col flex-1 rounded-lg shadow-sm relative min-h-0 overflow-hidden">
      {/* 顯示貨架編碼按鈕 */}
      <div className="absolute top-3 left-3 z-10">
        <button
          onClick={() => setShowMapCodes(!showMapCodes)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium shadow transition-colors">
          {showMapCodes ? "隱藏" : "顯示"}地圖貨架編碼
        </button>
      </div>

      {/* Canvas - 根據容器響應式 */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden w-full h-full"
        style={{ minWidth: 0, minHeight: 0 }}>
        {stageSize.width > 0 && stageSize.height > 0 && (
          <Stage width={stageSize.width} height={stageSize.height}>
            <Layer>{renderShelves()}</Layer>
          </Stage>
        )}
      </div>
      {hoveredShelf && (
        <div
          className="absolute bg-white border-2 border-blue-500 rounded-lg shadow-xl p-3 z-50 pointer-events-none"
          style={{
            left: `${popupPosition.x + 15}px`,
            top: `${popupPosition.y + 15}px`,
            maxWidth: "250px",
            transform: "translate(0, 0)",
          }}>
          <div className="text-sm font-bold text-gray-800 border-b pb-2 mb-2">
            {hoveredShelf.shelfCode || "N/A"}
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>
              <strong>停靠點:</strong> {hoveredShelf.nodeCode || "無"}
            </div>
            <div>
              <strong>貨架號:</strong> {hoveredShelf.shelfNumber || "無"}
            </div>
            <div>
              <strong>地圖編碼:</strong> {hoveredShelf.mapCode || "無"}
            </div>
            <div>
              <strong>倉庫:</strong>{" "}
              {hoveredShelf.warehouseId === "UNKNOWN"
                ? "未指定"
                : hoveredShelf.warehouseId || "無"}
            </div>
            <div className="text-gray-500 mt-2 pt-2 border-t">
              座標: ({parseFloat(hoveredShelf.dockX)?.toFixed(0) || "無"},{" "}
              {parseFloat(hoveredShelf.dockY)?.toFixed(0) || "無"})
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
