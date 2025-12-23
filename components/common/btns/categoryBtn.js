import React from "react";
import clsx from "clsx";

export default function CategoryBtn({ icon, text, variant, svgPath, onClick }) {
  const base = `
    w-57.5 h-57.5
    rounded-full 
    border border-white
    flex justify-center items-center
    cursor-pointer 
    transition-colors duration-500 ease-in-out
    shadow-[0px_4px_4px_0px_#00000040]
    shadow-[inset_0px_4px_4px_0px_#FFFFFF80]
    `;

  const variants = {
    darkGreen: {
      btn: `
        bg-[var(--primary-color)] 
        text-[#FFFFFF]
        hover:bg-[var(--green-vivid)]
        diabled:bg-[var(--green-pale)]
        diabled:text-[var(----primary-color)]
      `,
      text: `
        text-[length:var(--font-size-6xl)]
        text-[var(--green-deep)]
        font-bold
      `,
    },
  };
  return (
    <>
      <div className="flex flex-col items-center gap-5">
        <button
          className={clsx(base, variants[variant]?.btn)}
          onClick={onClick}>
          {svgPath ? (
            <img
              src={svgPath}
              alt={text}
              className="w-[120px] h-[120px] object-contain"
            />
          ) : (
            <span className={`${icon} text-[120px]`}></span>
          )}
        </button>
        <div className={clsx("categoryBtnText", variants[variant]?.text)}>
          {text}
        </div>
      </div>
    </>
  );
}
