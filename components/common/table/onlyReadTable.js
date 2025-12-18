import React from "react";

export default function OnlyReadTable({
  headers = [],
  data = [],
  type,
  name,
  onChange,
  checked,
  idKey,
  height,
}) {
  const containerHeight = height || "65vh";
  const innerHeight = height ? `calc(${height} - 1vh)` : "65vh"; // 沒傳就用原本的

  return (
    <div
      className="w-full bg-white border rounded-md overflow-x-auto overflow-y-auto custom-scrollbar"
      style={{
        height: containerHeight,
        "--scrollbar-thumb-color": `var(--green-vivid)`,
        "--scrollbar-thumb-hover-color": `var(--green-vivid)`,
      }}>
      <table className="table-fixed min-w-max text-black text-(length:--font-size-2xl) font-bold">
        <colgroup>
          {headers.map((header, idx) => (
            <col key={idx} style={{ width: header.width }} />
          ))}
        </colgroup>

        <thead className="sticky top-0 bg-(--gray-light) z-5">
          <tr>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-4 py-2 border border-white whitespace-pre-line">
                {header.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              className={`hover:bg-green-100  ${
                checked === row[idKey] ? "bg-(--green-vivid-50) text-white" : ""
              }`}>
              {headers.map((header, i) => (
                <td
                  key={i}
                  className="px-4 py-2 text-center border-b border-(--green-vivid) truncate">
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
