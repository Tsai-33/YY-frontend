import React from "react";

export default function SchematicDiagram({ children, isSelected = false }) {
  return (
    <>
      {/* 貨架 */}
      <div
        className={`flex-1 min-h-0 flex flex-col gap-0.5 custom-scrollbar
              ${
                isSelected
                  ? "border-8 border-green-500"
                  : "border-8 border-transparent"
              }`}
        style={{ "--scrollbar-thumb-color": `var(--green-vivid)` }}>
        <div className="w-full bg-(--shelf-color) rounded-xl p-4">
          {children}
        </div>
        <div className="w-full h-20 border-black border-x-25 border-t-25 shrink-0"></div>
      </div>
    </>
  );
}
