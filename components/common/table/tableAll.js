import React from "react";

export default function TableAll({ headers = [], data = [], type, name, onChange, checked, idKey, height, selectAllRef, onChangeAll }) {
 const isRowChecked = (row) => {
  const rowId = String(row[idKey]);

  // 1) checked 是陣列 → 逐筆比對
  if (Array.isArray(checked)) {
    return checked.some(item => {
      if (typeof item === "object") return String(item[idKey]) === rowId;
      return String(item) === rowId;
    });
  }

  // 2) null / undefined
  if (checked == null) return false;

  // 3) checked 是物件
  if (typeof checked === "object") {
    return String(checked[idKey]) === rowId;
  }

  // 4) 原始值
  return String(checked) === rowId;
};


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
          "--scrollbar-thumb-color": `var(--green-vivid)`,
          "--scrollbar-thumb-hover-color": `var(--green-vivid)`,
        }}
      >
        {/* 表頭 */}
        <table className="table-auto w-full sticky top-0 bg-white z-5">
          <thead>
            <tr className={`font-bold text-black bg-[var(--gray-light)]`}>
              {headers.map((header, idx) => {
                if (idx === 0) {
                  return (
                    <th className="border border-white relative">
                      <div className="w-5 h-5 border bg-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                      <label className="relative w-10 h-10 mx-auto cursor-pointer">
                        <input type={type} name={name ? name : "all"} className="peer absolute w-0 h-0" onChange={() => onChangeAll(data, idKey)} ref={selectAllRef} />
                        <div className={` w-6 h-6 border-3 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-sm`}></div>
                        <span className={` absolute top-1/2 left-1/2 w-[10px] h-[14px] border-b-3 border-r-3 rotate-45 transform -translate-x-1/2 -translate-y-2 opacity-0 peer-checked:opacity-100`}></span>
                      </label>
                    </th>
                  );
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
                        <td>
                          <label className="relative cursor-pointer flex items-center justify-center">
                            {/* 隱藏 checkbox */}
                            <input type={type} name={name ? name : "option"} className="peer absolute w-6 h-6 opacity-0 cursor-pointer z-10" checked={isRowChecked(row)} onChange={() => onChange("checkbox", row, idKey)} />
                            {/* 外框 */}
                            <div className="w-6 h-6 rounded-sm border-2 border-[var(--green-vivid)] transition-colors duration-200 peer-checked:bg-[var(--green-vivid)]"></div>
                            <span
                              className={`
                              absolute top-1/2 left-1/2 w-3 h-2
                              border-l-3 border-b-3 border-white
                              -rotate-45 transform -translate-x-1/2 -translate-y-1/2
                              opacity-0 peer-checked:opacity-100
                              transition-opacity duration-200
                            `}
                            ></span>
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
