import { addInboundWCS, addShelf, restoreOrders, finishInboundOrder, sendToWMS, updateInboundWMS, getOrder, getOrderByWID, getOrderDetailByWID, checkInboundWCS, checkWCS, checkTask, updateTask, deleteTask } from "@/pages/api";
import { generateRandomNumber } from "@/utils/random";
import Alert from "../common/alert/alert";
import { selectTask } from "../taskFunction";

// 取得ERP資料
export const getERP = async (setLoading, inputBarCode, setTableData, orderList) => {
  setLoading(true);
  try {
    const random = generateRandomNumber();
    const data = { action: "ask_order", NO: inputBarCode, dataid: random };
    const res = await sendToWMS(data);
    if (res?.success) {
      getTable(setTableData, orderList);
    } else if (!res?.success) {
      Alert({ title: `${res?.error?.message}` });
    }
  } catch (error) {
    console.log(`ask_order handleBarCode :`, error);
  } finally {
    setLoading(false);
  }
};

// 取得全訂單
export const getTable = async (setTableData, orderList = null) => {
  try {
    const res = await getOrder({ cmd: "I", status: 0 });
    if (res?.success) {
      let newData = res?.data?.data;
      if (orderList) {
        // 排除掉重複訂單
        newData = res?.data?.data?.filter((v) => !orderList.includes(v.INSTOCK_NO));
      }
      setTableData(newData);
    } else if (!res?.success) {
      Alert({ title: `目前網路不穩定，請重新再試。` });
    }
  } catch (err) {
    console.log(`getTable:`, err);
  }
};

// 取得單一訂單
export const getList = async (waveNo, setTableData2) => {
  try {
    const res = await getOrderDetailByWID(String(waveNo));
    if (res?.success) {
      const detail = res.data.data; // 陣列
      const newDetail = detail.filter((v) => v.STATUS == 1);
      setTableData2(newDetail);
    } else if (!res?.success) {
      Alert({ title: `目前網路不穩定，請重新再試。` });
    }
  } catch (err) {
    console.log("getList :", err);
  }
};

// 確認訂單
export const confrimList_in = async (setLoading, order) => {
  setLoading(true);
  try {
    // 傳給WMS
    const random9 = generateRandomNumber();
    const data = { action: "ask_wave", dataid: random9, wave_no: String(order.W_ID), station_no: "A" };
    return await sendToWMS(data);
  } catch (err) {
    console.log("handleConfrimList :", err);
  } finally {
    setLoading(false);
  }
};

// 確認上架
export const onToShelf_in = async (setLoading, selected, shelf, order, dispatch, setInbound, currentStation, setConfirmModal) => {
  try {
    setLoading(true);
    const data = { itemArray: selected, area: shelf.area, SHELVE_ID: shelf.SHELVE_ID, BILL_TIME: order.BILL_TIME, WORK_TIME: order.WORK_TIME, CUS_NO: order.CUS_NO };
    return await updateInboundWMS(data);
  } catch (err) {
    console.log("handleConfrimShelf :", err);
  } finally {
    setLoading(false);
    dispatch(setInbound({ station: currentStation, selected: [] }));
    setConfirmModal(false);
  }
};

// 新增
export const addShelf_in = async (setLoading, setAddModal, shelf, order) => {
  try {
    setLoading(true);
    return await addInboundWCS({ area: shelf?.area, W_ID: order?.W_ID });
  } catch (err) {
    console.log("handleAddShelf :", err);
  } finally {
    setLoading(false);
    setAddModal(false);
  }
};

// 退回
export const returnShelf_in = async (setLoading, shelf, currentStation, order) => {
  setLoading(true);
  try {
    const random9 = generateRandomNumber();
    const data = { Command: "RETURN", SHELVE_ID: shelf?.SHELVE_ID, BAR_CODE: "", FACE: 2, STATION: currentStation, PURPOSE: 1, STATUS: 0, CART_ID: "", DATA_ID: random9, WAVENO: String(order.W_ID), GGROUP: String(order.W_ID) };
    return await addShelf(data);
  } catch (err) {
    console.log("handleReturn :", err);
  } finally {
    setLoading(false);
  }
};

// 全退回
export const cancelShelf_in = async (setLoading, currentStation) => {
  setLoading(true);
  try {
    const random9 = generateRandomNumber();
    const data = { action: "cancel", dataid: random9, STATION: currentStation };
    return await sendToWMS(data);
  } catch (err) {
    console.log("handleCancel:", err);
  } finally {
    setLoading(false);
  }
};

// 未完成 返回
export const restoreList_in = async (setLoading, waveNo) => {
  setLoading(true);
  try {
    return await restoreOrders({ W_ID: waveNo });
  } catch (err) {
    console.log(`handleReturnShelf :`, err);
  } finally {
    setLoading(false);
  }
};

// 完成
export const finishList_in = async (setLoading, order) => {
  setLoading(true);
  try {
    return await finishInboundOrder({ W_ID: order.W_ID, BILL_TIME: order.BILL_TIME, WORK_TIME: order.WORK_TIME });
  } catch (err) {
    console.log(`handleFinish:`, err);
  } finally {
    setLoading(false);
  }
};

// 檢查WCS是否有任務
export const checkCar = async (waveNo) => {
  try {
    return await checkWCS({ W_ID: waveNo });
  } catch (err) {
    console.log(`handleReturnShelf:`, err);
  }
};
// 檢查是否他站有任務
export const checkTask_in = async (stations) => {
  try {
    return await selectTask({ stations: stations[0] });
  } catch (err) {
    console.log(`handleConfrimList:`, err);
  }
};

export const addTask_in = async (stations) => {
  try {
    return await updateTask({ stations: stations[0], location: "inbound" });
  } catch (err) {
    console.log(`handleConfrimList:`, err);
  }
};

export const deleteTask_in = async (stations) => {
  try {
    return await deleteTask({ stations: stations[0] });
  } catch (err) {
    console.log(`handleConfrimList:`, err);
  }
};
