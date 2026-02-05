import { selectTask } from "../taskFunction";
import { updateTask, deleteTask } from "@/pages/api";

// 檢查是否有其他任務正在執行
export const checkTask_shelfTransfer = async (stations) => {
  try {
    return await selectTask({ stations: stations[0] });
  } catch (err) {
    console.warn(`checkTask_shelfTransfer:`, err);
  }
};

// 新增任務紀錄
export const addTask_shelfTransfer = async (stations) => {
  try {
    return await updateTask({ stations: stations[0], location: "shelfTransfer" });
  } catch (err) {
    console.warn(`addTask_shelfTransfer:`, err);
  }
};

// 刪除任務紀錄
export const deleteTask_shelfTransfer = async (stations) => {
  try {
    console.log("stations: ", stations)
    return await deleteTask({ stations: stations[0] });
  } catch (err) {
    console.warn(`deleteTask_shelfTransfer:`, err);
  }
};
