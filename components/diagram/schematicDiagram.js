import React from "react";

export default function SchematicDiagram({ children }) {
  return (
    <>
      {/* 貨架 */}
      <div
        className="flex-1 min-h-0 flex flex-col gap-0.5 text-[length:var(--font-size-3xl)] custom-scrollbar pr-2"
        style={{"--scrollbar-thumb-color": `var(--green-vivid)`}}
      >
        <div className="w-full bg-[var(--shelf-color)] rounded-3xl p-8">{children}</div>
        <div className="w-full h-25 border-black border-x-30 border-t-30 shrink-0"></div>
      </div>
    </>
  );
}
