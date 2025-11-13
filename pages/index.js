import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

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
