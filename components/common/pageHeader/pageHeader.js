import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setCurrentJob,
  setCurrentStation,
} from "@/redux/reducer/reducerWorkStations";
import ActionBtn from "@/components/common/btns/actionBtn";
import Link from "next/link";
import { useRouter } from "next/router";

export default function PageHeader({ title, backTo = "/", close }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { currentStation, currentJob } = useSelector((s) => s.workstation);

  const handleBack = () => {
    dispatch(setCurrentJob(null));
    router.push(backTo);
  };

  return (
    <div className="relative w-full flex items-center justify-between">
      {/* 左邊 */}
      <div className="text-(length:--font-size-6xl) font-bold text-(--green-deep)">
        {router.pathname === "/stockQuery"
          ? currentJob || ""
          : `${currentJob || ""}${currentStation || ""}`}
      </div>

      {/* 中間 */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <div className="flex justify-center font-bold text-black sm:text-(length:--font-size-4xl)">
          {title}
        </div>
      </div>

      {/* 右邊 */}
      <ActionBtn
        icon="icon-goback"
        text="返回"
        variant="darkBlue"
        onClick={handleBack}
      />
    </div>
  );
}
