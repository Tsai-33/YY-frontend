import React from "react";

export default function SchematicDiagramList({ children }) {
  return (
    <>
      {/* 貨架 */}
      <div className="flex flex-col gap-0.5 text-[length:var(--font-size-3xl)]">
        <div className="w-full bg-[var(--shelf-color)] rounded-3xl p-8 custom-scrollbar" style={{ "--scrollbar-thumb-color": `var(--green-vivid)` }}>
          {children}
        </div>
      </div>
    </>
  );
}
