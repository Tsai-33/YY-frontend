import { api } from "./service";

/* 查詢IP*/
export const getIP = () => api.get("/system/getIP");
export const searchStock = (payload) => api.post("/stock/stockQuery", payload);
