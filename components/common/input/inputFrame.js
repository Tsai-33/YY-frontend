import React from "react";

export default function InputFrame({ type, name, id, value, onChange, onBlur, onKeyDown, ref, min, max, readOnly, inputMode, className, placeholder, borderColor, disabled }) {
  const containerBorder = borderColor || "border-black";
  return (
    <input
      className={`border-2 rounded
      flex-1 w-full pl-3 pr-2 py-0.75 bg-(--gray-deep)
      focus:bg-(--gray-light)
      text-(length:--font-size-xl) font-normal  ${className || ""}`}
      type={type}
      name={name}
      id={id}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      ref={ref}
      min={min}
      max={max}
      readOnly={readOnly}
      inputMode={inputMode}
      placeholder={placeholder}
      autoComplete="off"
      style={{ borderColor: containerBorder }}
      disabled={disabled}
    />
  );
}
