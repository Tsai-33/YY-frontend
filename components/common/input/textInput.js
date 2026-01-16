import React from "react";

export default function TextInput({
  label,
  type = "text",
  value,
  onChange,
  className,
  disabled,
}) {
  return (
    <div className={`flex items-center gap-1.5`}>
      <label className="text-[24px] font-bold text-black">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={`flex-1 rounded-md px-3 py-2 bg-[#878787] text-white text-[16px] outline-none ${
          className || ""
        }`}
        disabled={disabled}
      />
    </div>
  );
}
