import { createSlice } from "@reduxjs/toolkit";

const stationList = ["B01", "B02", "B03", "B04", "B05", "C01", "C02", "C03", "C04", "C05", "D01", "D02", "D03", "D04"];

const createStation = () => ({
  step: 1,
  screen: "idle",
  orderCode: "",
  waveNo: null,
  order: {},
  shelf: {},
  shelfItem: [],
  selected: [],
  selectedShelves: [], // 使用者選擇的貨架
  pushButton: null
});

const initialState = stationList.reduce(
  (acc, id) => {
    acc[id] = createStation();
    return acc;
  },
  { orderList: [], lackStation: [] }
);

const outboundExternalNewSlice = createSlice({
  name: "outboundExternalNew",
  initialState,
  reducers: {
    setOutboundExternalNew: (state, action) => {
      const { orderList, step, screen, orderCode, waveNo, order, shelf, shelfItem, selected, selectedShelves, station, lackStation, pushButton } = action.payload;
      if (!state[station]) return;

      if (step !== undefined) state[station].step = step;
      if (screen !== undefined) state[station].screen = screen;
      if (orderCode !== undefined) state[station].orderCode = orderCode;
      if (order !== undefined) state[station].order = order;
      if (waveNo !== undefined) state[station].waveNo = waveNo;
      if (shelf !== undefined) state[station].shelf = shelf;
      if (shelfItem !== undefined) state[station].shelfItem = shelfItem;
      if (selected !== undefined) state[station].selected = selected;
      if (selectedShelves !== undefined) state[station].selectedShelves = selectedShelves;
      if (pushButton !== undefined) state[station].pushButton = pushButton;
      if (orderList !== undefined) state.orderList = [...new Set([...state.orderList, orderList])];
      if (lackStation !== undefined) state.lackStation = [...new Set([...state.lackStation, lackStation])];
    },

    selectShelf: (state, action) => {
      const { station, shelf } = action.payload;
      if (!state[station]) return;
      const shelves = state[station].selectedShelves;
      const index = shelves.findIndex((s) => s.SHELVE_ID === shelf.SHELVE_ID);
      if (index >= 0) {
        shelves.splice(index, 1);
      } else {
        shelves.push(shelf);
      }
    },

    clearSelectedShelves: (state, action) => {
      const { station } = action.payload;
      if (state[station]) {
        state[station].selectedShelves = [];
      }
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

    clearPushButton: (state, action) => {
      const { station } = action.payload;
      if (state[station]) {
        state[station].pushButton = null;
      }
    },

    managerOutboundExternalNew: (state, action) => {
      const { station, name, value } = action.payload;
      if (!state[station]) return;
      if (name === "step") {
        state[station][name] = Number(value);
      } else {
        state[station][name] = value;
      }
    },

    resetOutboundExternalNew: () => initialState
  }
});

export const {
  setOutboundExternalNew,
  selectShelf,
  clearSelectedShelves,
  updateLackStation,
  updateOrderList,
  clearPushButton,
  managerOutboundExternalNew,
  resetOutboundExternalNew
} = outboundExternalNewSlice.actions;

export default outboundExternalNewSlice.reducer;
