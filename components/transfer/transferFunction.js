import { addShelf, addTransferWCS, getOrder, getOrderDetailByWID, getTransfer, getTransferByWID, getTransferDetail, sendToWMS } from "@/pages/api";
import { resetTransfer } from "@/redux/reducer/reducerTransfer";
import { generateRandomNumber } from "@/utils/random";

// 抓取ERP
export const getEPR = async (setLoading, inputBarCode, setTableData, setTableTotalData2) => {
  setLoading(true);
  try {
    const random = generateRandomNumber();
    const data = { action: "ask_order", NO: inputBarCode, dataid: random };
    const res = await sendToWMS(data);
    if (res.data.success) {
      getTable(setTableData, setTableTotalData2);
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
    const [order, orderDetail] = await Promise.all([getTransfer(), getTransferDetail()]);

    if (order.data.success) {
      setTableData(order.data.data);
    }

    if (orderDetail.data.success) {
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
      const newDetail = detail.map((v) => ({ ...v, type: "new", checked: false }));
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
    return res.data.data;
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
export const restoreList_in= async (setLoading, waveNo) => {
    try {
      return await restoreOrders({ W_ID: waveNo });
    } catch (err) {
      console.warn(`handleReturnShelf :`, err);
    } finally {
      setLoading(false);
    }
}

// 完成調撥單
export const finishList_tr = async (setLoading, currentStation, order) => {
  setLoading(true);
  try {
    const res = await finishTransferOrder({ W_ID: order.W_ID });
    if (res.data.success) {
      dispatch(resetTransfer({ type: "all", station: currentStation }));
      Alert({ title: "此單已完成" });
    }
  } catch (err) {
    console.warn(`handlefinishInboundOrder :`, err);
  } finally {
    setLoading(false);
  }
};
