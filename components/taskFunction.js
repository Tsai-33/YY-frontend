import { checkTask } from "@/pages/api";
export const selectTask = async (type) => {
  try {
    return await checkTask({ type: type });
  } catch (err) {
    console.warn(`checkTask :`, err);
  }
};
