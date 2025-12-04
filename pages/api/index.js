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
export const updateInboundWMS = (payload) => api.post("/inbound/update/wms", payload);
export const finishInboundOrder = (payload) => api.post("/inbound/finish/order", payload);

/* 取得出庫單(銷貨) */
export const getOutboundExternal = () => api.get("/outbound");
/* 取得出庫單(領用) */

/* 傳給labview */
export const sendToWMS = (payload) => api.post("/send-to-wms", payload, { timeout: 45000 });

/* 叫車 */
export const addWCS = (payload) => api.post("/wcs/add", payload);
export const addWCSGroup = (payload) => api.post("/wcs/add/group", payload);
export const addShelf = (payload) => api.post("/wcs/add", payload);
export const cancelShelf = (payload) => api.post("/wcs/cancel", payload);
