import React from "react";

export default function SelectInput({
  label,
  options = [],
  value,
  onChange,
  className,
}) {
  return (
    <div className={`flex items-center ${className || ""}`}>
      <label className="text-[24px] font-bold text-black">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 rounded-md px-3 py-2 bg-[#878787] text-white outline-none">
        <option value="">請選擇{label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
