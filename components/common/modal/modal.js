import React from "react";
import ActionBtn from "@/components/common/btns/actionBtn";

export default function Modal({
  showModal,
  title,
  onClose,
  children,
  onConfirm,
  height,
  width,
}) {
  const containerHeight = height || "auto";
  const containerWidth = width || "32vw";

  return (
    <div
      className={`fixed inset-0 z-25 flex items-center justify-center transition-opacity duration-500 ${
        showModal ? "opacity-100 visible" : "opacity-0 invisible"
      } bg-[#C3DDD680]`}>
      <div
        className={`rounded-[50px] bg-white border border-5 border-(--green-vivid) overflow-hidden`}
        style={{ width: containerWidth, height: containerHeight }}>
        <div className="w-full h-full p-6 shadow-md flex flex-col justify-between items-center gap-8">
          {/* topzone */}
          <div className="relative w-full flex items-center justify-center">
            <div className="text-(length:--font-size-6xl)">
              {title}
            </div>
            <button
              className="absolute right-0 top-1/2 -translate-y-1/2 
               bg-transparent border-none cursor-pointer
               flex items-center justify-center"
              onClick={onClose}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                stroke="black"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
          </div>

          {/* middlezone */}
          <div className="flex flex-col gap-5 font-normal text-(length:--font-size-2xl)">{children}</div>

          {/* bottomZone */}
          <div className="cursor-pointer" onClick={onConfirm}>
            <ActionBtn icon="icon-check" text="確定" variant="orange" />
          </div>
        </div>
      </div>
    </div>
  );
}
