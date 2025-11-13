import { useRouter } from "next/router";
import Mask from "@/components/mask/mask";
import { useState } from "react";
// 常數定義
const ASSETS = {
  LOGO_EN: "/common/YOHOlogo1.svg",
  LOGO_CN: "/common/YOHOlogo-C.svg",
  BACKGROUND: "/common/home-background.svg",
  VALUES: {
    HONEST: "/common/HONEST1.svg",
    CREATIVITY: "/common/CREATIVITY1.svg",
    QUALITY: "/common/QUALITY1.svg",
  },
  SLOGAN_CN: "/common/slogan-c.svg",
  SLOGAN_EN: "/common/slogan-e.svg",
};

// 核心價值數據
const COMPANY_VALUES = [
  {
    id: "honest",
    icon: ASSETS.VALUES.HONEST,
    text: "HONEST",
    alt: "誠實",
  },
  {
    id: "creativity",
    icon: ASSETS.VALUES.CREATIVITY,
    text: "CREATIVITY",
    alt: "創意",
  },
  {
    id: "quality",
    icon: ASSETS.VALUES.QUALITY,
    text: "QUALITY",
    alt: "品質",
  },
];

export default function Home() {
  const router = useRouter();

  // 導航到工作站
  const navigateToWorkspace = () => {
    router.push("/centralpanel");
  };

  const [c, setc] = useState(false);
  const handleSend = () => {};

  return (
    <div className="w-full bg-red-500 text-white p-4">
      Hello Tailwind
      <Mask showModal={true} title={"測試標題"} onClose={() => setc(false)} onConfirm={handleSend}>
        <>測試</>
      </Mask>
    </div>
  );
}
