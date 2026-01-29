import React from "react";

export default function LoadingText() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 bg-white h-full">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-blue-100 rounded-full"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-slate-500 text-sm font-medium tracking-wider animate-pulse">正在搜尋中請稍後....</p>
    </div>
  );
}
