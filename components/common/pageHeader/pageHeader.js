import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentJob } from "@/redux/reducer/reducerWorkStations";
import ActionBtn from "@/components/common/btns/actionBtn";
import Link from "next/link";

export default function PageHeader({ title, backTo = "/", close }) {
  const dispatch = useDispatch();
  const { currentStation, currentJob } = useSelector((s) => s.workstation);

  return (
    <div className="relative w-full flex items-center justify-between ps-4">
      {/* 左邊 */}
      <div className="text-[length:var(--font-size-6xl)] font-bold text-[var(--green-deep)]">{`${currentJob}${currentStation || ""}`}</div>

      {/* 中間 */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <div className="flex justify-center font-bold text-black sm:text-[length:var(--font-size-4xl)]">{title}</div>
      </div>

      {/* 右邊 */}
      {!close && <Link href={backTo}>
        <ActionBtn icon="icon-goback" text="返回" variant="darkBlue" onClick={() => dispatch(setCurrentJob(null))} />
      </Link>}
    </div>
  );
}
