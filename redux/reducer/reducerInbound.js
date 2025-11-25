import { createSlice } from "@reduxjs/toolkit";

const stationList = ["A01", "A02", "A03", "A04", "A05", "A06", "A07", "A08", "A09", "A10"];

const createStation = () => ({
  step: 1,
  screen: "idle",
  orderCode: "",
  taskdone: {},
});

const initialState = stationList.reduce(
  (acc, id) => {
    acc[id] = createStation();
    return acc;
  },
  { orderList: [] }
);

const inboundSlice = createSlice({
  name: "inbound",
  initialState,
  reducers: {
    setInbound: (state, action) => {
      const { orderList, station, step, screen, orderCode, taskdone } = action.payload;
      if (!state[station]) return;

      if (step !== undefined) state[station].step = step;
      if (screen !== undefined) state[station].screen = screen;
      if (orderCode !== undefined) state[station].orderCode = orderCode;
      if (taskdone !== undefined) state[station].taskdone = taskdone;
      if (orderList !== undefined) state.orderList = [...new Set([...state.orderList, orderList])];
    },
  },
});

export const { setInbound } = inboundSlice.actions;
export default inboundSlice.reducer;
