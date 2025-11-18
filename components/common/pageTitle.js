import React from "react";

export default function PageTitle({ title }) {
  return (
    <>
      <div className="flex justify-center font-bold text-[var(--blue-dark)] sm:text-[length:var(--font-size-4xl)]">
        {title}
      </div>
    </>
  );
}
