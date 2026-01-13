import React from "react";

export default function CheckTable({
  headers = [],
  data = [],
  type,
  name,
  onChange,
  checked,
  idKey,
  height,
}) {
  const isRowChecked = (row) => {
    // 1) 如果是陣列（checkbox 多選或父層傳陣列）
    if (Array.isArray(checked)) {
      return checked.some((id) => String(id) === String(row[idKey]));
    }
    // 2) null / undefined
    if (checked == null) return false;
    // 3) 如果父層傳整個物件
    if (typeof checked === "object") {
      return String(checked[idKey]) === String(row[idKey]);
    }
    // 4) 其他（單一原始值，像是 string 或 number）
    return String(checked) === String(row[idKey]);
  };

  const containerHeight = height || "100%";

  return (
    <div
      className="w-full bg-white border border-white overflow-y-auto custom-scrollbar"
      style={{
        height: containerHeight,
        "--scrollbar-thumb-color": `var(--green-vivid)`,
        "--scrollbar-thumb-hover-color": `var(--green-vivid)`,
      }}>
      {/* 表頭 */}
      <table className="table-fixed w-full text-black text-(length:--font-size-2xl) font-bold">
        <colgroup>
          {headers.map((header, idx) => (
            <col key={idx} style={{ width: header.width }} />
          ))}
        </colgroup>
        <thead>
          <tr className="sticky top-0 bg-(--gray-light) z-5">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-4 py-2 border border-white "
                style={{
                  width: `${header.width}`,
                }}>
                {header.renderHeader
                  ? header.renderHeader(header)
                  : header.label}
              </th>
            ))}
          </tr>
        </thead>
        {/* 內容 */}
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              className={`hover:bg-green-100  ${
                checked === row[idKey] ? "bg-(--green-vivid-50) text-white" : ""
              }`}>
              <td
                className={`px-4 py-2 border-b-3 border-(--green-vivid) text-center`}
                style={{ width: headers[0].width }}>
                <label className="relative cursor-pointer flex items-center justify-center">
                  {/* 隱藏 checkbox */}
                  <input
                    type={type}
                    name={name ? name : "option"}
                    className="peer absolute w-6 h-6 opacity-0 cursor-pointer z-10"
                    checked={isRowChecked(row)}
                    onChange={() => onChange("checkbox", row, idKey)}
                  />
                  {/* 外框 */}
                  <div className="w-6 h-6 rounded-sm border-2 border-(--green-vivid) transition-colors duration-200 peer-checked:bg-(--green-vivid)"></div>
                  <span
                    className={`
                              absolute top-1/2 left-1/2 w-3 h-2
                              border-l-3 border-b-3 border-white
                              -rotate-45 transform -translate-x-1/2 -translate-y-1/2
                              opacity-0 peer-checked:opacity-100
                              transition-opacity duration-200
                            `}></span>
                </label>
              </td>
              {headers.slice(1).map((header, i) => (
                <td
                  key={i}
                  title={header.render ? header.render(row) : row[header.key]}
                  style={{
                    width: `${header.width}`,
                  }}
                  className="px-4 py-2 border-(--green-vivid) text-center border-b-3 truncate">
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
