import React from "react";
import clsx from "clsx";

export default function ActionBtn({ icon, text, variant, onClick, disabled, className, textSize }) {
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
      hover:bg-[var(--blue-muted)] 
      hover:border-white 
      hover:text-black 
      focus:bg-[var(--gray)] 
      focus:border-white 
      focus:text-white 
      focus:hover:bg-[var(--gray)] 
      focus:hover:border-white 
      focus:hover:text-white 
      disabled:opacity-80 
      disabled:cursor-not-allowed 
      disabled:pointer-events-none 
      disabled:border-white 
      disabled:bg-[#4A9BC833]
      disabled:text-[#7B7B7B]
      `,
    yellow: `
      bg-[var(--yellow-primary)] 
      border border-[var(--white)] 
      text-white 
      hover:bg-[var(--yellow-accent)] 
      hover:border-white 
      hover:text-white 
      focus:bg-[var(--yellow-soft)] 
      focus:border-white 
      focus:text-[#B9B6AC] 
      focus:hover:bg-[var(--yellow-soft)] 
      focus:hover:border-white 
      focus:hover:text-[#B9B6AC]
      disabled:bg-[var(--yellow-pale)]
      disabled:cursor-not-allowed 
      disabled:pointer-events-none 
      disabled:border-white 
      disabled:text-[#73737380]
      `,
    green: `
      bg-[var(--green-vivid)] 
      border border-[var(--white)] 
      text-white 
      hover:bg-[var(--green-vivid-30)] 
      hover:border-white 
      hover:text-[var(--white)]
      focus:bg-[var(--green-vivid-30)] 
      focus:border-white 
      focus:text-[var(--primary-color)] 
      focus:hover:bg-[var(--green-vivid-30)] 
      focus:hover:border-white 
      focus:hover:text-[var(--green-vivid)] 
      disabled:opacity-80 
      disabled:bg-[#008B4833] 
      disabled:cursor-not-allowed 
      disabled:pointer-events-none 
      disabled:border-white 
      disabled:text-[#83A79B]
      `,
    orange: `
      bg-[var(--orange-main)] 
      border border-[var(--orange-vivid)] 
      text-white 
      hover:bg-[var(--orange-light)] 
      hover:border-[var(--white)]
      hover:text-[var(--white)]
      focus:bg-[var(--orange-pale)] 
      focus:border-[var(--white)] 
      focus:text-[var(--orange-main)] 
      focus:hover:bg-[var(--orange-pale)] 
      focus:hover:border-[var(--white)] 
      focus:hover:text-[var(--orange-main)]
      disabled:opacity-80 
      disabled:bg-[var(--orange-ivory)] 
      disabled:cursor-not-allowed 
      disabled:pointer-events-none 
      disabled:border-white 
      disabled:text-[var(--orange-muted)]
      `,
    rose: `
      bg-[var(--rose-primary)] 
      border border-[var(--white)] 
      text-white 
      hover:bg-[var(--rose-accent)] 
      hover:border-white 
      hover:text-white 
      focus:bg-[var(--rose-soft)] 
      focus:border-white 
      focus:text-[var(--rose-primary)] 
      focus:hover:bg-[var(--rose-soft)] 
      focus:hover:border-white 
      focus:hover:text-[var(--rose-primary)]
      disabled:opacity-80 
      disabled:cursor-not-allowed 
      disabled:pointer-events-none 
      disabled:border-white 
      disabled:text-[var(--rose-tint)]
      disabled:bg-[var(--rose-muted)]
      `,
    violet: `
      bg-[var(--violet-primary)] 
      border border-[var(--white)] 
      text-white 
      hover:bg-[var(--violet-accent)] 
      hover:border-white 
      hover:text-white 
      focus:bg-[var(--violet-soft)] 
      focus:border-white 
      focus:text-[var(--violet-accent)]
      focus:hover:bg-[var(--violet-soft)] 
      focus:hover:border-white 
      focus:hover:text-[var(--violet-accent)]
      disabled:opacity-80 
      disabled:cursor-not-allowed 
      disabled:pointer-events-none 
      disabled:border-white 
      disabled:text-white
      disabled:bg-[var(--violet-light)] 
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
    disabled:text-[#73737380]
      `,

    gray: `
      bg-[#6B7280] 
      border border-[#9CA3AF] 
      text-white 
      hover:bg-[#4B5563] 
      hover:border-white 
      hover:text-white 
      focus:bg-[#9CA3AF] 
      focus:border-white 
      focus:text-[#374151] 
      focus:hover:bg-[#9CA3AF] 
      focus:hover:border-white 
      focus:hover:text-[#374151]
      disabled:opacity-80 
      disabled:cursor-not-allowed 
      disabled:pointer-events-none 
      disabled:border-white 
      disabled:bg-[#D1D5DB]
      disabled:text-[#9CA3AF]
    `,
  };
  return (
    <>
      <button className={` ${clsx(base, variants[variant])}  ${className}`} onClick={onClick} disabled={disabled}>
        {icon && <span className={`${icon} text-[length:var(--font-size-6xl)]`}></span>}
        <div className={`md:text-[length:var(--font-size-2xl)] lg:text-[length:var(--font-size-4xl)]`}   style={{ fontSize: textSize }}>{text}</div>
      </button>
    </>
  );
}
