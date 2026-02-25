import { addShelf, addTransferWCS, checkWCS, deleteTask, finishTransferOrder, getEPRData, getOrder, getOrderDetail, getOrderDetailByWID, resendJob, resendTaskdoneCheck, restoreOrders, returnTransferWCS, sendToWMS, updateTask, updateTransferWMS, updateTransferWMSAbnormal } from "@/pages/api";
import { generateRandomNumber } from "@/utils/random";
import Alert from "../common/alert/alert";
import { selectTask } from "../taskFunction";
import toast from "react-hot-toast";

// 抓取ERP
export const getEPR = async (setLoading, inputBarCode, setTableData, setTableTotalData2, setOriginalData) => {
  setLoading(true);
  try {
    const res = await getEPRData({ barCode: inputBarCode });
    if (res?.data?.success) {
      await getTable(setTableData, setTableTotalData2, setOriginalData);
      if(res?.data?.data?.result !== 'ok'){
        toast.error("建立失敗");
      }
    } else{
      toast.error("建立失敗")
    }
  } catch (error) {
    console.log(`handleBarCode :`, error);
  } finally {
    setLoading(false);
  }
};

// 抓取WMS系統所有調撥單
export const getTable = async (setTableData, setTableTotalData2, setOriginalData) => {
  try {
    const [order, orderDetail] = await Promise.all([getOrder({ cmd: "F", status: 0 }), getOrderDetail()]);

    if (order?.data?.success) {
      setTableData(order?.data?.data);
      setOriginalData(order?.data?.data);
    } else if (!order?.success) {
      Alert({ title: `目前網路不穩定，請重新再試。` });
    }

    if (orderDetail?.data?.success) {
      setTableTotalData2(orderDetail?.data?.data);
    } else if (!orderDetail?.success) {
      Alert({ title: `目前網路不穩定，請重新再試。` });
    }
  } catch (err) {
    console.log(`getTable:`, err);
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
    } else if (!res?.success) {
      Alert({ title: `目前網路不穩定，請重新再試。` });
    }
  } catch (err) {
    console.log("transfer getList:", err);
  }
};

// 確認訂單
export const confrimList_tr = async (setLoading, order) => {
  try {
    setLoading(true);
    // 傳給WMS
    const random9 = generateRandomNumber();
    const data = { action: "ask_wave", dataid: random9, wave_no: String(order.W_ID), station_no: "A", SHELVES: [] };
    const res = await sendToWMS(data);
    return res?.data?.data;
  } catch (err) {
    console.log("handleConfirm :", err);
    return err;
  } finally {
    setLoading(false);
  }
};

// 新增
export const addShelf_tr = async (setLoading, setAddModal, shelf, order,currentStation) => {
  setLoading(true);
  try {
    return await addTransferWCS({ step: "transfer", STOCK_AREA: shelf?.area, WAVENO: order?.W_ID, STATION: currentStation });
  } catch (err) {
    console.log("handleAddShelf :", err);
    if (err?.code === "ECONNABORTED") {
      try {
        const checkRes = await checkWCS({ W_ID: order?.W_ID, command: "MOVE" });
        if (checkRes?.data?.data?.length > 0) {
          return Alert({ title: "連線逾時但車輛已派發" });
        } else {
          return Alert({ title: "新增失敗，請重新再試" });
        }
      } catch (checkErr) {
        return Alert({ title: checkErr?.message });
      }
    } else {
      console.log(err, "其他錯誤");
      // Alert({ title: "" });
    }
  } finally {
    setLoading(false);
    setAddModal(false);
  }
};

// 退回
export const returnShelf_tr = async (setLoading, shelf, currentStation, order, remark) => {
  try {
    return await returnTransferWCS({ step: "transfer", SHELVE_ID: shelf?.SHELVE_ID, STATION: currentStation, WAVENO: order.W_ID, remark: remark });
  } catch (err) {
    console.log("handleReturnShelf :", err);
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
    console.log("handleReturnShelf :", err);
  } finally {
    setLoading(false);
  }
};

// 未完成 返回
export const restoreList_tr = async (setLoading, waveNo) => {
  try {
    return await restoreOrders({ W_ID: waveNo });
  } catch (err) {
    console.log(`handleReturnShelf :`, err);
  } finally {
    setLoading(false);
  }
};

// 完成調撥單
export const finishList_tr = async (setLoading, order, setFinishModal, SHELVE_ID, remark) => {
  setLoading(true);
  try {
    return await finishTransferOrder({ W_ID: order.W_ID, BILL_TIME: order.BILL_TIME, WORK_TIME: order.WORK_TIME, SHELVE_ID, remark });
  } catch (err) {
    console.log(`handleFinish :`, err);
  } finally {
    setLoading(false);
    setFinishModal(false);
  }
};

// 更改數量
export const updateWMS_tr = async (setLoading, selected, shelf, order, addShelf, setConfirmModal, remark, abnormal = null) => {
  setLoading(true);
  try {
    // 傳給WMS
    const data = {
      itemArray: selected,
      SHELVE_ID: shelf.SHELVE_ID,
      BILL_TIME: order.BILL_TIME,
      WORK_TIME: order.WORK_TIME,
      CUS_NO: order.CUS_NO,
      addShelf: addShelf.shelf.SHELVE_ID,
      addShelfArea: shelf.area,
      SALE_NO: order.SALE_NO,
      W_ID: order.W_ID,
      remark: remark,
      purposeRemark: addShelf.remark,
      abnormal: abnormal,
    };
    return await updateTransferWMS(data);
  } catch (err) {
    console.log("handleConfirmShelf :", err);
    console.log(err, "err");
  } finally {
    setLoading(false);
    setConfirmModal(false);
  }
};

// 檢查位置
export const checkWCS_tr = async (waveNo, stations) => {
  try {
    return await checkWCS({ W_ID: waveNo, command: "MOVE", station: stations });
  } catch (err) {
    console.log(`handleReturnShelf :`, err);
  }
};

// 檢查是否他站有任務
export const checkTask_tr = async (stations) => {
  try {
    return await selectTask({ stations: stations[0] });
  } catch (err) {
    console.log(`handleConfrimList:`, err);
  }
};

export const addTask_tr = async (stations) => {
  try {
    return await updateTask({ stations: stations[0], location: "transfer" });
  } catch (err) {
    console.log(`handleConfrimList:`, err);
  }
};

export const deleteTask_tr = async (stations) => {
  try {
    return await deleteTask({ stations: stations[0] });
  } catch (err) {
    console.log(`handleConfrimList:`, err);
  }
};

// 數量異常
export const addAbnormal_tr = async (waveNo, abData, shelf, shelfItem) => {
  try {
    const data = { W_ID: waveNo, PRT_NO: abData.PRT_NO, SHELVE_ID: shelf.SHELVE_ID, SALE_NO: shelfItem[0]?.SALE_NO };
    return await updateTransferWMSAbnormal(data);
  } catch (err) {
    console.log(`handleAbnormal:`, err);
  }
};

export const resend_check_tr = async (currentStation) => {
  try {
    return await resendTaskdoneCheck({ STATION: currentStation });
  } catch (err) {
    console.log(`resend job:`, err);
  }
};
