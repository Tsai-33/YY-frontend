import React from "react";
import { X,Check } from "lucide-react";
export default function PurposeTable({ headers = [], data = [],detail=[] }) {

  // 在 return 之前先處理好資料
const mergedData = data.map(row => {
  const match = detail.find(de => de.PRT_NO === row.PRT_NO && de.OUTSTOCK_NO?.split("-").slice(0, 2).join("-") === row.OUTSTOCK_NO);
  return {
    ...row,
    STATUS: match?.STATUS
  };
});



  return (
    <div className="w-full h-full bg-[var(--white)] rounded-md text-center overflow-y-auto custom-scrollbar" style={{ "--scrollbar-thumb-color": `var(--green-vivid)` }}>
      <table className="table-auto w-full">
        <thead className="sticky top-0 bg-white z-5">
          <tr className="bg-[var(--blue-pale)]">
            {headers.map((header, idx) => {
              if (idx === 0) {
                return (
                  <th
                    key={idx}
                    className="relative"
                    style={{
                      boxShadow: "inset 0 0 0 1px #ffffff",
                    }}
                  ></th>
                );
              } else {
                return (
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
                );
              }
            })}
          </tr>
        </thead>
        <tbody className="overflow-y-scroll scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200 ">
          {mergedData.map((row, idx) => {
            if (!row.OUTSTOCK_NO) return;

            return (
              <tr key={idx} className={`px-4 py-2 text-center border-b border-[var(--green-vivid)] text-center`}>
                {headers.map((header, i) => {
                  if (i === 0) {
                    return (
                      <td key={i}>
                        <label className="relative cursor-pointer flex items-center justify-center">
                          <span className="font-bold text-sm">{row.STATUS == 2 ? <Check className="text-green-800 w-6 h-6" strokeWidth={3} /> : <X className="text-red-800 w-6 h-6" strokeWidth={3} />}</span>
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
