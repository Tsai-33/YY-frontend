import * as XLSX from 'xlsx';

/**
 * 導出用戶操作日誌到 Excel
 * Export user logs to Excel file
 * 
 * @param {Array} logs - 用戶日誌數據陣列 (Array of user log objects)
 * @param {number|null} userId - 用戶ID (User ID, optional for filename)
 * @param {string} startTime - 開始時間 (Start time for filename)
 * @param {string} endTime - 結束時間 (End time for filename)
 */
export function exportUserLogsToExcel(logs, userId = null, startTime = '', endTime = '') {
  try {
    // 檢查數據是否有效
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      throw new Error('沒有可導出的日誌數據');
    }

    // 定義 Excel 表頭 (中文)
    const headers = [
      '日誌ID',
      '用戶ID',
      '用戶名稱',
      '操作',
      '模組',
      '路由',
      '方法',
      '請求數據',
      '響應數據',
      'IP地址',
      'User Agent',
      '成功',
      '創建時間'
    ];

    // 定義對應的數據欄位 (英文)
    const fields = [
      'LogId',
      'UserId',
      'UserName',
      'Action',
      'Module',
      'Route',
      'Method',
      'RequestData',
      'ResponseData',
      'IpAddress',
      'UserAgent',
      'Success',
      'CreatedAt'
    ];

    // 轉換數據格式
    const worksheetData = logs.map((log) => {
      const row = {};
      fields.forEach((field, index) => {
        // 處理 UserName: 查找不區分大小寫 (SQL Server 可能返回不同的 case)
        let value;
        if (field === 'UserName') {
          // 嘗試多種可能的 key 名稱 (case-insensitive)
          value = log[field] || log['username'] || log['userName'] || log['USERNAME'] || null;
        } else {
          // 其他欄位正常讀取
          value = log[field];
        }
        
        // 處理特殊欄位
        if (field === 'Success') {
          value = value ? '是' : '否';
        } 
        else if (field === 'CreatedAt') {
          // 格式化日期時間
          if (value instanceof Date) {
            value = value
              .toISOString()
              .replace("T", " ")
              .replace("Z", "")
              .slice(0, 19);
          }
          // 如果是字串，就直接處理
          else if (typeof value === "string") {
            value = value.replace("T", " ").replace("Z", "").slice(0, 19);
          }
          // 如果 value 為 null/undefined，設為空字串
          else if (value == null) {
            value = '';
          }
        }
        else if (field === 'RequestData' || field === 'ResponseData') {
          // 如果數據太長，截斷顯示
          if (value && value.length > 100) {
            value = value.substring(0, 100) + '...';
          }
        }
        
        // 將處理後的值賦予對應的表頭
        row[headers[index]] = value ?? '';
      });
      return row;
    });

    // 創建工作簿
    const workbook = XLSX.utils.book_new();
    
    // 創建工作表
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);

    // 設置列寬
    const columnWidths = [
      { wch: 12 }, // 日誌ID
      { wch: 10 }, // 用戶ID
      { wch: 15 }, // 用戶名稱
      { wch: 25 }, // 操作
      { wch: 20 }, // 模組
      { wch: 40 }, // 路由
      { wch: 8 },  // 方法
      { wch: 30 }, // 請求數據
      { wch: 30 }, // 響應數據
      { wch: 18 }, // IP地址
      { wch: 50 }, // User Agent
      { wch: 8 },  // 成功
      { wch: 20 }  // 創建時間
    ];
    worksheet['!cols'] = columnWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '用戶操作日誌');

    // 生成文件名
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let filename = `用戶操作日誌_${timestamp}`;
    
    if (userId) {
      filename += `_用戶${userId}`;
    }
    
    if (startTime && endTime) {
      const start = startTime.slice(0, 10).replace(/-/g, '');
      const end = endTime.slice(0, 10).replace(/-/g, '');
      filename += `_${start}_${end}`;
    }
    
    filename += '.xlsx';

    // 導出文件
    XLSX.writeFile(workbook, filename);

    return {
      success: true,
      filename,
      message: 'Excel 文件導出成功'
    };
  } catch (error) {
    console.warn('導出 Excel 失敗:', error);
    throw new Error(`導出 Excel 失敗: ${error.message}`);
  }
}

