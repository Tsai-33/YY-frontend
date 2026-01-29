import React from "react";
import LoadingText from "../loading/loading-text";

export default function NoCheckBoxTable({ headers = [], data = [], onChange, checked, idKey }) {
  return (
    <div className="w-full h-full bg-white border border-white text-center overflow-y-auto custom-scrollbar" style={{ "--scrollbar-thumb-color": `var(--green-vivid)` }}>
      {data.length <= 0 ? (
        <LoadingText />
      ) : (
        <table className="table-fixed w-full">
          <thead>
            <tr className={`sticky top-0 z-5 bg-(--gray-light)`}>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-4 py-2"
                  style={{
                    width: `${header.width}`,
                    boxShadow: "inset 0 0 0 1px #ffffff",
                  }}
                >
                  {header.renderHeader ? header.renderHeader(header) : header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, ridx) => (
              <tr
                key={ridx}
                className={`hover:bg-(--green-pale) cursor-pointer ${checked === row[idKey] ? "bg-[var(--green-vivid-50)] text-white" : ""}`}
                onClick={() => onChange("radio", row, idKey)} // ✅ 整行點擊選
              >
                <td className="hidden">
                  <input type="radio" checked={checked === row[idKey]} readOnly className="opacity-0 w-0 h-0 pointer-events-none" />
                </td>
                {headers.map((header, i) => (
                  <td key={i} style={{ width: header.width }} className="border-(--green-vivid) px-4 py-2 border-b-3 truncate">
                    {header.render ? header.render(row) : row[header.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
