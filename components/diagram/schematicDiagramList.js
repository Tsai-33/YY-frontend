import React from "react";

export default function SchematicDiagramList({ children }) {
  return (
    <>
      {/* 貨架 */}
      <div className="flex-1 min-h-0 flex flex-col gap-0.5 text-(length:--font-size-4xl) px-2">
        <div className="w-full bg-(--green-vivid-50) rounded-3xl p-4">{children}</div>
      </div>
    </>
  );
}
