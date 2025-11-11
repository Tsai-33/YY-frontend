
import { useRouter } from "next/router";
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

  return (
    <div
      className="relative w-full h-screen bg-center bg-cover cursor-pointer"
      style={{ backgroundImage: `url(${ASSETS.BACKGROUND})` }}
      onClick={navigateToWorkspace}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigateToWorkspace();
        }
      }}
      aria-label="點擊進入工作站"
    >
      {/* 左上角 Logo */}
      <header className="absolute top-1/30 left-1/30 pointer-events-none">
        <img src={ASSETS.LOGO_EN} alt="YOHO Medical Enterprise 英文標誌" className="h-16 w-auto object-contain" />
      </header>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center justify-center gap-15">
        {/* 中央主要 Logo */}
        <div className="flex flex-col items-center justify-center">
          <img src={ASSETS.LOGO_CN} alt="YOHO Medical Enterprise 中文標誌" className="h-36 w-138 object-contain" />
        </div>

        {/* 底部核心價值區域 */}
        <section className="" aria-label="公司核心價值">
          <div className="flex items-center justify-center gap-10">
            {COMPANY_VALUES.map((value) => (
              <img key={value.id} src={value.icon} alt={`${value.alt}圖示`} className="h-68 w-auto object-contain" />
            ))}
          </div>
        </section>

        <div className="flex flex-col items-center justify-center gap-4">
          <div>
            <img src={ASSETS.SLOGAN_CN} alt="優好生活，呵護健康" className="w-70 object-contain" />
          </div>
          <div>
            <img src={ASSETS.SLOGAN_EN} alt="Live better,stay healthy" className="w-80 object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
}
