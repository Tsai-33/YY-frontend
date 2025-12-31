import { searchStockDetail } from "@/pages/api";
import React, { useState } from "react";

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

  const [expandedRow, setExpandedRow] = useState(null);
  const [detailMap, setDetailMap] = useState({});
  const [loadingRow, setLoadingRow] = useState(null);

  const toggleRow = async (row) => {
    const rowId = row[idKey];
    // console.log("rowId:", rowId);

    // 再點一次 → 收起
    if (expandedRow === rowId) {
      setExpandedRow(null);
      return;
    }

    setExpandedRow(rowId);

    // 已撈過 → 不重撈
    if (detailMap[rowId]) return;

    try {
      setLoadingRow(rowId);

      // 解析入倉單號 (可能有多個)
      const instockNos = row.INSTOCK_NO
        ? row.INSTOCK_NO.split(",").map((s) => s.trim())
        : [];

      const prtNo = row.PRT_NO;

      const payload = {
        prtNo: prtNo,
        instockNos: instockNos,
      };
      const res = await searchStockDetail(payload);
      if (res.data.success) {
        const data = res.data.data;
        // console.log("data:", data);
        setDetailMap((prev) => ({
          ...prev,
          [rowId]: data,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRow(null);
    }
  };

  return (
    <div
      className="w-full bg-(--white) border border-white rounded-md text-center overflow-y-auto custom-scrollbar"
      style={{
        height: containerHeight,
        maxHeight: innerHeight,
        "--scrollbar-thumb-color": `var(--green-vivid)`,
        "--scrollbar-thumb-hover-color": `var(--green-vivid)`,
      }}>
      <table className="table-auto min-w-max text-black text-(length:--font-size-2xl) font-bold">
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
          {data.map((row) => {
            const rowId = row[idKey];
            const isOpen = expandedRow === rowId;
            const details = detailMap[rowId];

            return (
              <React.Fragment key={rowId}>
                {/* ===== 主資料列 ===== */}
                <tr
                  className={`cursor-pointer hover:bg-(--green-pale) ${
                    checked === rowId ? "bg-(--green-vivid-50) text-white" : ""
                  }`}
                  onClick={() => toggleRow(row)}>
                  {headers.map((header, i) => (
                    <td
                      key={i}
                      style={{ width: header.width }}
                      className="border-(--green-vivid) px-4 py-2 border-b truncate">
                      {header.hideInMain
                        ? ""
                        : header.render
                        ? header.render(row)
                        : row[header.key]}
                    </td>
                  ))}
                </tr>

                {/* ===== 展開詳細列 ===== */}
                {isOpen && (
                  <>
                    {/* 載入中 */}
                    {loadingRow === rowId && (
                      <tr className="bg-(--gray-light)">
                        {headers.map((header, i) => (
                          <td
                            key={i}
                            style={{ width: header.width }}
                            className="px-4 py-2 text-(length:--font-size-xl) font-medium text-black text-center">
                            {i === 0 ? "讀取中…" : ""}
                          </td>
                        ))}
                      </tr>
                    )}

                    {/* 已載入完成 - 顯示多列 */}
                    {loadingRow !== rowId &&
                      details &&
                      Array.isArray(details) &&
                      details.length > 0 &&
                      details.map((detail, detailIdx) => {
                        const isLast = detailIdx === details.length - 1;
                        return (
                          <tr
                            key={`${rowId}-detail-${detailIdx}`}
                            className="bg-(--gray-light)">
                            {headers.map((header, i) => (
                              <td
                                key={i}
                                style={{ width: header.width }}
                                className={`px-4 py-2 text-(length:--font-size-xl) font-medium text-black 
                  ${isLast ? "border-b border-(--green-vivid)" : ""}`}>
                                {header.renderDetail
                                  ? header.renderDetail(detail)
                                  : ""}
                              </td>
                            ))}
                          </tr>
                        );
                      })}

                    {/* 無資料 */}
                    {loadingRow !== rowId &&
                      (!details ||
                        !Array.isArray(details) ||
                        details.length === 0) && (
                        <tr className="bg-(--gray-light)">
                          {headers.map((header, i) => (
                            <td
                              key={i}
                              style={{ width: header.width }}
                              className="px-4 py-2 text-(length:--font-size-xl) font-medium text-black text-center">
                              {i === 0 ? "無詳細資料" : ""}
                            </td>
                          ))}
                        </tr>
                      )}
                  </>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
