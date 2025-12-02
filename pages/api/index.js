import { api } from "./service";

/* 查詢IP*/
export const getIP = () => api.get("/system/getIP");

/* 取得調撥單 */
export const getTransfer = () => api.get("/transfer");
export const getTransferById = (id) => api.get(`/transfer/${id}`);

/* 取得入庫單 */
export const getInbound = () => api.get("/inbound");
export const getInboundByWID = (id) => api.get(`/inbound/${id}`);

/* 取得出庫單(銷貨) */
export const getOutboundExternal = () =>
  api.get("/outboundExternal/getOutBoundExternal");
export const getOutBoundExternalOrderDetail = (sale_no) =>
  api.get(`/outboundExternal/getOutBoundExternalOrderDetail`, {
    params: { sale_no },
  });

/* 取得出庫單(領用) */

/* 傳給labview */
export const sendToWMS = (payload) =>
  api.post("/send-to-wms", payload, { timeout: 45000 });

export const searchStock = (payload) => api.post("/stock/stockQuery", payload);
