import React from "react";

export default function PageTitle({ title }) {
  return (
    <>
      <div className="flex justify-center font-bold text-black sm:text-(length:--font-size-4xl)">
        {title}
      </div>
    </>
  );
}
