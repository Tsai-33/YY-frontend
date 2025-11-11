import React from "react";
import clsx from "clsx";

export default function CategoryBtn({ icon, text, variant, svgPath }) {
  const base = `
    w-44 h-40
    rounded-4xl 
    text-lg
    flex justify-center items-center
    cursor-pointer 
    transition-colors duration-500 ease-in-out
    backdrop-blur-[12px]
    shadow-[0px_1px_8px_0px_#0000001A]
    shadow-[0px_0px_2px_0px_#0000001A]
    inset-shadow-[0px_0px_8px_0px_#F2F2F2]
    inset-shadow-[0px_0px_0px_1px_#A6A6A6]
    inset-shadow-[-2px_-2px_0.5px_-2px_#262626]
    inset-shadow-[2px_2px_0.5px_-2px_#262626]
    inset-shadow-[3px_3px_0.5px_-3.5px_#FFFFFF]
    `;

  const variants = {
    skyBlue: {
      btn: `
      bg-[#DAE5EF] 
      text-[#2D5780]
      hover:text-[#4A9BC8]
      focus:bg-[#CACACA]
      focus:hover:bg-[#CACACA]
      focus:hover:text-[#2D5780]
      `,
      text: `
      text-[#6BB0E1]
      [text-shadow:_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780,_0_0_3px_#2D5780]
      `,
    },
    red: {
      btn: `
      bg-[#FFEAEE] 
      text-[#E5495F]
      hover:text-[#E86B7D]
      focus:bg-[#FF8294]
      focus:text-[#CACACA]
      focus:hover:bg-[#FF8294]
      focus:hover:text-[#CACACA]
      `,
      text: `
      text-white
      [text-shadow:_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D,_0_0_3px_#E86B7D]
      `,
    },
    purple: {
      btn: `
      bg-[#F9E9FF] 
      text-[#926BC5]
      hover:text-[#C4B0DF]
      focus:bg-[#A982DC]
      focus:text-[#926BC5]
      focus:hover:bg-[#A982DC]
      focus:hover:text-[#926BC5]
      `,
      text: `
      text-white
      [text-shadow:_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF,_0_0_3px_#9747FF]
      `,
    },
    orange: {
      btn: `
      bg-[#FFEBDB] 
      text-[#E88121]
      hover:text-[#FFA629]
      focus:bg-[#FFAF17]
      focus:text-[#000000]
      focus:hover:bg-[#FFAF17]
      focus:hover:text-[#000000]
      `,
      text: `
      text-[#FFD79F]
      [text-shadow:_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121,_0_0_3px_#E88121]
      `,
    },
  };
  return (
    <>
      <div className="flex flex-col items-center gap-5">
        <button className={clsx(base, variants[variant]?.btn)}>
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
