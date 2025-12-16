import clsx from "clsx";
import React from "react";

export default function PurposeTable({ headers = [], data = [], height }) {
  console.log(data, "data");

  const containerHeight = height || "65vh";
  const innerHeight = height
    ? `calc(${height} - 1vh)` // 如果有傳，動態計算
    : "65vh"; // 沒傳就用原本的

  return (
    <div className="w-full bg-[var(--white)] border border-white rounded-md text-center overflow-x-auto" style={{ height: containerHeight }}>
      <div
        className="overflow-y-auto custom-scrollbar"
        style={{
          maxHeight: innerHeight,
          "--scrollbar-thumb-color": `var(--blue-pale)`,
          "--scrollbar-thumb-hover-color": `var(--blue-pale)`,
        }}
      >
        {/* 表頭 */}
        <table className="table-auto w-full sticky top-0 bg-white z-5">
          <thead>
            <tr className="font-bold text-black bg-[var(--blue-pale)]">
              {headers.map((header, idx) => {
                if (idx === 0) {
                  return <th key={idx} className="border border-white relative"></th>;
                } else {
                  return (
                    <th
                      key={idx}
                      className="px-4 py-2 border border-white"
                      style={{
                        width: `${header.width}`,
                      }}
                    >
                      {header.renderHeader ? header.renderHeader(header) : header.label}
                    </th>
                  );
                }
              })}
            </tr>
          </thead>
        </table>
        {/* 內容 */}
        <div className="overflow-y-auto ">
          <table className="table-auto w-full text-black font-bold">
            <tbody className="h-100 overflow-y-scroll scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200 ">
              {data.map((row, idx) => (
                <tr key={idx} className={`px-4 py-2 text-center border-b border-[var(--green-vivid)] text-center`}>
                  {headers.map((header, i) => {
                    if (i === 0) {
                      return (
                        <td key={i}>
                          <label className="relative cursor-pointer flex items-center justify-center">
                            <span className="font-bold text-sm">{row.checked ? "V" : "X"}</span>
                          </label>
                        </td>
                      );
                    } else {
                      return (
                        <td
                          key={i}
                          title={header.render ? header.render(row) : row[header.key]}
                          style={{
                            width: `${header.width}`,
                          }}
                          className="border-[var(--green-vivid)] px-4 py-2 text-center border-b truncate"
                        >
                          {header.render ? header.render(row) : row[header.key]}
                        </td>
                      );
                    }
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
