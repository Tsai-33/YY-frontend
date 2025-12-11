import { api } from "./service";

/* 查詢IP*/
export const getIP = () => api.get("/system/getIP");

/* 取得調撥單 */
export const getTransfer = () => api.get("/transfer");
export const getTransferById = (id) => api.get(`/transfer/${id}`);

/* 取得入庫單 */
export const getInbound = () => api.get("/inbound");
export const getInboundByCMDID = () => api.get("/inbound/cmdid");
export const getInboundByWID = (wid) => api.get(`/inbound/${wid}`);
export const addInboundWCS = (payload) => api.post("/inbound/add/wcs", payload);
export const updateInboundWMS = (payload) =>
  api.post("/inbound/update/wms", payload);
export const finishInboundOrder = (payload) =>
  api.post("/inbound/finish/order", payload);

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

/* 取得出庫單(領用) */

/* 庫存查詢 */
export const searchStock = (payload) => api.post("/stock/stockQuery", payload);

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
/* 盤點任務下發 */
export const getInventoryItems = (payload) =>
  api.post("/inventory/getInventoryItems", payload);
export const createInventoryTask = (payload) =>
  api.post("/inventory/createInventoryTask", payload);

/* 傳給labview */
export const sendToWMS = (payload) =>
  api.post("/send-to-wms", payload, { timeout: 45000 });

/* 叫車 */
export const checkWCS = (payload) => api.post("/wcs/check", payload);
export const checkNODEPOS = (payload) =>
  api.post("/wcs/check/nodepos", payload);
export const addWCS = (payload) => api.post("/wcs/add", payload);
export const addWCSGroup = (payload) => api.post("/wcs/add/group", payload);
export const addShelf = (payload) => api.post("/wcs/add", payload);
export const cancelShelf = (payload) => api.post("/wcs/cancel", payload);
