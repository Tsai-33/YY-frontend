import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import { Stage, Layer, Rect, Text, Group } from "react-konva";

const warehouseColors = {
  F01: "#008B48",
  F02: "#FF0000",
  F03: "#FFCD42",
  F09: "#8A38F5",
  D01: "#007BFF",
  D02: "#FA8350",
  D05: "#7ABF9E",
  D09: "#2D5780",
  M01: "#FF7C90",
  M02: "#000000",
};

export default function Map({
  shelvesData = [],
  activeWh, // 目前選中的倉別
  isEraserMode, // 橡皮擦模式開關
  nodeAssignments, // 所有分配資料 { NODE_CODE: WH_ID }
  setNodeAssignments, // 設定分配資料的函數
  handleConfirm,
}) {
  const router = useRouter();
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [showLabels, setShowLabels] = useState(false);
  const [mode, setMode] = useState("pan"); // 'pan' 或 'select'
  const [selection, setSelection] = useState({
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
    visible: false,
  });

  // 1. 監聽視窗大小，讓畫布自適應 div
  useEffect(() => {
    if (!containerRef.current) return;

    // 建立監聽器
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // 取得容器目前的寬高（包含 padding 建議用 contentRect 或 offsetWidth）
        const { width, height } = entry.contentRect;

        setSize({
          width: width,
          height: height,
        });
      }
    });

    // 開始監聽 div
    resizeObserver.observe(containerRef.current);

    // 清除監聽器，避免記憶體洩漏
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 2. 計算地圖邊界與初始縮放比例 (Memoized 防止重複計算)
  const mapMetrics = useMemo(() => {
    if (!shelvesData || shelvesData.length === 0 || size.height === 0)
      return {
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      };

    const xs = shelvesData
      .map((n) => parseFloat(n.DOCK_X))
      .filter((x) => !isNaN(x));
    const ys = shelvesData
      .map((n) => parseFloat(n.DOCK_Y))
      .filter((y) => !isNaN(y));
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // 計算資料的總寬高
    const dataW = maxX - minX || 1;
    const dataH = maxY - minY || 1;

    // 1. 計算縮放比例 (留出 10% 的空白邊距)
    const margin = 0.95;
    const scale = Math.min(
      (size.width * margin) / dataW,
      (size.height * margin) / dataH
    );

    // 2. 計算「讓地圖居中」的位移量
    // 畫布寬度的一半 - (地圖寬度 * 縮放 / 2)
    const offsetX = (size.width - dataW * scale) / 2;
    // 畫布高度的一半 - (地圖高度 * 縮放 / 2)
    const offsetY = (size.height - dataH * scale) / 2;

    return { minX, minY, maxX, maxY, scale, dataW, dataH, offsetX, offsetY };
  }, [shelvesData, size]);

  // 3. 座標轉換核心：將滑鼠點擊的「螢幕位置」轉為「畫布內的實際座標」
  const getRelativePointerPosition = (stage) => {
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert(); // 反轉矩陣，消除 Stage 的 Scale 和 Offset 影響
    const pos = stage.getPointerPosition();
    return transform.point(pos);
  };

  // 4. 滑鼠事件處理
  const handleMouseDown = (e) => {
    if (mode !== "select" || !activeWh) return;
    const stage = e.target.getStage();
    const pos = getRelativePointerPosition(stage);
    setSelection({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, visible: true });
  };

  const handleMouseMove = (e) => {
    if (!selection.visible) return;
    const stage = e.target.getStage();
    const pos = getRelativePointerPosition(stage);
    setSelection((prev) => ({ ...prev, x2: pos.x, y2: pos.y }));
  };

  const handleMouseUp = () => {
    if (!selection.visible) return;

    // 計算矩形邊界
    const xMin = Math.min(selection.x1, selection.x2);
    const xMax = Math.max(selection.x1, selection.x2);
    const yMin = Math.min(selection.y1, selection.y2);
    const yMax = Math.max(selection.y1, selection.y2);

    // 批量選取點位
    setNodeAssignments((prev) => {
      const next = { ...prev };
      shelvesData.forEach((node) => {
        const cx =
          (parseFloat(node.DOCK_X) - mapMetrics.minX) * mapMetrics.scale;
        const cy =
          (mapMetrics.maxY - parseFloat(node.DOCK_Y)) * mapMetrics.scale;

        if (cx >= xMin && cx <= xMax && cy >= yMin && cy <= yMax) {
          if (isEraserMode) {
            // 邏輯：要刪 A 倉，必須點 A 倉，再點橡皮擦 -> 框選
            if (next[node.NODE_CODE] === activeWh) {
              delete next[node.NODE_CODE];
            }
          } else {
            // 邏輯：要改 A 倉，先點 A -> 框選空白處
            if (!next[node.NODE_CODE]) {
              next[node.NODE_CODE] = activeWh;
            }
          }
        }
      });
      return next;
    });
    setSelection((prev) => ({ ...prev, visible: false }));
  };

  // 5. 處理縮放 (Mouse Wheel)
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const scaleBy = 1.2; // 縮放倍率
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    stage.scale({ x: newScale, y: newScale });

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    stage.position({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  return (
    <div className="bg-white flex-1 flex flex-col rounded-lg shadow-sm relative min-h-0 overflow-hidden">
      {/* 頂部控制欄 */}
      <div className="p-2 flex gap-4 bg-gray-100 border-b items-center">
        <div className="flex bg-white rounded shadow-sm p-1 border">
          <button
            onClick={() => setMode("pan")}
            className={`px-4 py-1 rounded ${
              mode === "pan" ? "bg-blue-500 text-white" : "text-gray-600"
            }`}>
            ✋ 拖拽
          </button>
          <button
            disabled={!activeWh} // 安全性：不點左邊不能框選
            onClick={() => setMode("select")}
            className={`px-4 py-1 rounded transition-colors ${
              mode === "select"
                ? "bg-blue-500 text-white"
                : activeWh
                ? "text-gray-600"
                : "text-gray-300"
            }`}>
            ⬛ 框選 {!activeWh && "(請先選倉別)"}
          </button>
        </div>
        <span className="text-sm font-medium">
          {activeWh ? `${activeWh} 倉` : "未選倉別"} | 已選：
          {
            Object.values(nodeAssignments).filter((v) => v === activeWh).length
          }{" "}
          個位置
        </span>
        <button
          onClick={() => setShowLabels(!showLabels)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium shadow">
          {showLabels ? "隱藏" : "顯示"}地圖碼點編碼
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium shadow transition-colors"
          onClick={handleConfirm}>
          更新倉別資料
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium shadow transition-colors"
          onClick={() => router.push("/stockAreaTest/uploadMap")}>
          上傳地圖資料
        </button>
      </div>

      {/* 畫布區域 */}
      <div ref={containerRef} className="flex-1 min-h-0 relative">
        {/* 狀態提示 */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-2">
          {activeWh && (
            <>
              <div className="flex items-center gap-2 bg-white/90 px-3 py-1 rounded-full border shadow-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: warehouseColors[activeWh] }}
                />
                <span className="text-xs font-bold">正在操作: {activeWh}</span>
              </div>
              {isEraserMode && (
                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-sm">
                  橡皮擦模式：僅刪除 {activeWh}
                </div>
              )}
            </>
          )}
        </div>

        <Stage
          ref={stageRef}
          width={size.width}
          height={size.height}
          x={mapMetrics.offsetX}
          y={mapMetrics.offsetY}
          draggable={mode === "pan"}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}>
          <Layer>
            {shelvesData.map((node) => {
              const assignedWh = nodeAssignments[node.NODE_CODE];
              const isSelectedWh = assignedWh === activeWh;
              const canvasX =
                (parseFloat(node.DOCK_X) - mapMetrics.minX) * mapMetrics.scale;
              const canvasY =
                (mapMetrics.maxY - parseFloat(node.DOCK_Y)) * mapMetrics.scale;

              return (
                <Group key={node.NODE_CODE} x={canvasX} y={canvasY}>
                  <Rect
                    width={10}
                    height={10}
                    fill={assignedWh ? warehouseColors[assignedWh] : "#E2E8F0"}
                    stroke={
                      isEraserMode && isSelectedWh ? "#EF4444" : "#94A3B8"
                    }
                    strokeWidth={isSelectedWh ? 1 : 0.5}
                    cornerRadius={1}
                    opacity={
                      activeWh && assignedWh && assignedWh !== activeWh
                        ? 0.3
                        : 1
                    }
                  />
                  {showLabels && (
                    <Text
                      text={node.NODE_CODE}
                      fontSize={4}
                      y={12}
                      fill="#64748B"
                      align="center"
                      width={10}
                    />
                  )}
                </Group>
              );
            })}

            {selection.visible && (
              <Rect
                x={Math.min(selection.x1, selection.x2)}
                y={Math.min(selection.y1, selection.y2)}
                width={Math.abs(selection.x2 - selection.x1)}
                height={Math.abs(selection.y2 - selection.y1)}
                fill={
                  isEraserMode
                    ? "rgba(239, 68, 68, 0.2)"
                    : "rgba(59, 130, 246, 0.2)"
                }
                stroke={isEraserMode ? "#EF4444" : "#3B82F6"}
                strokeWidth={1}
                dash={[5, 5]}
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
