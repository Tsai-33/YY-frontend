import React from "react";

export default function NoCheckBoxTable({ headers = [], data = [], type, name, onChange, checked, idKey, height }) {
  const containerHeight = height || "65vh";
  const innerHeight = height ? `calc(${height} - 1vh)` : "65vh"; // 沒傳就用原本的

  return (
    <div className="w-full bg-[var(--white)] border border-white rounded-md text-center overflow-x-auto" style={{ height: containerHeight }}>
      <div
        className="overflow-y-auto custom-scrollbar"
        style={{
          maxHeight: innerHeight,
          "--scrollbar-thumb-color": `var(--green-vivid)`,
          "--scrollbar-thumb-hover-color": `var(--green-vivid)`,
        }}
      >
        {/* 表頭 */}
        <table className="table-auto w-full sticky top-0 bg-white z-5">
          <thead>
            <tr className={`font-bold text-black bg-[var(--gray-light)] `}>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-4 py-2 border border-white"
                  style={{
                    width: `${header.width}`,
                  }}
                >
                  {header.renderHeader ? header.renderHeader(header) : header.label}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        {/* 內容 */}
        <div className="overflow-y-auto ">
          <table className=" w-full text-black font-bold">
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-green-100 cursor-pointer ${checked === row[idKey] ? "bg-[var(--green-vivid-50)] text-white" : ""}`}
                  onClick={() => onChange("radio", row, idKey)} // ✅ 整行點擊選
                >
                  <input type="radio" checked={checked === row[idKey]} readOnly className="absolute hidden opacity-0 w-0 h-0 pointer-events-none" />
                  {headers.map((header, i) => (
                    <td key={i} style={{ width: header.width }} className="border-[var(--green-vivid)] px-4 py-2 text-center border-b truncate">
                      {header.render ? header.render(row) : row[header.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
