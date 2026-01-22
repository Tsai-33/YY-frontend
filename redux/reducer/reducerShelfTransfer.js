import { createSlice } from "@reduxjs/toolkit";

const stationList = ["B01", "B02", "B03", "B04", "B05", "C01", "C02", "C03", "C04", "C05", "D01", "D02", "D03", "D04"];

const createStation = () => ({
    step: 1,                // 1: 選擇訂單, 2: 選擇貨架, 3: 理貨中
    screen: "idle",
    mode: "",               // order, shelf
    orderCode: "",
    waveNo: null,
    order: {},              // 訂單內容
    selectedShelves: [],    // 選中的貨架 ID 陣列
    shelveData: {},         // 每個貨架的物品
    shelveStatus: {},       // 每個貨架的狀態
    targetShelve: "",       // 目的貨架
    selectedItems: {},      // 選中的項目
    shelveChecks: {},       // 護角/封膜checkbox狀態
    pushButton: null        // 實體按鈕訊號
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
            const { station, step, screen, mode, orderCode, waveNo, order, selectedShelves,
                shelveData, shelveStatus, targetShelve, selectedItems, orderList, lackStation, shelf, shelfItem, isReturn, pushButton
            } = action.payload;

            // 處理退回貨架
            if (isReturn && shelf) {
                const shelveId = shelf.SHELVE_ID;

                // 更新所有包含該貨架的站點(因為叫車時每個站點都有相同的selectedShelves)
                for (const stationId of stationList) {
                    const stationData = state[stationId];
                    if (!stationData?.selectedShelves?.includes(shelveId)) continue;

                    // 標記貨架退回
                    stationData.shelveStatus[shelveId] = "returned";

                    // 清空該貨架的資料
                    delete stationData.shelveData[shelveId];
                    delete stationData.shelveChecks[shelveId];

                    // 檢查是否所有貨架都退回了
                    const allReturned = stationData.selectedShelves.every(
                        id => stationData.shelveStatus[id] === "returned"
                    );
                    if (allReturned) {
                        state[stationId] = createStation();
                    }
                }
                return;
            }

            if (shelf && shelfItem) {
                const shelveId = shelf.SHELVE_ID;
                for (const stationId of stationList) {
                    const stationData = state[stationId];
                    // 檢查這個貨架是否在selectedShelves裡面確保是理貨的車
                    if (stationData.selectedShelves?.includes(shelveId)) {
                        // MAKE_NO 拆成多筆
                        const itemsWithId = shelfItem.flatMap(item => {
                            const makeNos = item.MAKE_NO
                                ? item.MAKE_NO.split(',').map(m => m.trim())
                                : [item.MAKE_NO];
                            return makeNos.map(makeNo => ({
                                ...item,
                                id: makeNo,
                                MAKE_NO: makeNo
                            }));
                        });

                        stationData.shelveData[shelveId] = itemsWithId;
                        stationData.shelveStatus[shelveId] = "ready";

                        // 拿到SEAL
                        if (!stationData.shelveChecks) {
                            stationData.shelveChecks = {};
                        }

                        const sealValue = parseInt(shelfItem[0]?.SEAL, 10) || 0;
                        stationData.shelveChecks[shelveId] = sealValue;

                        // ===== 檢查是否所有貨架都到站了 =====
                        const allShelves = stationData.selectedShelves || [];
                        const allReady = allShelves.every(id => {
                            const status = stationData.shelveStatus[id];
                            return status === "ready";
                        });

                        // 所有貨架到站才切換到working 否則保持 loading
                        if (allReady) {
                            stationData.screen = "working";
                        }

                        // 確保step是 3(理貨中)
                        stationData.step = 3;
                    }
                }
                return;
            }
        
            if (!state[station]) return;

            if (step !== undefined) state[station].step = step;
            if (screen !== undefined) state[station].screen = screen;
            if (mode !== undefined) state[station].mode = mode;
            if (orderCode !== undefined) state[station].orderCode = orderCode;
            if (waveNo !== undefined) state[station].waveNo = waveNo;
            if (order !== undefined) state[station].order = order;
            if (selectedShelves !== undefined) state[station].selectedShelves = selectedShelves;
            if (shelveData !== undefined) state[station].shelveData = shelveData;
            if (shelveStatus !== undefined) state[station].shelveStatus = shelveStatus;
            if (targetShelve !== undefined) state[station].targetShelve = targetShelve;
            if (selectedItems !== undefined) state[station].selectedItems = selectedItems;
            if (orderList !== undefined) state.orderList = [...new Set([...state.orderList, orderList])];
            if (lackStation !== undefined) state.lackStation = [...new Set([...state.lackStation, lackStation])];
            if (pushButton !== undefined) state[station].pushButton = pushButton;
        },

        // 單一貨架到站時更新
        updateShelveArrival: (state, action) => {
            const { station, shelveId, items } = action.payload;
            if (!state[station]) return;

            // 更新貨架的資料和狀態
            state[station].shelveData[shelveId] = items;
            state[station].shelveStatus[shelveId] = "ready";
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

            // 清空選中的項目
            state[station].selectedItems = {};
            state[station].targetShelve = "";
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

        // 更新選中的項目
        updateSelectedItems: (state, action) => {
            const { station, shelveId, itemId } = action.payload;
            if (!state[station]) return;

            const selectedItems = state[station].selectedItems;
            const currentSelected = selectedItems[shelveId] || [];

            // 如果選了其他貨架的項目，先清空之前的選擇
            const otherShelveSelected = Object.keys(selectedItems).some(
                id => id !== shelveId && selectedItems[id]?.length > 0
            );
            if (otherShelveSelected) {
                state[station].selectedItems = {};
            }

            // 切換選中狀態
            if (currentSelected.includes(itemId)) {
                state[station].selectedItems[shelveId] = currentSelected.filter(id => id !== itemId);
            } else {
                if (!state[station].selectedItems[shelveId]) {
                    state[station].selectedItems[shelveId] = [];
                }
                state[station].selectedItems[shelveId].push(itemId);
            }
        },

        // 設定目的貨架
        setTargetShelve: (state, action) => {
            const { station, targetShelve } = action.payload;
            if (!state[station]) return;
            state[station].targetShelve = targetShelve;
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

        // 護角 / 封膜 / 打包
        setShelveCheck: (state, action) => {
            const { station, shelveId, value } = action.payload;
            if (!state[station]) return;

            if (!state[station].shelveChecks) {
                state[station].shelveChecks = {};
            }
            
            state[station].shelveChecks[shelveId] = value;
        },

        // 退回貨架
        handleShelveReturn: (state, action) => {
            const { shelveId } = action.payload;
            
            for (const stationId of stationList) {
                const station = state[stationId];
                if (!station?.selectedShelves?.includes(shelveId)) continue;

                station.selectedShelves = station.selectedShelves.filter(id => id !== shelveId);

                // 清空已被退回貨架資料
                delete station.shelveData[shelveId];
                delete station.shelveStatus[shelveId];
                delete station.shelveChecks[shelveId];

                // 如果所有貨架都退回了 重置站點
                if (station.selectedShelves.length === 0) {
                    state[stationId] = createStation();
                }

                break;
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

        // 重置單一站點
        resetStation: (state, action) => {
            const { station } = action.payload;
            if (state[station]) {
                state[station] = createStation();
            }
        },

        // 清除實體按鈕訊號
        clearPushButton: (state, action) => {
            const { station } = action.payload;
            if (state[station]) {
                state[station].pushButton = null;
            }
        },

        resetShelfTransfer: () => initialState,
    }
});

export const {
    setShelfTransfer,
    updateShelveArrival,
    updateShelveData,
    updateSelectedItems,
    setTargetShelve,
    updateLackStation,
    updateOrderList,
    setShelveCheck,
    handleShelveReturn,
    managerShelfTransfer,
    resetStation,
    clearPushButton,
    resetShelfTransfer,
} = shelfTransferSlice.actions;

export default shelfTransferSlice.reducer;