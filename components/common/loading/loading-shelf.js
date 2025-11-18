import clsx from "clsx";

export default function LoadingShelf() {
  const base = `
  transition-colors duration-500 ease-in-out
  backdrop-blur-[12px]
  shadow-[0px_1px_8px_0px_#0000001A,
          0px_0px_2px_0px_#0000001A,
          inset_0px_0px_8px_0px_#F2F2F2,
          inset_0px_0px_0px_1px_#A6A6A6,
          inset_-2px_-2px_0.5px_-2px_#262626,
          inset_2px_2px_0.5px_-2px_#262626,
          inset_3px_3px_0.5px_-3.5px_#FFFFFF]
  text-[#125840]
      [text-shadow:_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF,_0_0_3px_#FFFFFF]
`;

  return (
    <div className="fixed bg-[var(--green-pale-80)] inset-0 backdrop-blur-sm flex items-center justify-center z-10">
      <div>
        <div className={`flex justify-center space-x-1 ${clsx(base)}`}>
          <span className="text-6xl font-bold animate-bounce" style={{ animationDelay: "0ms" }}>
            貨
          </span>
          <span className="text-6xl font-bold  animate-bounce" style={{ animationDelay: "100ms" }}>
            架
          </span>
          <span className="text-6xl font-bold  animate-bounce" style={{ animationDelay: "200ms" }}>
            搬
          </span>
          <span className="text-6xl font-bold  animate-bounce" style={{ animationDelay: "300ms" }}>
            運
          </span>
          <span className="text-6xl font-bold  animate-bounce" style={{ animationDelay: "400ms" }}>
            中
          </span>
          <span className="text-6xl font-bold  animate-bounce" style={{ animationDelay: "500ms" }}>
            .
          </span>
          <span className="text-6xl font-bold  animate-bounce" style={{ animationDelay: "600ms" }}>
            .
          </span>
          <span className="text-6xl font-bold  animate-bounce" style={{ animationDelay: "700ms" }}>
            .
          </span>
          <span className="text-6xl font-bold  animate-bounce" style={{ animationDelay: "800ms" }}>
            .
          </span>
          <span className="text-6xl font-bold  animate-bounce" style={{ animationDelay: "600ms" }}>
            .
          </span>
        </div>
      </div>
    </div>
  );
}
