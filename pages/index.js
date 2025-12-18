import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";

export default function Home() {
  const router = useRouter();
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);

  // 首頁載入時就進行初始化流程
  useEffect(() => {
    // 如果未登入，直接跳轉到登入頁
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
  }, [isAuthenticated, router]);

  // 導航到工作站
  const navigateToWorkspace = () => {
    // 如果未登入，跳轉到登入頁
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
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
