import { createSlice } from "@reduxjs/toolkit";

const stationList = ["B01", "B02", "B03", "B04", "B05"];

const createStation = () => ({
  step: 1,  // 1: 選擇訂單階段, 2: 揀貨階段
  screen: "idle",
  orderCode: "",
  waveNo: null,
  order: {}, // 銷貨單的內容
  shelf: {},// 貨架到站後的資料
  shelfItem: [], // 貨架上的資料
  selected: [] // 目前選擇
});

const initialState = stationList.reduce(
  (acc, id) => {
    acc[id] = createStation();
    return acc;
  },
  { orderList: [], lackStation: [] } // 清表
)


const outboundExternalSlice = createSlice({
  name: "outboundExternal",
  initialState,
  reducers: {
    setOutboundExternal: (state, action) => {
      const { orderList, step, screen, orderCode, waveNo, order, shelf, shelfItem, selected, station, lackStation } = action.payload;
      // 沒有指定站點的話不執行
      if (!state[station]) return;

      // 更新欄位
      if (step !== undefined) state[station].step = step;
      if (screen !== undefined) state[station].screen = screen;
      if (orderCode !== undefined) state[station].orderCode = orderCode;
      if (order !== undefined) state[station].order = order;
      if (waveNo !== undefined) state[station].waveNo = waveNo;
      if (shelf !== undefined) state[station].shelf = shelf;
      if (shelfItem !== undefined) state[station].shelfItem = shelfItem;
      if (selected !== undefined) state[station].selected = selected;
      if (orderList !== undefined) state.orderList = [...new Set([...state.orderList, orderList])];
      if (lackStation !== undefined) state.lackStation = [...new Set([...state.lackStation, lackStation])];
    },

    // 被占用的站點
    updateLackStation: (state, action) => {
      const { lackStation, type } = action.payload;

      // 車到站占用
      if (type === "add") {
        if (!state.lackStation.includes(lackStation)) {
          state.lackStation.push(lackStation);
        }
      } 
      // 車離開釋放
      else if (type === "sub") {
        state.lackStation = state.lackStation.filter((v) => v !== lackStation);
      } 
      // 全部完成清空
      else if (type === "clear") {
        state.lackStation = [];
      }
    },

    // 已選的訂單
    updateOrderList: (state, action) => {
      const {order, type} = action.payload;
      // 新增訂單到清單
      if (type === "add") {
        if (!state.orderList.includes(order)) {
          state.orderList.push(order);
        }
      }
      // 移除訂單
      else if (type === "sub") {
        state.orderList = state.orderList.filter((v) => v !== order);
      }
      // 清空全部訂單
      else if (type === "clear") {
        state.orderList = [];
      }
    },

    managerOutboundExternal: (state, action) => {
      const { station, name, value, index } = action.payload;
      if (!state[station]) return;

      if (name === "step") {
        state[station][name] = Number(value);
      } else {
        state[station][name] = value;
      }
    },

    resetOutboundExternal: () => initialState
  }
});

export const { 
  setOutboundExternal, 
  updateLackStation, 
  updateOrderList, 
  managerOutboundExternal, 
  resetOutboundExternal 
} = outboundExternalSlice.actions;

export default outboundExternalSlice.reducer;
