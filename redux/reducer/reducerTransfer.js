import { createSlice } from "@reduxjs/toolkit";

const createStation = () => ({
  screen: "idle",
  shelf: {}, // default ITEMS 這裡取
  shelfItem: [], // 目前貨架上的物品
  selected: [], // 目前選擇
});

const initialState = {
  step: 1,
  orderCode: "",
  waveNo: null,
  order: {},
  lackStation: [],
};

const transferSlice = createSlice({
  name: "transfer",
  initialState: initialState,
  reducers: {
    initStation(state, action) {
      const station = action.payload;

      if (!state[station]) {
        state[station] = createStation(station);
      }
    },
    setTransfer: (state, action) => {
      const { step, screen, orderCode, waveNo, order, shelf, shelfItem, selected, station, lackStation } = action.payload;
      if (!state[station]) return;

      if (step !== undefined) state.step = step;
      if (screen !== undefined) state[station].screen = screen;
      if (order !== undefined) state.order = order;
      if (orderCode !== undefined) state.orderCode = orderCode;
      if (waveNo !== undefined) state.waveNo = waveNo;
      if (shelf !== undefined) state[station].shelf = shelf;
      if (shelfItem !== undefined) state[station].shelfItem = shelfItem;
      if (selected !== undefined) state[station].selected = selected;
      if (lackStation !== undefined) state.lackStation = [...new Set([...state.lackStation, lackStation])];
    },
    setAllLoading: (state, action) => {
       const { stations } = action.payload;
       console.log(stations,'stations')
      stations.map((v) => {
        state[v].screen = "loading";
      });
    },
    updateShelfItem: (state, action) => {
      const { station, items } = action.payload;
      if (!state[station]) return;

      // 來源扣除
      state[station].shelfItem = state[station].shelfItem.map((v) => {
        const matched = items.find((i) => i.PRT_NO === v.PRT_NO);
        if (matched) {
          return { ...v, PP_NO: v.PP_NO - matched.PP_NO, BOX_NO: v.BOX_NO - matched.BOX_NO };
        }
        return v;
      });

      // 目的加入
      state["A01"].shelfItem = state["A01"].shelfItem.map((v) => {
        const matched = items.find((i) => i.PRT_NO === v.PRT_NO);
        if (matched) {
          return { ...v, PP_NO: v.PP_NO + matched.PP_NO, BOX_NO: v.BOX_NO + matched.BOX_NO };
        }
        return v;
      });
    },
    // 控制面板
    managerTransfer: (state, action) => {
      const { station, name, value, checked, index } = action.payload;
      if (!state[station]) return;

      if (name === "step") {
        state[name] = Number(value);
      } else if (name === "lackStation") {
        if (checked) {
          state.lackStation.push(station);
        } else {
          state.lackStation = state.lackStation.filter((v) => v !== station);
        }
      } else {
        state[station][name] = value;
      }
    },
    // 重置
    resetTransfer: (state, action) => {
      const { type, station, W_ID } = action.payload;
      if (type === "one") {
        state[station].screen = "loading";
      } else if (type === "all") {
        const nextState = { ...initialState };
        station.forEach((s) => {
          nextState[s] = createStation(s);
        });
        return nextState;
      }
    },
  },
});

export const { initStation, setAllLoading, setTransfer, updateShelfItem, managerTransfer, resetTransfer } = transferSlice.actions;

export default transferSlice.reducer;
