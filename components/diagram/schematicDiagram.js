import React from "react";

export default function SchematicDiagram({ children, isSelected = false }) {
  return (
    <>
      {/* 貨架 */}
      <div className={`flex flex-col gap-0.5 rounded-3xl transition-all ${
        isSelected ? 'border-8 border-green-500' : 'border-8 border-transparent'
      }`}>
        <div className="w-full bg-[#DCB692] rounded-t-2xl p-4">{children}</div>
        <div className="w-full h-25 border-black border-x-30 border-t-30"></div>
      </div>
    </>
  );
}
