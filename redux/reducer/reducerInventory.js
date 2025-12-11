import { createSlice } from "@reduxjs/toolkit";

const initialStationState = (station) => ({
  screen: "idle",
  station: station,
  filter: {
    stockArea: "",
    cusNo: "",
    saleNo: "",
    prtNo: "",
  },
  shelf: {
    SHELVE_ID: "",
  },
  shelfItem: [],
});

const inventorySlice = createSlice({
  name: "inventory",
  initialState: {
    page: "inventory-table",
  },
  reducers: {
    // 初始化某個站 (若不存在就建立)
    initStation(state, action) {
      const station = action.payload;

      if (!state[station]) {
        state[station] = initialStationState(station);
      }
    },

    setInventory: (state, action) => {
      const { station, data } = action.payload;

      // 更新所有站
      if (station === "*") {
        Object.keys(state)
          .filter((key) => key !== "page") // 只更新站點
          .forEach((stationKey) => {
            Object.assign(state[stationKey], data);
          });
        return;
      }

      // 更新單一站
      if (!state[station]) return;
      Object.assign(state[station], data);
    },

    setAllStations(state, action) {
      const { data } = action.payload;

      Object.keys(state.stations).forEach((station) => {
        Object.assign(state.stations[station], data);
      });
    },
    // 更新 page
    setPage(state, action) {
      state.page = action.payload;
    },
    setInitialRowState: (state, action) => {
      const { station, shelfItem, fromStorage } = action.payload;
      state[station] = {
        ...state[station],
        rowState: fromStorage
          ? shelfItem // ← localStorage 的資料
          : shelfItem.map((item) => ({
              // ← 初始化
              ...item,
              actualQty: item.PP_NO,
              confirmed: false,
              error: false,
            })),
      };
    },

    updateRowState: (state, action) => {
      const { station, prtNo, updates } = action.payload;
      const rows = state[station].rowState;

      state[station].rowState = rows.map((row) =>
        row.PRT_NO === prtNo ? { ...row, ...updates } : row
      );
    },

    resetRowState: (state, action) => {
      const { station, prtNo } = action.payload;
      const rows = state[station].rowState;

      state[station].rowState = rows.map((row) =>
        row.PRT_NO === prtNo ? { ...row, confirmed: false, error: false } : row
      );
    },
  },
});

export const {
  initStation,
  setInventory,
  setAllStations,
  setPage,
  setInitialRowState,
  updateRowState,
  resetRowState,
} = inventorySlice.actions;

export default inventorySlice.reducer;
