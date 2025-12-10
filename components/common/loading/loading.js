import clsx from "clsx";

export default function Loading() {
    const base = `
  transition-colors duration-500 ease-in-out
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div>
        <div className={`flex justify-center space-x-1 ${clsx(base)}`}>
          <span className="text-6xl font-bold text-gray-400 animate-bounce" style={{ animationDelay: "0ms" }}>
            L
          </span>
          <span className="text-6xl font-bold text-gray-400 animate-bounce" style={{ animationDelay: "100ms" }}>
            o
          </span>
          <span className="text-6xl font-bold text-gray-400 animate-bounce" style={{ animationDelay: "200ms" }}>
            a
          </span>
          <span className="text-6xl font-bold text-gray-400 animate-bounce" style={{ animationDelay: "300ms" }}>
            d
          </span>
          <span className="text-6xl font-bold text-gray-400 animate-bounce" style={{ animationDelay: "400ms" }}>
            i
          </span>
          <span className="text-6xl font-bold text-gray-400 animate-bounce" style={{ animationDelay: "500ms" }}>
            n
          </span>
          <span className="text-6xl font-bold text-gray-400 animate-bounce" style={{ animationDelay: "600ms" }}>
            g
          </span>
          <span className="text-6xl font-bold text-gray-400 animate-bounce" style={{ animationDelay: "700ms" }}>
            .
          </span>
          <span className="text-6xl font-bold text-gray-400 animate-bounce" style={{ animationDelay: "800ms" }}>
            .
          </span>
          <span className="text-6xl font-bold text-gray-400 animate-bounce" style={{ animationDelay: "600ms" }}>
            .
          </span>
        </div>
      </div>
    </div>
  );
}
