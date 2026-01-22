import React from "react";

export default function SchematicDiagramList({ children }) {
  return (
    <>
      {/* 貨架 */}
      <div className="flex-1 min-h-0 flex flex-col gap-0.5 text-(length:--font-size-3xl)">
        <div className="w-full bg-(--shelf-color) rounded-3xl p-8">{children}</div>
      </div>
    </>
  );
}
