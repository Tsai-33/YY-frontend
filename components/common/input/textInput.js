import React from "react";

export default function TextInput({
  label,
  type = "text",
  value,
  onChange,
  className,
}) {
  return (
    <div className={`flex items-center ${className || ""}`}>
      <label className="text-[24px] font-bold text-black">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="flex-1 rounded-md px-3 py-2 bg-[#878787] text-white outline-none"
      />
    </div>
  );
}
