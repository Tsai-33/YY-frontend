import { addShelf, getTransfer, getTransferByWID, getTransferDetail, sendToWMS } from "@/pages/api";
import { resetTransfer } from "@/redux/reducer/reducerTransfer";
import { generateRandomNumber } from "@/utils/random";

// 抓取ERP最新調撥單
export const getEPRdata = async (inputBarCode, setTableData, setTableTotalData2) => {
  try {
    const random = generateRandomNumber();
    const data = { action: "ask_order", NO: inputBarCode, dataid: random };
    const res = await sendToWMS(data);
    if (res.data.success) {
      getTable(setTableData, setTableTotalData2);
    }
  } catch (error) {
    console.warn(`transfer handleBarCode :`, error);
  }
};

// 抓取WMS系統所有調撥單
export const getTable = async (setTableData, setTableTotalData2) => {
  try {
    const [order, orderDetail] = await Promise.all([getTransfer(), getTransferDetail()]);

    if (order.data.success) {
      setTableData(order.data.data);
    }

    if (orderDetail.data.success) {
      setTableTotalData2(orderDetail.data.data);
    }
  } catch (err) {
    console.warn(`transfer getTable:`, err);
  }
};

// 抓取WMS系統所有調撥單的詳細資料
export const getList = async (waveNo, setTableData2) => {
  try {
    const res = await getTransferByWID(waveNo);
    if (res.data.success) {
      const detail = res.data.data; // 陣列
      const newDetail = detail.map((v) => ({ ...v, type: "new", checked: false }));
      setTableData2(newDetail);
    }
  } catch (err) {
    console.warn("transfer getList:", err);
  }
};

// 確認要處理此張調撥單
export const checkConfirmTransfer = async (setLoading, order) => {
  try {
    setLoading(true);
    // 傳給WMS
    const random9 = generateRandomNumber();
    const data = { action: "ask_wave", dataid: random9, wave_no: String(order.W_ID), station_no: "A" };
    const res = await sendToWMS(data);
    // console.log("handleConfirm 回應 :", res);

    if (res?.data?.success) {
      // 有派車的站，顯示不同顏色
      let lack_station = res.data.data.message2;
      if (!Array.isArray(lack_station)) {
        try {
          // 嘗試把字串轉成陣列
          lack_station = JSON.parse(lack_station.replace(/'/g, '"'));
        } catch (e) {
          console.warn("lack_station 格式錯誤:", lack_station, e);
          lack_station = []; // fallback 防止爆掉
        }
      }
      return { success: res.data.success, data: lack_station };
    } else {
      return { success: res.data.success, data: res.error.status };
    }
  } catch (err) {
    console.warn("handleConfirm :", err);
    return err;
  } finally {
    setLoading(false);
  }
};
