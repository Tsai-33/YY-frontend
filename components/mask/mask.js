import React from "react";
import ActionBtn from "@/components/common/btns/actionBtn";

export default function Mask({ showModal, title, onClose, children, onConfirm, height, width }) {
  const containerHeight = height || "38vh";
  const containerWidth = width || "32vw";

  return (
    <div className={`fixed inset-0 z-20 flex items-center justify-center transition-opacity duration-500 ${showModal ? "opacity-100 visible" : "opacity-0 invisible"} bg-[#d9d9d9cc]`}>
      <div className={`rounded-md bg-white border border-5 border-[var(--red)] overflow-hidden`} style={{ width: containerWidth, height: containerHeight }}>
        <div className="w-full h-full p-6 backdrop-blur-sm shadow-inner flex flex-col justify-between items-center">
          {/* topzone */}
          <div className="w-full flex items-center justify-between">
            <div className="flex justify-start font-bold text-black sm:text-[length:var(--small-fontSize)] md:text-[length:var(--middle-fontSize)] lg:text-[length:var(--large-fontSize)]">{title}</div>
            <button className="border-none bg-transparent text-2xl cursor-pointer" onClick={onClose}>
              ✕
            </button>
          </div>

          {/* middlezone */}
          <div className="flex flex-col gap-5">
            {children}
          </div>

          {/* bottomZone */}
          <div className="cursor-pointer" onClick={onConfirm}>
            <ActionBtn icon="icon-check" text="確定" variant="darkBlue" />
          </div>
        </div>
      </div>
    </div>
  );
}
