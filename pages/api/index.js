import { api } from "./service";

/* 查詢IP*/
export const getIP = () => api.get("/system/getIP");

/* 取得調撥單 */
export const getTransfer = () => api.get("/transfer");
export const getTransferById = (id) => api.get(`/transfer/${id}`);

/* 取得入庫單 */
export const getInbound = () => api.get("/inbound");
export const getInboundByWID = (id) => api.get(`/inbound/${id}`);

/* 傳給labview */
export const sendToWMS = (payload) => api.post("/send-to-wms", payload, { timeout: 45000 });
