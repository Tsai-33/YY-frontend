import { api } from "./service";

/* 查詢IP*/
export const getIP = () => api.get("/system/getIP");

/* 取得調撥單 */
export const getTransfer = () => api.get("/transfer");
export const getTransferById = (id) => api.get(`/transfer/${id}`);

/* 取得入庫單 */
export const getInbound = () => api.get("/inbound");
export const getInboundALL = () => api.get("/inbound/all");
export const getInboundByWID = (id) => api.get(`/inbound/${id}`);
export const updateShelfItemAPI = (payload) => api.post("/inbound/shelf", payload);

/* 取得出庫單(銷貨) */
export const getOutboundExternal = () => api.get("/outbound");
/* 取得出庫單(領用) */

/* 傳給labview */
export const sendToWMS = (payload) => api.post("/send-to-wms", payload, { timeout: 45000 });
