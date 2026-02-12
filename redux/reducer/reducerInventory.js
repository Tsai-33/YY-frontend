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
    batchNo: null,
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

      const initRowStateIfNeeded = (stationState, shelfItem) => {
        if (!Array.isArray(shelfItem)) return;

        // 已存在 rowState 就不覆蓋（避免使用者已操作）
        if (
          Array.isArray(stationState.rowState) &&
          stationState.rowState.length
        ) {
          return;
        }

        stationState.rowState = shelfItem.map((item) => ({
          ...item,
          actualQty: item.PP_NO,
          confirmed: false,
          error: false,
        }));
      };

      // 更新所有站
      if (station === "*") {
        Object.keys(state)
          .filter(
            (key) =>
              key !== "page" &&
              key !== "batchNo" &&
              key !== "_persist" &&
              typeof state[key] === "object" &&
              state[key] !== null,
          ) // 只更新站點
          .forEach((stationKey) => {
            Object.assign(state[stationKey], data);
            initRowStateIfNeeded(state[stationKey], data.shelfItem);
          });
        return;
      }

      // 更新單一站
      if (!state[station]) return;
      Object.assign(state[station], data);
      initRowStateIfNeeded(state[station], data.shelfItem);
    },

    // setInventory: (state, action) => {
    //   const { station, data } = action.payload;

    //   // 1. 先處理資料轉換 (加上 rowState)
    //   const processedData = {
    //     ...data,
    //     rowState: data.shelfItem
    //       ? data.shelfItem.map((item) => ({
    //           ...item,
    //           actualQty: item.PP_NO,
    //           confirmed: false,
    //           error: false,
    //         }))
    //       : [],
    //   };

    //   // 更新所有站
    //   if (station === "*") {
    //     Object.keys(state).forEach((key) => {
    //       if (
    //         !["page", "batchNo", "_persist"].includes(key) &&
    //         typeof state[key] === "object"
    //       ) {
    //         // 直接遍歷屬性賦值，確保每一個 key 都被寫入
    //         Object.keys(processedData).forEach((prop) => {
    //           state[key][prop] = processedData[prop];
    //         });
    //       }
    //     });
    //     return;
    //   }

    //   // 更新單一站
    //   if (!state[station]) return;

    //   // 改用這種方式賦值，不要用 Object.assign
    //   Object.keys(processedData).forEach((prop) => {
    //     state[station][prop] = processedData[prop];
    //   });
    // },

    setAllStations(state, action) {
      const { data } = action.payload;

      Object.keys(state.stations).forEach((station) => {
        Object.assign(state.stations[station], data);
      });
    },
    setPage(state, action) {
      state.page = action.payload;
    },
    setBatchNo(state, action) {
      state.batchNo = action.payload;
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
      const { station, prtNo, saleNo, updates } = action.payload;
      const rows = state[station].rowState;

      state[station].rowState = rows.map((row) =>
        row.PRT_NO === prtNo && row.SALE_NO === saleNo
          ? { ...row, ...updates }
          : row,
      );
    },

    resetRowState: (state, action) => {
      const { station, prtNo } = action.payload;
      const rows = state[station].rowState;

      state[station].rowState = rows.map((row) =>
        row.PRT_NO === prtNo ? { ...row, confirmed: false, error: false } : row,
      );
    },
    clearRowState: (state, action) => {
      const { station } = action.payload;
      if (station === "*") {
        Object.keys(state).forEach((key) => {
          if (
            typeof state[key] === "object" &&
            state[key] !== null &&
            Array.isArray(state[key].rowState)
          ) {
            state[key].rowState = [];
          }
        });
        return;
      }

      // 清單一站
      if (!state[station]) return;
      state[station].rowState = [];
    },
  },
});

export const {
  initStation,
  setInventory,
  setAllStations,
  setPage,
  setBatchNo,
  setInitialRowState,
  updateRowState,
  resetRowState,
  clearRowState,
} = inventorySlice.actions;

export default inventorySlice.reducer;
