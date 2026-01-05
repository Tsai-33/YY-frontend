import { api } from "./service";

/* 查詢IP*/
export const getIP = () => api.get("/system/getIP");

/* 取得調撥單 */
export const addTransferWCS = (payload) =>
  api.post("/transfer/add/wcs", payload);
export const updateTransferWMS = (payload) =>
  api.post("/transfer/update/wms", payload);
export const updateTransferWMSAbnormal = (payload) =>
  api.post("/transfer/update/wms/abnormal", payload);
export const finishTransferOrder = (payload) =>
  api.post("/transfer/finish/order", payload);
export const restoreTransfer = (payload) =>
  api.post("/transfer/restore/orders", payload);

/* 取得入庫單 */
export const addInboundWCS = (payload) => api.post("/inbound/add/wcs", payload);
export const updateInboundWMS = (payload) =>
  api.post("/inbound/update/wms", payload);
export const finishInboundOrder = (payload) =>
  api.post("/inbound/finish/order", payload);
export const restoreOrders = (payload) =>
  api.post("/inbound/restore/orders", payload);

/* 取得出庫單(銷貨) */
export const getOutboundExternal = () =>
  api.get("/outboundExternal/getOutBoundExternal");
export const getOutBoundExternalOrderDetail = (sale_no) =>
  api.get(`/outboundExternal/getOutBoundExternalOrderDetail`, {
    params: { sale_no },
  });
export const getOutBoundExternalOrderDetailBySaleNo = (sale_no) =>
  api.get(`/outboundExternal/getOutBoundExternalOrderDetailBySaleNo`, {
    params: { sale_no },
  });
export const getOutBoundExternalOrderDetailByWID = (w_id) =>
  api.get(`/outboundExternal/getOutBoundExternalOrderDetailByWID`, {
    params: { w_id },
  });
export const shiftOutOnReturn = (data) =>
  api.post("/outboundExternal/shiftOutOnReturn", data);
export const updateStatusForOutboundCallCar = (data) =>
  api.post("/outboundExternal/updateStatusForOutboundCallCar", data);

/* 取得出庫單(領用) */

/* 庫存查詢 */
export const searchStock = (payload) => api.post("/stock/stockQuery", payload);
export const stockDownload = (payload) =>
  api.post("/stock/stockDownload", payload, {
    responseType: "blob",
  });
export const searchStockDetail = (payload) =>
  api.post("/stock/stockQueryDetail", payload);

/* 理貨 */
export const getShelfTransfer = () =>
  api.get("/shelfTransfer/getShelfTransfer");
export const getWMSBySaleNo = (sale_no) =>
  api.get("/shelfTransfer/getWMSBySaleNo", { params: { sale_no } });
export const insertShelfTask = (data) =>
  api.post("/shelfTransfer/insertShelfTask", data);
export const updateTransferItems = (data) =>
  api.post("/shelfTransfer/updateTransferItems", data);
export const updateShelveCheck = (data) =>
  api.post(`/shelfTransfer/updateShelveCheck`, data);
export const getStockAreas = () => api.get("/shelfTransfer/getStockAreas");
export const getWMSByAreaAndPrtNo = (area, prtNo) =>
  api.get(`/shelfTransfer/getWMSByAreaAndPrtNo?area=${area}&prtNo=${prtNo}`);
export const transferItems = (data) =>
  api.post("/shelfTransfer/transferItems", data);
export const updateAbnormal = (data) =>
  api.post("/shelfTransfer/updateAbnormal", data);
export const getAbnormalStatus = (shelveIds) =>
  api.get("/shelfTransfer/getAbnormalStatus", { params: { shelveIds } });

/* 盤點任務下發 */
export const getInventoryItems = (payload) =>
  api.post("/inventory/getInventoryItems", payload);
export const createInventoryTask = (payload) =>
  api.post("/inventory/createInventoryTask", payload);
export const updateInventoryResult = (payload) =>
  api.post("/inventory/updateInventoryResult", payload);

/* 傳給labview */
export const sendToWMS = (payload) =>
  api.post("/send-to-wms", payload, { timeout: 45000 });

/* 共用API */
export const getOrder = (payload) =>
  api.get("/order/cmdid", { params: { cmd: payload } });
export const getOrderByWID = (payload) =>
  api.get("/order/wid", { params: { wid: payload } });
export const getOrderDetail = (payload) =>
  api.get("/order/detail", { params: { cmd: payload } });
export const getOrderDetailByWID = (payload) =>
  api.get("/order/detail/wid", { params: { wid: payload } });

export const checkWCS = (payload) => api.post("/wcs/check", payload);
export const checkWCSMove = (payload) => api.post("/wcs/check/move", payload);
export const addShelf = (payload) => api.post("/wcs/add", payload);
export const checkNodePos = (payload) =>
  api.post("/wcs/check/nodepos", payload);
export const checkTask = (payload) => api.post("/task/check", payload);
export const updateTask = (payload) => api.post("/task/update", payload);
export const deleteTask = (payload) => api.post("/task/delete", payload);

/* 解碼 */
export const decryptBarcode = (payload) => api.post("/code/decrypt", payload);
