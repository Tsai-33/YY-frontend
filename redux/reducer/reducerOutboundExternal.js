import { createSlice } from "@reduxjs/toolkit";

const stationList = ["B01", "B02", "B03", "B04", "B05"];

const createStation = () => ({
  step: 1,  // 1: 選擇訂單階段, 2: 揀貨階段
  screen: "idle",
  orderCode: "",
  waveNo: null,
  order: {},
  shelf: {},// 貨架到站後的資料
  shelfItem: [],
});

const initialState = stationList.reduce(
  (acc, id) => {
    acc[id] = createStation();
    return acc;
  },
  { orderList: [], lockStation: [] } // 訂單列表
)


const outboundExternalSlice = createSlice({
  name: "outboundExternal",
  initialState,
  reducers: {
    setOutboundExternal: (state, action) => {
      const { orderList, step, screen, orderCode, waveNo, order, shelf, shelfItem, station, lockStation } = action.payload;
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
      if (orderList !== undefined) state.orderList = [...new Set([...state.orderList, orderList])];
      if (lockStation !== undefined) state.lockStation = [...new Set([...state.lockStation, lockStation])];
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

export const { setOutboundExternal, managerOutboundExternal, resetOutboundExternal } = outboundExternalSlice.actions;
export default outboundExternalSlice.reducer;
