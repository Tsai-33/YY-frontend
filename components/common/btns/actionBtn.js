import React from "react";
import clsx from "clsx";

export default function ActionBtn({
  icon,
  text,
  variant,
  onClick,
  disabled,
  className,
}) {
  const base = `
    px-6 
    rounded-2xl 
    flex items-center gap-2 
    font-bold cursor-pointer 
    transition-colors duration-500 ease-in-out
    `;

  const variants = {
    darkBlue: `
      bg-[var(--blue-dark)] 
      border border-[var(--blue)] 
      text-white 
      hover:bg-[var(--blue-light)] 
      hover:border-white 
      hover:text-black 
      focus:bg-[var(--gray)] 
      focus:border-white 
      focus:text-white 
      focus:hover:bg-[var(--gray)] 
      focus:hover:border-white 
      focus:hover:text-white
    disabled:opacity-50 
    disabled:cursor-not-allowed 
    disabled:pointer-events-none 
    disabled:border-white 
    disabled:text-black
      `,
    skyBlue: `
      bg-[var(--blue-sky)] 
      border border-[var(--blue-bright)] 
      text-white 
      hover:bg-[var(--blue-sky-light)] 
      hover:border-white 
      hover:text-black 
      focus:bg-[var(--gray)] 
      focus:border-white 
      focus:text-white 
      focus:hover:bg-[var(--gray)] 
      focus:hover:border-white 
      focus:hover:text-white
    disabled:opacity-50 
    disabled:cursor-not-allowed 
    disabled:pointer-events-none 
    disabled:border-white 
    disabled:text-black
      `,
    green: `
      bg-[var(--aqua)] 
      border border-[var(--aqua-light)] 
      text-white 
      hover:bg-[var(--aqua-light)] 
      hover:border-white 
      hover:text-black 
      focus:bg-[var(--gray)] 
      focus:border-white 
      focus:text-white 
      focus:hover:bg-[var(--gray)] 
      focus:hover:border-white 
      focus:hover:text-white
    disabled:opacity-50 
    disabled:cursor-not-allowed 
    disabled:pointer-events-none 
    disabled:border-white 
    disabled:text-black
      `,
    orange: `
      bg-[var(--orange-soft)] 
      border border-[var(--orange)] 
      text-white 
      hover:bg-[var(--orange-light)] 
      hover:border-white 
      hover:text-black 
      focus:bg-[var(--gray)] 
      focus:border-white 
      focus:text-white 
      focus:hover:bg-[var(--gray)] 
      focus:hover:border-white 
      focus:hover:text-white
    disabled:opacity-50 
    disabled:cursor-not-allowed 
    disabled:pointer-events-none 
    disabled:border-white 
    disabled:text-black
      `,
    red: `
      bg-[var(--red-80)] 
      border border-[var(--red)] 
      text-white 
      hover:bg-[var(--red-transparent)] 
      hover:border-white 
      hover:text-black 
      focus:bg-[var(--gray)] 
      focus:border-white 
      focus:text-white 
      focus:hover:bg-[var(--gray)] 
      focus:hover:border-white 
      focus:hover:text-white
    disabled:opacity-50 
    disabled:cursor-not-allowed 
    disabled:pointer-events-none 
    disabled:border-white 
    disabled:text-black
      `,
    purple: `
      bg-[var(--purple)] 
      border border-[var(--purple-dark)] 
      text-white 
      hover:bg-[var(--purple-light)] 
      hover:border-white 
      hover:text-black 
      focus:bg-[var(--gray)] 
      focus:border-white 
      focus:text-white 
      focus:hover:bg-[var(--gray)] 
      focus:hover:border-white 
      focus:hover:text-white
    disabled:opacity-50 
    disabled:cursor-not-allowed 
    disabled:pointer-events-none 
    disabled:border-white 
    disabled:text-black
      `,

    white: `
      bg-white 
      border border-white 
      text-black 
      hover:bg-black
      hover:border-black 
      hover:text-white 
      focus:bg-black 
      focus:border-black  
      focus:text-white 
    disabled:opacity-50 
    disabled:cursor-not-allowed 
    disabled:pointer-events-none 
    disabled:border-white 
    disabled:text-black
      `,
  };
  return (
    <>
      <button
        className={` ${clsx(base, variants[variant])} ${className}`}
        onClick={onClick}
        disabled={disabled}>
        {icon && <span className={`${icon} text-[60px]`}></span>}
        <div className="md:text-[length:var(--middle-fontSize)] lg:text-[length:var(--large-fontSize)]">
          {text}
        </div>
      </button>
    </>
  );
}
