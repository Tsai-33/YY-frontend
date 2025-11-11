import React from "react";

export default function PageTitle({ title }) {
  return (
    <>
      <div className="flex justify-center font-bold text-[var(--blue-dark)] sm:text-[length:var(--small-fontSize)] md:text-[length:var(--middle-fontSize)] lg:text-[length:var(--large-fontSize)]">
        {title}
      </div>
    </>
  );
}
