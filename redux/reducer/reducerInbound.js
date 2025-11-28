import { updateShelfItemAPI } from "@/pages/api";
import { createSlice } from "@reduxjs/toolkit";

const stationList = ["A01", "A02", "A03", "A04", "A05", "A06", "A07", "A08", "A09", "A10"];

const createStation = () => ({
  step: 1,
  screen: "idle",
  orderCode: "",
  waveNo: null,
  order: {}, // 入庫單內容
  shelf: {}, // default ITEMS 這裡取
  shelfItem: [], // 目前貨架上的物品
  selected: [], // 目前選擇
});

const initialState = stationList.reduce(
  (acc, id) => {
    acc[id] = createStation();
    return acc;
  },
  { orderList: [], lackStation: [] }
);
const inboundSlice = createSlice({
  name: "inbound",
  initialState,
  reducers: {
    setInbound: (state, action) => {
      const { orderList, step, screen, orderCode, waveNo, order, shelf, shelfItem, selected, station, lackStation } = action.payload;
      if (!state[station]) return;

      if (step !== undefined) state[station].step = step;
      if (screen !== undefined) state[station].screen = screen;
      if (order !== undefined) state[station].order = order;
      if (orderCode !== undefined) state[station].orderCode = orderCode;
      if (waveNo !== undefined) state[station].waveNo = waveNo;
      if (shelf !== undefined) state[station].shelf = shelf;
      if (shelfItem !== undefined) state[station].shelfItem = shelfItem;
      if (selected !== undefined) state[station].selected = selected;
      if (orderList !== undefined) state.orderList = [...new Set([...state.orderList, orderList])];
      if (lackStation !== undefined) state.lackStation = [...new Set([...state.lackStation, lackStation])];
    },
    updateLackStation: (state, action) => {
      const { lackStation, type } = action.payload;
      if (type === "add") {
        if (!state.lackStation.includes(lackStation)) {
          state.lackStation.push(lackStation);
        }
      } else if (type === "sub") {
        state.lackStation = state.lackStation.filter((v) => v !== lackStation);
      } else if (type === "clear") {
        state.lackStation = [];
      }
    },
    updateOrderList: (state, action) => {
      const { order, type } = action.payload;
      if (type === "add") {
        if (!state.orderList.includes(order)) {
          state.orderList.push(order);
        }
      } else if (type === "sub") {
        state.orderList = state.orderList.filter((v) => v !== order);
      } else if (type === "clear") {
        state.orderList = [];
      }
    },
    updateShelfItem: (state, action) => {
      const { type, items } = action.payload;
      if (type === "all") {
        // 全選
      } else if (type === "noAll") {
        // 全不選
      } else if (type === "add") {
        // 加1
      } else if (type === "sub") {
        //減1
      }
    },

    // 控制面板
    managerInbound: (state, action) => {
      const { station, name, value, index } = action.payload;
      if (!state[station]) return;

      if (name === "step") {
        state[station][name] = Number(value);
      } else {
        state[station][name] = value;
      }
    },
    // 重置
    resetInbound: (state, action) => {
      const { type, station } = action.payload;
      if (type === "one") {
        state[station] = createStation();
      } else if (type === "all") {
        return initialState;
      }
    },
  },
});

export const { setInbound, updateLackStation, updateOrderList, updateShelfItem, managerInbound, resetInbound } = inboundSlice.actions;
export default inboundSlice.reducer;
