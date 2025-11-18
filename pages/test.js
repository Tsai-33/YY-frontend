import ActionBtn from "@/components/common/btns/actionBtn";
import React from "react";

export default function Test() {
  return (
    <>
      {/* 站點切換按鈕 */}
      <div className="w-full flex justify-between">
        {stations.map((station) => (
          <ActionBtn
            text={station}
            variant="green"
            disabled={currentStation === station ? true : false}
            onClick={() => handleSwitchStation(station)}
          />
        ))}
      </div>
    </>
  );
}
