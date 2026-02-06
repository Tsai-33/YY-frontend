import { createSlice } from "@reduxjs/toolkit";

const createStation = (station) => ({
  station: station,
  step: 1,
  screen: "idle",
  orderCode: "",
  waveNo: null,
  order: {}, // 入庫單內容
  shelf: {}, // default ITEMS 這裡取
  shelfItem: [], // 目前貨架上的物品
  selected: [], // 目前選擇
  shelves: [], // 多選的車
  remark: "", // 共用備註
  job: [], // 指定貨物
});

const initialState = {
  orderList: [],
  lackStation: [],
};

const inboundSlice = createSlice({
  name: "inbound",
  initialState: initialState,
  reducers: {
    initStation(state, action) {
      const station = action.payload;

      if (!state[station]) {
        state[station] = createStation(station);
      }
    },
    setInbound: (state, action) => {
      const { job, orderList, step, screen, orderCode, waveNo, order, shelf, shelfItem, selected, station, lackStation, remark } = action.payload;
      if (!state[station]) return;

      if (job !== undefined) {
        //  [ { Est_PRT_NO: '01TSL048290MB', Est_Boxes: 0, Est_PPs: 0 } ]
        const edit_job = []
        
        edit_job.PRT_NO = edit_job.Est_PRT_NO
        console.log(job, "123");
        state[station].job = job;
      }
      if (step !== undefined) state[station].step = step;
      if (screen !== undefined) state[station].screen = screen;
      if (order !== undefined) state[station].order = order;
      if (orderCode !== undefined) state[station].orderCode = orderCode;
      if (remark !== undefined) state[station].remark = remark;
      if (waveNo !== undefined) state[station].waveNo = waveNo;
      if (shelf !== undefined) state[station].shelf = shelf;
      if (shelfItem !== undefined) state[station].shelfItem = shelfItem;
      if (selected !== undefined) state[station].selected = selected;
      if (orderList !== undefined) state.orderList = [...new Set([...state.orderList, orderList])];
      if (lackStation !== undefined) state.lackStation = [...new Set([...state.lackStation, lackStation])];
    },
    selectShelf: (state, action) => {
      const { shelf, station } = action.payload;
      if (!shelf?.SHELVE_ID) return; // 安全檢查

      const isExisted = state[station].shelves.find((item) => item.SHELVE_ID === shelf.SHELVE_ID);

      if (isExisted) {
        state[station].shelves = state[station].shelves.filter((item) => item.SHELVE_ID !== shelf.SHELVE_ID);
      } else {
        state[station].shelves.push(shelf);
      }
    },
    clearAllShelves: (state) => {
      Object.keys(state).forEach((key) => {
        if (state[key] && Array.isArray(state[key].shelves)) {
          state[key].shelves = [];
        }
      });
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
    updateShelfItem: (state, action) => {
      const { station, items } = action.payload;
      console.log(station, items);
      state[station].shelfItem = items;
    },

    // 控制面板
    managerInbound: (state, action) => {
      const { station, name, value, checked, index } = action.payload;
      if (!state[station]) return;

      if (name === "step") {
        state[station][name] = Number(value);
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
    resetInbound: (state, action) => {
      const { type, station, W_ID } = action.payload;

      if (type === "one") {
        state[station].screen = "loading";
      } else if (type === "all") {
        const nextState = { ...initialState };

        station.forEach((s) => {
          nextState[s] = createStation(s);
        });

        return nextState;
      } else if (type === "wave") {
        // 1️⃣ 先清除 lackStation 中跟這個 wave 有關的 stationId
        if (Array.isArray(state.lackStation)) {
          state.lackStation = state.lackStation.filter((stationId) => {
            const s = state[stationId];
            return !(s && s.waveNo === W_ID);
          });
        }

        // 2️⃣ 先清除 orderList 中跟這個 wave 有關的訂單
        state.orderList = state.orderList.filter((orderId) => orderId !== state[station].orderCode);

        // 3️⃣ 再重置 waveNo === W_ID 的 station
        // 沒寫成功，只清除了一個
        Object.keys(state).forEach((key) => {
          const s = state[key];
          if (s && typeof s === "object" && "waveNo" in s && s.waveNo === W_ID) {
            state[key] = createStation();
          }
        });
      } else if (type === "search") {
        Object.keys(state).forEach((key) => {
          const s = state[key];
          if (s && typeof s === "object" && "waveNo" in s && s.waveNo === W_ID) {
            state[key] = createStation();
          }
        });
      }
    },
  },
});

export const { initStation, setInbound, updateLackStation, updateOrderList, updateShelfItem, managerInbound, resetInbound, selectShelf, clearAllShelves } = inboundSlice.actions;
export default inboundSlice.reducer;
