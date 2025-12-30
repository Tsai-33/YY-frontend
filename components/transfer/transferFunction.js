import { addShelf, addTransferWCS, checkTask, checkWCSMove, checkWCS, checkWCSWaveno, deleteTask, finishTransferOrder, getOrder, getOrderDetail, getOrderDetailByWID, restoreOrders, sendToWMS, updateTask, updateTransferWMS, updateTransferWMSAbnormal } from "@/pages/api";
import { generateRandomNumber } from "@/utils/random";
import { selectTask } from "../taskFunction";

// 抓取ERP
export const getEPR = async (setLoading, inputBarCode, setTableData, setTableTotalData2) => {
  setLoading(true);
  try {
    const random = generateRandomNumber();
    const data = { action: "ask_order", NO: inputBarCode, dataid: random };
    const res = await sendToWMS(data);
    if (res?.data?.success) {
      await getTable(setTableData, setTableTotalData2);
    }
  } catch (error) {
    console.warn(`handleBarCode :`, error);
  } finally {
    setLoading(false);
  }
};

// 抓取WMS系統所有調撥單
export const getTable = async (setTableData, setTableTotalData2) => {
  try {
    const [order, orderDetail] = await Promise.all([getOrder("F"), getOrderDetail()]);

    if (order.data.success) {
      setTableData(order.data.data);
    }

    if (setTableTotalData2 && orderDetail.data.success) {
      setTableTotalData2(orderDetail.data.data);
    }
  } catch (err) {
    console.warn(`getTable:`, err);
  }
};

// 訂單明細
export const getList = async (waveNo, setTableData2) => {
  try {
    const res = await getOrderDetailByWID(waveNo);
    if (res.data.success) {
      const detail = res.data.data; // 陣列
      const newDetail = detail.filter((v) => v.OUTSTOCK_NO).map((v) => ({ ...v }));
      setTableData2(newDetail);
    }
  } catch (err) {
    console.warn("transfer getList:", err);
  }
};

// 確認訂單
export const confrimList_tr = async (setLoading, order) => {
  try {
    setLoading(true);
    // 傳給WMS
    const random9 = generateRandomNumber();
    const data = { action: "ask_wave", dataid: random9, wave_no: String(order.W_ID), station_no: "A" };
    const res = await sendToWMS(data);
    return res?.data?.data;
  } catch (err) {
    console.warn("handleConfirm :", err);
    return err;
  } finally {
    setLoading(false);
  }
};

// 新增
export const addShelf_tr = async (setLoading, setAddModal, shelf, order) => {
  setLoading(true);
  try {
    return await addTransferWCS({ area: shelf?.area, W_ID: order?.W_ID });
  } catch (err) {
    console.warn("handleAddShelf :", err);
  } finally {
    setLoading(false);
    setAddModal(false);
  }
};

// 退回
export const returnShelf_tr = async (setLoading, currentStation, shelf, order) => {
  try {
    const random9 = generateRandomNumber();
    const data = { Command: "RETURN", SHELVE_ID: shelf?.SHELVE_ID, BAR_CODE: "", FACE: 2, STATION: currentStation, PURPOSE: 3, STATUS: 0, CART_ID: "", DATA_ID: random9, WAVENO: String(order.W_ID), GGROUP: String(order.W_ID) };
    return await addShelf(data);
  } catch (err) {
    console.warn("handleReturnShelf :", err);
  } finally {
    setLoading(false);
  }
};

// 全退回
export const cancelShelf_tr = async (setLoading, currentStation) => {
  setLoading(true);
  try {
    const random9 = generateRandomNumber();
    const data = { action: "cancel", dataid: random9, STATION: currentStation };
    return await sendToWMS(data);
  } catch (err) {
    console.warn("handleReturnShelf :", err);
  } finally {
    setLoading(false);
  }
};

// 未完成 返回
export const restoreList_tr = async (setLoading, waveNo) => {
  try {
    return await restoreOrders({ W_ID: waveNo });
  } catch (err) {
    console.warn(`handleReturnShelf :`, err);
  } finally {
    setLoading(false);
  }
};

// 完成調撥單
export const finishList_tr = async (setLoading, order, setFinishModal) => {
  setLoading(true);
  try {
    return await finishTransferOrder({ W_ID: order.W_ID, BILL_TIME: order.BILL_TIME, WORK_TIME: order.WORK_TIME });
  } catch (err) {
    console.warn(`handleFinish :`, err);
  } finally {
    setLoading(false);
    setFinishModal(false);
  }
};

// 更改數量
export const updateWMS_tr = async (setLoading, selected, shelf, order, addShelf, setConfirmModal) => {
  setLoading(true);
  try {
    // 傳給WMS
    const data = { itemArray: selected, SHELVE_ID: shelf.SHELVE_ID, BILL_TIME: order.BILL_TIME, WORK_TIME: order.WORK_TIME, CUS_NO: order.CUS_NO, addShelf: addShelf.shelf.SHELVE_ID, addShelfArea: shelf.area, SALE_NO: order.SALE_NO, W_ID: order.W_ID };
    return await updateTransferWMS(data);
  } catch (err) {
    console.warn("handleConfirmShelf :", err);
    console.log(err, "err");
  } finally {
    setLoading(false);
    setConfirmModal(false);
  }
};

// 檢查位置
export const checkWCS_tr = async (waveNo, stations) => {
  try {
    return await checkWCSMove({ W_ID: waveNo, station: stations });
  } catch (err) {
    console.warn(`handleReturnShelf :`, err);
  }
};

// 檢查是否他站有任務
export const checkTask_tr = async (stations) => {
  try {
    return await selectTask({ stations: stations[0] });
  } catch (err) {
    console.warn(`handleConfrimList:`, err);
  }
};

export const addTask_tr = async (stations) => {
  try {
    return await updateTask({ stations: stations[0], location: "transfer" });
  } catch (err) {
    console.warn(`handleConfrimList:`, err);
  }
};

export const deleteTask_tr = async (stations) => {
  console.log(stations,'123')
  try {
    return await deleteTask({ stations: stations[0] });
  } catch (err) {
    console.warn(`handleConfrimList:`, err);
  }
};

// 數量異常
export const addAbnormal_tr = async (abData, shelf) => {
  try {
    const data = { PRT_NO: abData.PRT_NO, SHELVE_ID: shelf.SHELVE_ID };
    return await updateTransferWMSAbnormal(data);
  } catch (err) {
    console.warn(`handleAbnormal:`, err);
  }
};
