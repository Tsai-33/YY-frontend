import { checkTask, updateTask, deleteTask, sendToWMS } from "@/pages/api";
import { selectTask } from "../taskFunction";
import { generateRandomNumber } from "@/utils/random";

// 確認出庫單 - 呼叫 WMS
export const confrimList_out = async (setLoading, order, stationNo) => {
  try {
    setLoading(true);
    const dataId = generateRandomNumber();
    const data = {
      action: "ask_wave",
      dataid: dataId,
      wave_no: String(order.W_ID),
      station_no: stationNo,
    };
    const res = await sendToWMS(data);

    // 檢查 axios 攔截器返回的 success 狀態
    if (!res?.success) {
      return {
        success: false,
        error: { message: res?.error?.message || "WMS 回應錯誤" },
        code: null
      };
    }

    return { success: true, data: res?.data, code: null };
  } catch (err) {
    console.warn("confrimList_out:", err);
    return {
      success: false,
      error: { message: err?.message || "出庫確認失敗" },
      code: err?.code || null
    };
  } finally {
    setLoading(false);
  }
};

// 檢查是否有其他任務正在執行
export const checkTask_out = async (stations) => {
  try {
    return await selectTask({ stations: stations[0] });
  } catch (err) {
    console.warn(`checkTask_out:`, err);
  }
};

// 新增任務紀錄
export const addTask_out = async (stations) => {
  try {
    return await updateTask({ stations: stations[0], location: "outboundInternal" });
  } catch (err) {
    console.warn(`addTask_out:`, err);
  }
};

// 刪除任務紀錄
export const deleteTask_out = async (stations) => {
  try {
    return await deleteTask({ stations: stations[0] });
  } catch (err) {
    console.warn(`deleteTask_out:`, err);
  }
};
