import React from "react";
import clsx from "clsx";

export default function Table({
  headers = [],
  data = [],
  variant,
  type,
  name,
  needInput,
  onChange,
  checked,
  idKey,
  height,
  onChangeAll = null,
  fontsize = null,
}) {
  const variants = {
    darkBlue: `var(--blue-dark)`,
    skyBlue: `var(--blue-sky)`,
    green: `var(--aqua)`,
    red: `var(--red)`,
    purple: `var(--purple)`,
    orange: `var(--orange-soft)`,
  };

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

  const containerHeight = height || "50vh";
  const innerHeight = height
    ? `calc(${height} - 1vh)` // 如果有傳，動態計算
    : "49vh"; // 沒傳就用原本的

  return (
    <div
      className="w-full bg-white border border-white rounded-md text-center overflow-x-auto"
      style={{ height: containerHeight }}>
      <div
        className="overflow-y-auto custom-scrollbar"
        style={{
          maxHeight: innerHeight,
          "--scrollbar-thumb-color": variants[variant],
          "--scrollbar-thumb-hover-color": variants[variant], // 可不同色
        }}>
        {/* 表頭 */}
        <div className="sticky top-0 z-20">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className={` text-white bg-[${clsx(variants[variant])}] `}>
                {/* 需要input在拉入 */}
                {needInput && (
                  <th className="w-12 border border-white relative">
                    <div className="w-5 h-5 border bg-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                    {/* 全選功能 */}
                    <label className="relative w-10 h-10 mx-auto cursor-pointer">
                      <input
                        type={type}
                        name={name ? name : "all"}
                        className="peer absolute w-0 h-0"
                        onChange={() => onChangeAll(data, idKey)}
                      />
                      <div
                        className={` w-6 h-6 border-3 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-sm`}
                        style={{ borderColor: variants[variant] }}></div>
                      <span
                        className={` absolute top-1/2 left-1/2 w-[10px] h-[14px] border-b-3 border-r-3 rotate-45 transform -translate-x-1/2 -translate-y-2 opacity-0 peer-checked:opacity-100`}
                        style={{ borderColor: variants[variant] }}></span>
                    </label>
                  </th>
                )}
                {headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-2 border border-white"
                    style={{
                      width: `${header.width}`,
                      fontSize: fontsize || "var(--middle-fontSize)",
                    }}>
                    {header.renderHeader
                      ? header.renderHeader(header)
                      : header.label}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        {/* 表頭 */}
        <div className="overflow-y-auto">
          <table className="w-full table-fixed border-collapse">
            <tbody className="h-64 overflow-y-scroll scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200">
              {data.map((row, idx) => (
                <tr key={idx} className="bg-white-50">
                  {/* 需要input在拉入 */}
                  {needInput && (
                    <td
                      className={`px-4 py-2 text-center border-b text-black`}
                      style={{ borderColor: variants[variant] }}>
                      <label className="relative w-10 h-10 mx-auto cursor-pointer">
                        <input
                          type={type}
                          name={name ? name : "option"}
                          className="peer absolute w-0 h-0"
                          onChange={() => onChange(row, idKey)}
                          checked={isRowChecked(row)}
                        />
                        <div
                          className={`w-6 h-6 border-3 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-sm`}
                          style={{ borderColor: variants[variant] }}></div>
                        <span
                          className={` absolute top-1/2 left-1/2 w-[10px] h-[14px] border-b-3 border-r-3 rotate-45 transform -translate-x-1/2 -translate-y-2 opacity-0 peer-checked:opacity-100`}
                          style={{ borderColor: variants[variant] }}></span>
                      </label>
                    </td>
                  )}
                  {headers.map((header, i) => (
                    <td
                      key={i}
                      title={
                        header.render ? header.render(row) : row[header.key]
                      }
                      style={{
                        width: `${header.width}`,
                        borderColor: variants[variant],
                        fontSize: fontsize || "var(--middle-fontSize)",
                      }}
                      className={`px-4 py-2 ${
                        row.Stockout == 1 ? "text-red-500" : "text-black"
                      } text-center border-b truncate`}>
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
