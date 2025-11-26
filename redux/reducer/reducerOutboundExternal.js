import { createSlice } from "@reduxjs/toolkit";

const stationList = ["B01", "B02", "B03", "B04", "B05"];

const createStation = () => ({
  step: 1,  // 1: 選擇訂單階段, 2: 揀貨階段
  screen: "idle",
  orderCode: "",
  shelveData: [], // 貨架到站後的資料
  taskdone: {},
});

const initialState = stationList.reduce(
  (acc, id) => {
    acc[id] = createStation();
    return acc;
  },
  { orderList: [] } // 訂單列表
)


const outboundExternalSlice = createSlice({
  name: "outboundExternal",
  initialState,
  reducers: {
    setOutboundExternal: (state, action) => {
      const { orderList, station, step, screen, orderCode, taskdone } = action.payload;

      // 沒有指定站點的話不執行
      if (!state[station]) return;

      // 更新欄位
      if (step !== undefined) state[station].step = step;
      if (screen !== undefined) state[station].screen = screen;
      if (orderCode !== undefined) state[station].orderCode = orderCode;
      if (taskdone !== undefined) state[station].taskdone = taskdone;
      if (orderList !== undefined) state.orderList = [...new Set([...state.orderList, orderList])];
    },

    resetStation: (state, action) => {
      const { station } = action.payload;
      if (!state[station]) return;
      state[station] = createStation();
    }
  }
});

export const { setOutboundExternal } = outboundExternalSlice.actions;
export default outboundExternalSlice.reducer;

// const initialState = {
//   page: 'A01',
//   step: 1,
//   A01: "",
// };

// const pageSlice = createSlice({
//   name: "outbound",
//   initialState,
//   reducers: {},
// });

// export const {} = pageSlice.actions;

// export default pageSlice.reducer;
