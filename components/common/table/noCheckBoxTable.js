import React from "react";

export default function NoCheckBoxTable({
  headers = [],
  data = [],
  type,
  name,
  onChange,
  checked,
  idKey,
}) {
  return (
    <div
      className="w-full h-full bg-[var(--white)] border border-white text-center overflow-y-auto custom-scrollbar text-(length:--font-size-2xl)"
      style={{
        "--scrollbar-thumb-color": `var(--green-vivid)`,
        "--scrollbar-thumb-hover-color": `var(--green-vivid)`,
      }}>
      {/* 表頭 */}
      <table className="table-auto w-full">
        <thead className="sticky top-0 bg-white z-5">
          <tr className={`bg-[var(--gray-light)]`}>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-4 py-2 whitespace-pre-line bg-[var(--gray-light)]"
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
              className={`hover:bg-[var(--green-pale)] cursor-pointer ${
                checked === row[idKey]
                  ? "bg-[var(--green-vivid-50)] text-white"
                  : ""
              }`}
              onClick={() => onChange("radio", row, idKey)} // ✅ 整行點擊選
            >
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
                  className="border-[var(--green-vivid)] px-4 py-2 border-b truncate">
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
