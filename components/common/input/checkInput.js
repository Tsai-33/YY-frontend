import React from "react";

export default function CheckInput({
  label,
  type = "checkbox",
  checked,
  onChange,
  disabled,
}) {
  return (
    <div className="flex items-center gap-1.5 ">
      <label
        className={`checkbox text-[24px] font-bold text-black flex justify-center items-center`}>
        <input
          type={type}
          id="hasException"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <span className={`checkbox_checkmark`}></span>
        {label}
      </label>
    </div>
  );
}
