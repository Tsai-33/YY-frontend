import React from "react";

export default function SelectInput({
  label,
  options = [],
  value,
  onChange,
  className,
  disabled,
}) {
  return (
    <div className={`flex items-center gap-1.5 ${className || ""}`}>
      <label className="text-[24px] font-bold text-black">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="flex-1 rounded-md px-3 py-2 bg-[#878787] text-white text-[16px] outline-none">
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
