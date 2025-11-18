import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentStation } from "@/redux/reducer/reducerWorkStations";
import ActionBtn from "@/components/common/btns/actionBtn";
import PageHeader from "@/components/common/pageHeader/pageHeader";

export default function Inventory() {
  const dispatch = useDispatch();
  const { stations, currentStation } = useSelector((s) => s.workstation);

  const handleSwitchStation = (station) => {
    dispatch(setCurrentStation(station));
  };

  return (
    <>
      {/* 頂部區域 */}
      <PageHeader title="請選擇盤點方式" backTo="/workspace" />
      {/* 主要內容區域 */}
      <div className="flex-1"></div>
      {/* 底部按鈕區域 */}
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
