import {
  addInboundWCS,
  restoreOrders,
  finishInboundOrder,
  sendToWMS,
  updateInboundWMS,
  getOrder,
  getOrderDetailByWID,
  checkWCS,
  updateTask,
  deleteTask,
  getEPRData,
  returnInboundWCS,
  checkWCSLastCar,
  getWMS,
  searchInboundWMS,
  updateInboundWMSREMARK,
  searchInboundWMSBynoSALE,
  searchInboundDecrypt,
  getOrderByWID,
} from "@/pages/api";
import { generateRandomNumber } from "@/utils/random";
import Alert from "../common/alert/alert";
import { selectTask } from "../taskFunction";

// 取得ERP資料
export const getERP = async (setLoading, inputBarCode, setTableData, setOriginalData, orderList) => {
  setLoading(true);
  try {
    const res = await getEPRData({ barCode: inputBarCode });
    if (res?.success) {
      await getTable(setTableData, setOriginalData, orderList);
    } else if (!res?.success && res?.error) {
      Alert({ title: "目前無法取得ERP資料" });
    }
  } catch (error) {
    console.log(`ask_order handleBarCode :`, error);
  } finally {
    setLoading(false);
  }
};

// 取得全訂單
export const getTable = async (setTableData, setOriginalData, orderList = null) => {
  try {
    const res = await getOrder({ cmd: "I", status: 0 });
    if (res?.success) {
      let newData = res?.data?.data;
      if (orderList) {
        // 排除掉重複訂單
        newData = res?.data?.data?.filter((v) => !orderList.includes(v.INSTOCK_NO));
      }
      setTableData(newData);
      setOriginalData(newData);
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

      const newDetail = detail.filter((v) => v.STATUS <= 1 && v.W_ID === waveNo);
      setTableData2(newDetail);
    } else if (!res?.success) {
      Alert({ title: `目前網路不穩定，請重新再試。` });
    }
  } catch (err) {
    console.log("inbound getList :", err);
  }
};

// 確認訂單
export const confrimList_in = async (setLoading, order, stations, shelves) => {
  let newShelf = [];
  if (shelves.length > 0) {
    newShelf = shelves.map((v) => v.SHELVE_ID);
  }

  setLoading(true);
  try {
    // 傳給WMS
    const random9 = generateRandomNumber();
    const data = { action: "ask_wave", dataid: random9, wave_no: String(order.W_ID), station_no: stations[0].charAt(0), SHELVES: newShelf };
    return await sendToWMS(data);
  } catch (err) {
    console.log("handleConfrimList :", err);
    return err;
  } finally {
    setLoading(false);
  }
};

// 確認上架
export const onToShelf_in = async (setLoading, selected, shelf, order, dispatch, setInbound, currentStation, setConfirmModal, remark) => {
  try {
    setLoading(true);
    const data = { itemArray: selected, area: shelf.area, SHELVE_ID: shelf.SHELVE_ID, BILL_TIME: order.BILL_TIME, WORK_TIME: order.WORK_TIME, CUS_NO: order.CUS_NO, REMARK: remark };
    return await updateInboundWMS(data);
  } catch (err) {
    console.log("handleConfrimShelf :", err);
    return err;
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
    return await addInboundWCS({ step: "inbound", STOCK_AREA: shelf?.area, WAVENO: order?.W_ID });
  } catch (err) {
    console.log("handleAddShelf :", err);
    if (err?.code === "ECONNABORTED") {
      try {
        const checkRes = await checkWCS({ WAVENO: order?.W_ID, command: "MOVE" });
        if (checkRes?.data?.data?.length > 0) {
          return Alert({ title: "連線逾時但車輛已派發" });
        } else {
          return Alert({ title: "新增失敗，請重新再試" });
        }
      } catch (checkErr) {
        return Alert({ title: checkErr?.message });
      }
    }
  } finally {
    setLoading(false);
    setAddModal(false);
  }
};

// 退回
export const returnShelf_in = async (setLoading, shelf, currentStation, order) => {
  setLoading(true);
  try {
    return await returnInboundWCS({ step: "inbound", SHELVE_ID: shelf?.SHELVE_ID, STATION: currentStation, WAVENO: order.W_ID });
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
export const finishList_in = async (setLoading, order, inbound) => {
  // 整理REMARK
  const remarks =
    inbound?.lackStation?.flatMap((v) => {
      const shelfId = inbound[v]?.shelf?.SHELVE_ID;
      if (shelfId) {
        return [
          {
            SHELVE_ID: shelfId,
            REMARK: inbound[v].remark,
          },
        ];
      }
      return []; // 回傳空陣列，最終結果就不會包含這一筆
    }) || [];

  setLoading(true);
  try {
    return await finishInboundOrder({ W_ID: order.W_ID, BILL_TIME: order.BILL_TIME, WORK_TIME: order.WORK_TIME, REMARK: remarks });
  } catch (err) {
    console.log(`handleFinish:`, err);
    return err;
  } finally {
    setLoading(false);
  }
};

// 檢查WCS是否有任務
export const checkCar = async (waveNo) => {
  try {
    return await checkWCSLastCar({ W_ID: waveNo });
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

export const searchWMS_in = async (SALE_NO, PRT_NO, STOCK_AREA, SHELVE_ID = [], INSTOCK_NO, W_ID) => {
  try {
    return await searchInboundWMS({ SALE_NO: SALE_NO, PRT_NO: PRT_NO, STOCK_AREA: STOCK_AREA, SHELVE_IDs: SHELVE_ID, INSTOCK_NO: INSTOCK_NO, W_ID: W_ID });
  } catch (err) {
    console.log(`searchWMS:`, err);
  }
};

export const searchWMSBynoSALE_in = async () => {
  try {
    return await searchInboundWMSBynoSALE();
  } catch (err) {
    console.log(`handleOtherShelve:`, err);
  }
};

export const updateWMS_in = async (SHELVE_ID, PRT_NO, REMARK) => {
  try {
    return await updateInboundWMSREMARK({ REMARK: REMARK, PRT_NO: PRT_NO, SHELVE_ID: SHELVE_ID });
  } catch (err) {
    console.log(`searchWMS:`, err);
  }
};

// 檢查目前掃描的外箱條碼
export const decryptBarCodePRTNO_in = async (value, inbound) => {
  try {
    return await searchInboundDecrypt({ barcode: value, inbound: inbound });
  } catch (err) {
    console.log(`handleSearchStation:`, err);
    return err;
  } finally {
  }
};

export const getInboundOrderByWID = async (W_ID) => {
  try {
    return await getOrderByWID(W_ID);
  } catch (err) {
    console.log(`handleSearchStation:`, err);
    return err;
  } finally {
  }
};
