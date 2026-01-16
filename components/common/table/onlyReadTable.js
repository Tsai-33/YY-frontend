import { searchStockDetail } from "@/pages/api";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function OnlyReadTable({
  headers = [],
  data = [],
  hasSearched = false,
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
      if (res?.data?.success) {
        const data = res.data.data;
        // console.log("data:", data);
        setDetailMap((prev) => ({
          ...prev,
          [rowId]: data,
        }));
      } else {
        Alert({ title: res?.error?.message });
      }
    } catch (err) {
      console.warn(err);
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
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                className="bg-white text-center border-b border-(--green-vivid)"
                style={{ height: `calc(${innerHeight} - 50px)` }} // 減去 Header 的大約高度
              >
                {hasSearched ? (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <span className="text-5xl mb-2">🔍</span>
                    <div className="text-(length:--font-size-2xl) font-bold text-gray-500">
                      找不到相對應的資料
                    </div>
                    <p className="text-lg mt-1">請確認搜尋條件是否正確</p>
                  </div>
                ) : (
                  <div className="text-gray-300 text-(length:--font-size-xl)">
                    請輸入條件並點擊查詢
                  </div>
                )}
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const rowId = row[idKey];
              const isOpen = expandedRow === rowId;
              const details = detailMap[rowId];

              return (
                <React.Fragment key={rowId}>
                  {/* ===== 主資料列 ===== */}
                  <tr
                    className={`cursor-pointer hover:bg-(--green-pale) ${
                      checked === rowId
                        ? "bg-(--green-vivid-50) text-white"
                        : ""
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
                  <AnimatePresence>
                    {isOpen && (
                      <tr className="bg-(--gray-light)">
                        {/* 1. 使用 colSpan 確保這一列佔滿全部寬度，避免跑位 */}
                        <td
                          colSpan={headers.length}
                          className="p-0 border-none">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden">
                            {/* 2. 內部嵌套一個 table 以維持與 Header 一致的對齊感 */}
                            <table className="w-full table-fixed ">
                              <tbody>
                                {/* 載入中 */}
                                {loadingRow === rowId && (
                                  <tr>
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
                                  details?.length > 0 &&
                                  details.map((detail, detailIdx) => {
                                    const isLast =
                                      detailIdx === details.length - 1;
                                    return (
                                      <tr key={`${rowId}-detail-${detailIdx}`}>
                                        {headers.map((header, i) => (
                                          <td
                                            key={i}
                                            style={{ width: header.width }}
                                            className={`px-4 py-2 text-(length:--font-size-xl) font-medium text-black truncate ${
                                              isLast
                                                ? "border-b border-(--green-vivid)"
                                                : ""
                                            }`}>
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
                                  (!details || details.length === 0) && (
                                    <tr>
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
                              </tbody>
                            </table>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
