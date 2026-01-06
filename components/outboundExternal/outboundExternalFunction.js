import { checkTask, updateTask, deleteTask } from "@/pages/api";
import { selectTask } from "../taskFunction";

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
    return await updateTask({ stations: stations[0], location: "outboundExternal" });
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
