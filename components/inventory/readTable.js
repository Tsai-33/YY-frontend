import React from "react";

export default function ReadTable({
  headers = [],
  data = [],
  checked,
  idKey,
  height,
}) {
  const containerHeight = height || "65vh";
  const innerHeight = height ? `calc(${height} - 1vh)` : "65vh"; // 沒傳就用原本的

  return (
    <div
      className="w-full bg-(--white) border border-white rounded-md text-center overflow-y-auto custom-scrollbar"
      style={{
        height: containerHeight,
        maxHeight: innerHeight,
        "--scrollbar-thumb-color": `var(--green-vivid)`,
        "--scrollbar-thumb-hover-color": `var(--green-vivid)`,
      }}>
      {/* 表頭 */}
      <table className="table-auto w-full text-black text-(length:--font-size-2xl) font-bold">
        <thead className="sticky top-0 bg-white z-5">
          <tr className={`bg-(--gray-light)`}>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-4 py-2 whitespace-pre-line bg-(--gray-light)"
                style={{
                  width: `${header.width}`,
                  boxShadow: "inset 0 0 0 1px #ffffff",
                }}>
                {header.renderHeader
                  ? header.renderHeader(header)
                  : header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ridx) => (
            <tr
              key={ridx}
              className={`hover:bg-(--green-pale) ${
                checked === row[idKey] ? "bg-(--green-vivid-50) text-white" : ""
              }`}>
              <td className="absolute hidden">
                <input
                  type="radio"
                  checked={checked === row[idKey]}
                  readOnly
                  className="opacity-0 w-0 h-0 pointer-events-none"
                />
              </td>
              {headers.map((header, i) => (
                <td
                  key={i}
                  style={{ width: header.width }}
                  className="border-(--green-vivid) px-4 py-2 border-b truncate">
                  {header.render ? header.render(row) : row[header.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
