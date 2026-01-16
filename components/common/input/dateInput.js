import React from "react";

export default function DateInput({
  label,
  onClick,
  timeRangeText,
  className,
  disabled,
}) {
  return (
    <>
      <div className="flex items-center gap-1.5">
        <label className="text-[24px] font-bold text-black">{label}</label>
        <button
          className={`flex-1 rounded-md px-3 py-2 bg-[#878787] text-white text-[16px] outline-none ${
            className || ""
          }`}
          onClick={onClick}
          disabled={disabled}>
          {timeRangeText || "請選擇時間"}
        </button>
      </div>
    </>
  );
}
