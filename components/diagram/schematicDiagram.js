import React from "react";

export default function SchematicDiagram({ children }) {
  return (
    <>
      {/* 貨架 */}
      <div className="flex flex-col gap-0.5">
        <div className="w-full bg-[#DCB692] rounded-3xl p-4">{children}</div>
        <div className="w-full h-15 border-black border-x-20 border-t-20"></div>
      </div>
    </>
  );
}
