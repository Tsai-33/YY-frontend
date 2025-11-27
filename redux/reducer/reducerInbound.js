import { createSlice } from "@reduxjs/toolkit";

const stationList = ["A01", "A02", "A03", "A04", "A05", "A06", "A07", "A08", "A09", "A10"];

const createStation = () => ({
  step: 1,
  screen: "idle",
  orderCode: "",
  waveNo: null,
  order: {},
  shelf: {},
  shelfItem: [],
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
      const { orderList, step, screen, orderCode, waveNo, order, shelf, shelfItem, station,lackStation } = action.payload;
      if (!state[station]) return;

      if (step !== undefined) state[station].step = step;
      if (screen !== undefined) state[station].screen = screen;
      if (order !== undefined) state[station].order = order;
      if (orderCode !== undefined) state[station].orderCode = orderCode;
      if (waveNo !== undefined) state[station].waveNo = waveNo;
      if (shelf !== undefined) state[station].shelf = shelf;
      if (shelfItem !== undefined) state[station].shelfItem = shelfItem;
      if (orderList !== undefined) state.orderList = [...new Set([...state.orderList, orderList])];
      if (lackStation !== undefined) state.lackStation = [...new Set([...state.lackStation, lackStation])];
    },
    // 管理員控制面板
    managerInbound: (state, action) => {
      const { station, name, value, index } = action.payload;
      if (!state[station]) return;

      if (name === "step") {
        state[station][name] = Number(value);
      } else {
        state[station][name] = value;
      }
    },
    resetInbound: () => initialState,
  },
});

export const { setInbound, managerInbound, resetInbound } = inboundSlice.actions;
export default inboundSlice.reducer;
