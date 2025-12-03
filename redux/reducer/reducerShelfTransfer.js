import { createSlice } from "@reduxjs/toolkit";

const stationList = ["B01", "B02", "B03", "B04", "B05"];

const createStation = () => ({
    step: 1,                // 1: 選擇訂單, 2: 選擇貨架, 3: 理貨中
    screen: "idle",
    orderCode: "",
    waveNo: null,
    order: {},              // 訂單內容
    selectedShelves: [],    // 選中的貨架 ID 陣列
    shelveData: {},
    targetShelve: "", 
});

const initialState = stationList.reduce(
    (acc, id) => {
        acc[id] = createStation();
        return acc;
    },
    { orderList: [], lackStation: [] }
);

const shelfTransferSlice = createSlice({
    name: "shelfTransfer",
    initialState,
    reducers: {
        setShelfTransfer: (state, action) => {
            const { station, step, screen, orderCode, waveNo, order, selectedShelves, shelveData, targetShelve, orderList, lackStation} = action.payload;
        
            if (!state[station]) return;

            if (step !== undefined) state[station].step = step;
            if (screen !== undefined) state[station].screen = screen;
            if (orderCode !== undefined) state[station].orderCode = orderCode;
            if (waveNo !== undefined) state[station].waveNo = waveNo;
            if (order !== undefined) state[station].order = order;
            if (selectedShelves !== undefined) state[station].selectedShelves = selectedShelves;
            if (shelveData !== undefined) state[station].shelveData = shelveData;
            if (targetShelve !== undefined) state[station].targetShelve = targetShelve;
            if (orderList !== undefined) state.orderList = [...new Set([...state.orderList, orderList])];
            if (lackStation !== undefined) state.lackStation = [...new Set([...state.lackStation, lackStation])];
        },

        // 更新貨架資料(理貨轉移時)
        updateShelveData: (state, action) => {
            const { station, sourceShelve, targetShelve, itemIds } = action.payload;
            if (!state[station]) return;

            const shelveData = state[station].shelveData;

            // 來源貨架拿掉項目
            if (shelveData[sourceShelve]) {
                const itemsToMove = shelveData[sourceShelve].filter(item => itemIds.includes(item.id));
                shelveData[sourceShelve] = shelveData[sourceShelve].filter(item => !itemIds.includes(item.id));
            
                // 目的貨架加入項目
                if (!shelveData[targetShelve]) {
                    shelveData[targetShelve] = [];
                }
                shelveData[targetShelve] = [...shelveData[targetShelve], ...itemsToMove];
            }
        },

        // 被占用的站點
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

        // 已選的訂單
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

        // 控制面板用
        managerShelfTransfer: (state, action) => {
            const { station, name, value } = action.payload;
            if (!state[station]) return;

            if (name === "step") {
                state[station][name] = Number(value);
            } else {
                state[station][name] = value;
            }
        },

        resetShelfTransfer: () => initialState,
    }
});

export const {
  setShelfTransfer,
  updateShelveData,
  updateLackStation,
  updateOrderList,
  managerShelfTransfer,
  resetShelfTransfer,
} = shelfTransferSlice.actions;

export default shelfTransferSlice.reducer;