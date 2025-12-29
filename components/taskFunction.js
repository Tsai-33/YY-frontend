import { checkTask } from "@/pages/api";
export const selectTask = async (data) => {
  try {
    return await checkTask(data);
  } catch (err) {
    console.warn(`checkTask :`, err);
  }
};
