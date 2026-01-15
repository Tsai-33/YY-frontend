import React, { useState, useRef } from "react";
import { useRouter } from "next/router";
import ActionBtn from "@/components/common/btns/actionBtn";
import { uploadShelvesMap } from "@/pages/api";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

export default function UploadMapPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 處理檔案選擇
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // 檢查檔案類型
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (
      !validTypes.includes(selectedFile.type) &&
      !selectedFile.name.match(/\.(xlsx|xls)$/i)
    ) {
      Swal.fire({
        icon: "error",
        title: "檔案格式錯誤",
        text: "請上傳 Excel 檔案 (.xlsx 或 .xls)",
      });
      return;
    }

    setFile(selectedFile);

    // 預覽檔案內容
    try {
      const data = await readExcelFile(selectedFile);
      setPreviewData(data.slice(0, 10)); // 只顯示前10筆預覽
    } catch (error) {
      console.error("讀取檔案失敗:", error);
      Swal.fire({
        icon: "error",
        title: "讀取失敗",
        text: "無法讀取 Excel 檔案，請確認檔案格式正確",
      });
    }
  };

  // 讀取 Excel 檔案
  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });

          // 讀取第一個工作表
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // 轉換為 JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // 跳過標題行，轉換為物件格式
          // 欄位對應: F=5, G=6, H=7, I=8
          const rows = jsonData.slice(1).map((row, index) => ({
            rowNum: index + 2,
            mapCode: row[5] || "", // F欄: 地圖編碼
            nodeCode: row[6] || "", // G欄: 貨架停靠點
            dockX: row[7] || 0, // H欄: 停靠座標x
            dockY: row[8] || 0, // I欄: 停靠座標y
          }));

          resolve(rows.filter((row) => row.shelfCode)); // 過濾空行
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // 上傳檔案
  const handleUpload = async () => {
    if (!file) {
      Swal.fire({
        icon: "warning",
        title: "請選擇檔案",
        text: "請先選擇要上傳的 Excel 檔案",
      });
      return;
    }

    // 確認上傳
    const result = await Swal.fire({
      icon: "question",
      title: "確認上傳",
      text: "上傳後將會覆蓋現有的地圖資料，是否繼續？",
      showCancelButton: true,
      confirmButtonText: "確認上傳",
      cancelButtonText: "取消",
      confirmButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      setUploadProgress(10);

      // 讀取完整的 Excel 資料
      const allData = await readExcelFile(file);
      setUploadProgress(30);

      // 分批上傳（每批100筆，處理850筆資料）
      const batchSize = 100;
      const totalBatches = Math.ceil(allData.length / batchSize);

      for (let i = 0; i < totalBatches; i++) {
        const batch = allData.slice(i * batchSize, (i + 1) * batchSize);
        const isFirstBatch = i === 0;
        const isLastBatch = i === totalBatches - 1;

        await uploadShelvesMap({
          data: batch,
          isFirstBatch,
          isLastBatch,
          totalRows: allData.length,
        });

        // 更新進度
        const progress = 30 + Math.round(((i + 1) / totalBatches) * 60);
        setUploadProgress(progress);
      }

      setUploadProgress(100);

      await Swal.fire({
        icon: "success",
        title: "上傳成功",
        text: `成功導入 ${allData.length} 筆貨架地圖資料`,
        timer: 2000,
        showConfirmButton: false,
      });

      // 返回主頁
      router.push("/warehousePlan");
    } catch (error) {
      console.error("上傳失敗:", error);
      Swal.fire({
        icon: "error",
        title: "上傳失敗",
        text: error.response?.data?.message || "無法上傳檔案，請稍後再試",
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // 清除選擇
  const handleClear = () => {
    setFile(null);
    setPreviewData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col flex-1 p-6 gap-6">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl min-w-[300px]">
            <div className="text-center">
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
              <p className="text-lg font-medium text-gray-700">
                上傳中... {uploadProgress}%
              </p>
              <p className="text-sm text-gray-500 mt-2">
                正在處理資料，請勿關閉頁面
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">上傳地圖資料</h1>
        <ActionBtn
          icon="icon-arrow-left"
          text="返回"
          variant="gray"
          onClick={() => router.push("/warehousePlan")}
        />
      </div>

      {/* 上傳區域 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">選擇 Excel 檔案</h2>

        {/* 說明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-800 mb-2">Excel 格式說明：</h3>
          <p className="text-sm text-blue-700 mb-2">
            請確保 Excel 檔案包含以下欄位：
          </p>
          <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
            <li>F欄: 地圖編碼 (地圖標識)</li>
            <li>G欄: 貨架停靠點 (例如: 0001, 0002, 0003)</li>
            <li>H欄: 停靠座標X (數字)</li>
            <li>I欄: 停靠座標Y (數字)</li>
          </ul>
        </div>

        {/* 檔案選擇 */}
        <div className="flex items-center gap-4 mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            id="excel-upload"
          />
          <label
            htmlFor="excel-upload"
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition-colors font-medium">
            選擇檔案
          </label>

          {file && (
            <div className="flex items-center gap-3">
              <span className="text-gray-700">
                已選擇: <strong>{file.name}</strong>
              </span>
              <button
                onClick={handleClear}
                className="text-red-500 hover:text-red-700 text-sm">
                清除
              </button>
            </div>
          )}
        </div>

        {/* 預覽區域 */}
        {previewData.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-3">
              資料預覽（前10筆）：
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2">行號</th>
                    <th className="border border-gray-300 px-3 py-2">
                      地圖編碼
                    </th>
                    <th className="border border-gray-300 px-3 py-2">
                      貨架停靠點
                    </th>
                    <th className="border border-gray-300 px-3 py-2">
                      停靠座標X
                    </th>
                    <th className="border border-gray-300 px-3 py-2">
                      停靠座標Y
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {row.rowNum}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {row.mapCode}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {row.nodeCode}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {row.dockX}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {row.dockY}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              * 僅顯示前10筆資料作為預覽
            </p>
          </div>
        )}

        {/* 上傳按鈕 */}
        <div className="flex gap-4">
          <ActionBtn
            icon="icon-upload"
            text="確認上傳"
            variant="orange"
            onClick={handleUpload}
            disabled={!file || loading}
          />
          <ActionBtn
            icon="icon-close"
            text="取消"
            variant="gray"
            onClick={() => router.push("/warehousePlan")}
          />
        </div>
      </div>
    </div>
  );
}
