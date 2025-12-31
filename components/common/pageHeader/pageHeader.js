import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentJob, setCurrentStation } from "@/redux/reducer/reducerWorkStations";
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

  const titleRuleMap = {
    "/usermanage": { type: "fixed", text: "權限管理" },
    "/stockQuery": { type: "jobOnly" },

    // 其他頁面預設 job + station
  };

  const getTitleText = () => {
    const rule = titleRuleMap[router.pathname];

    if (!rule) {
      return `${currentJob || ""}${currentStation || ""}`;
    }

    if (rule.type === "fixed") return rule.text;
    if (rule.type === "jobOnly") return currentJob || "";

    return "";
  };

  return (
    <div className="relative w-full flex items-center justify-between">
      {/* 左邊 */}
      <div className="text-(length:--font-size-6xl) font-bold text-(--green-deep)">{getTitleText()}</div>

      {/* 中間 */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <div className="flex justify-center font-bold text-black sm:text-(length:--font-size-4xl)">{title}</div>
      </div>

      {/* 右邊 */}
      {!close && <ActionBtn icon="icon-goback" text="返回" variant="darkBlue" onClick={handleBack} />}
    </div>
  );
}
