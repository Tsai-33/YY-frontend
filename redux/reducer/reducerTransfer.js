import { createSlice } from "@reduxjs/toolkit";

const createStation = () => ({
  screen: "idle",
  shelf: {}, // default ITEMS 這裡取
  shelfItem: [], // 目前貨架上的物品
  selected: [], // 目前選擇
  job: [], // 要顯示的單據
});

const initialState = {
  step: 1,
  orderCode: "",
  waveNo: null,
  order: {},
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
      const { step, screen, orderCode, waveNo, order, shelf, shelfItem, selected, station, job } = action.payload;
      if (!state[station]) return;
      if (step !== undefined) state.step = step;
      if (screen !== undefined) state[station].screen = screen;
      if (order !== undefined) state.order = order;
      if (orderCode !== undefined) state.orderCode = orderCode;
      if (waveNo !== undefined) state.waveNo = waveNo;
      if (shelf !== undefined) state[station].shelf = shelf;
      if (shelfItem !== undefined) state[station].shelfItem = shelfItem;
      if (selected !== undefined) state[station].selected = selected;
      if (job !== undefined) {
        const newJob = job.map((v) => ({ OUTSTOCK_NO: state.orderCode, BOX_NO: v.Est_Boxes, PP_NO: v.Est_PPs, PRT_NO: v.Est_PRT_NO, AREA: v.MEMO }));
        state[station].job = newJob;
      }
    },
    setAllLoading: (state, action) => {
      const { stations } = action.payload;
      stations.map((v) => {
        state[v].screen = "loading";
      });
    },
    updateShelfItem: (state, action) => {
      const { station, items, ppStation } = action.payload;
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
      const currentDestItems = [...(state[ppStation].shelfItem || [])];
      items.forEach((newItem) => {
        const existingIdx = currentDestItems.findIndex((v) => v.PRT_NO === newItem.PRT_NO);
        if (existingIdx > -1) {
          const existingItem = currentDestItems[existingIdx];
          currentDestItems[existingIdx] = {
            ...existingItem,
            PP_NO: Number(existingItem.PP_NO || 0) + Number(newItem.PP_NO || 0),
            BOX_NO: Number(existingItem.BOX_NO || 0) + Number(newItem.BOX_NO || 0),
          };
        } else {
          // 🚨 如果 B 站原本沒有這個產品 (暫無資料的情況)，就直接 push 進去
          currentDestItems.push({ ...newItem });
        }
      });
      state[ppStation].shelfItem = currentDestItems;

      // JOB移除
      const removeSet = new Set(items.map((i) => i.PRT_NO));0
      state[station].job = state[station].job.filter((v) => !removeSet.has(v.PRT_NO));

    },
    // 控制面板
    managerTransfer: (state, action) => {
      const { station, name, value } = action.payload;
      if (!state[station]) return;

      if (name === "step") {
        state[name] = Number(value);
      } else {
        state[station][name] = value;
      }
    },
    // 重置
    resetTransfer: (state, action) => {
      const { type, station, W_ID } = action.payload;

      console.log(type, station, W_ID, "station");

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
