import { addInboundWCS, addShelf, restoreOrders, checkNODEPOS, checkWCS, finishInboundOrder, getInbound, getInboundByWID, sendToWMS, updateInboundWMS } from "@/pages/api";
import { generateRandomNumber } from "@/utils/random";

// 取得ERP資料
export const getERP = async (setLoading, inputBarCode) => {
  setLoading(true);
  try {
    const random = generateRandomNumber();
    const data = { action: "ask_order", NO: inputBarCode, dataid: random };
    return await sendToWMS(data);
  } catch (error) {
    console.warn(`ask_order handleBarCode :`, error);
  } finally {
    setLoading(false);
  }
};

// 取得全訂單
export const getTable = async (setTableData, orderList) => {
  try {
    const res = await getInbound();
    if (res.data.success) {
      // 排除掉重複訂單
      const newData = res.data.data.filter((v) => !orderList.includes(v.INSTOCK_NO));
      setTableData(newData);
    }
  } catch (err) {
    console.warn(`getTable:`, err);
  }
};

// 取得單一訂單
export const getList = async (waveNo, setTableData2) => {
  try {
    const res = await getInboundByWID(waveNo);
    if (res.data.success) {
      const detail = res.data.data; // 陣列
      const newDetail = detail.map((v) => ({ ...v, type: "new", checked: false }));
      setTableData2(newDetail);
    }
  } catch (err) {
    console.warn("getList :", err);
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
    console.warn("handleConfrimList :", err);
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
    console.warn("handleConfrimShelf :", err);
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
    const res = await addInboundWCS({ area: shelf?.area, W_ID: order?.W_ID });
    if (res.data.success) {
      console.log(res.data, "wcstask收到資料");
    }
  } catch (err) {
    console.warn("handleAddShelf :", err);
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
    console.warn("handleReturn :", err);
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
    console.warn("handleCancel:", err);
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
    console.warn(`handleReturnShelf :`, err);
  } finally {
    setLoading(false);
  }
};

// 完成
export const finishList_in = async (setLoading, order) => {
  setLoading(true);
  try {
    return await finishInboundOrder({ W_ID: order.W_ID });
  } catch (err) {
    console.warn(`handleFinish:`, err);
  } finally {
    setLoading(false);
  }
};

// 檢查是否有任務
export const checkCar = async (waveNo) => {
  try {
    const [wcs, nodepos] = await Promise.all([checkWCS({ W_ID: waveNo }), checkNODEPOS({ W_ID: waveNo })]);
    return { wcs, nodepos };
  } catch (err) {
    console.warn(`handleReturnShelf:`, err);
  }
};
