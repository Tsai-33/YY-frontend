import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { setIP } from "@/redux/reducer/reducerUser";
import { initWorkstation } from "@/redux/reducer/reducerWorkStations";
import { getIP } from "./api";

export default function Home() {
  const router = useRouter();
  const dispatch = useDispatch();
  const IP = useSelector((state) => state.user.userIP);

  const fetchClientIP = async () => {
    try {
      const res = await getIP();
      if (res.data.success) {
        const ip = res.data.data;
        dispatch(setIP(ip));
        return ip;
      }
      return null;
    } catch (err) {
      console.error("Error fetching IP:", err);
      return null;
    }
  };

  // 首頁載入時就進行初始化流程
  useEffect(() => {
    async function init() {
      // 若 Redux 已有 station 和 ip，代表已初始化過
      if (IP) {
        console.log("工作站已初始化，跳過 IP 查詢");
        router.push("/workspace");
        return;
      }

      console.log("尚未初始化，開始進行 IP 查詢…");

      const clientIp = await fetchClientIP();
      if (!clientIp) return;

      const result = dispatch(initWorkstation(clientIp));

      // 成功後跳轉
      if (result.success !== false) {
        router.push("/workspace");
      } else {
        alert("IP 未授權，請聯繫系統管理員");
      }
    }

    init();
  }, []);

  // 導航到工作站
  const navigateToWorkspace = () => {
    router.push("/workspace");
  };

  return (
    <div
      className="relative w-full h-full bg-[url(/common/background-home.svg)] bg-center bg-cover bg-no-repeat cursor-pointer"
      onClick={navigateToWorkspace}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigateToWorkspace();
        }
      }}
      aria-label="點擊進入工作站"></div>
  );
}
