import { createSlice } from "@reduxjs/toolkit";
import { setCurrentStation } from "./reducerWorkStations";

const stationList = ["B01", "B02", "B03", "B04", "B05"];

const createStation = () => ({
  step: 1,                // 1: 選擇訂單階段, 2: 揀貨階段
  selectedOrder: null,    // 選中的訂單
  orderInput: "",         // 銷貨單條碼輸入
  selectedShelveData: [], // 該訂單的貨架資料
  selectedProducts: [],   // 選中的產品(揀貨)
  isLoading: false
});

const initialState = stationList.reduce(
  (acc, id) => {
    acc[id] = createStation();
    return acc;
  },
  {
    orderList: [], // 訂單列表
    currentStation: "B01"
  }
)


const outboundExternal = createSlice({
  name: "outboundExternal",
  initialState,
  reducers: {
    setOutbound: (state, action) => {
      const {
        station,
        step,
        selectedOrder,
        orderInput,
        boxBarcodeInput,
        selectedShelveData,
        selectedProducts,
        isLoading,
        orderList,
        currentStation
      } = action.payload;

      // 沒有指定站點的話不執行
      if (!state[station]) return;

      // 更新欄位
      if (step !== undefined) state[station].step = step;
      if (selectedOrder !== undefined) state[station].selectedOrder = selectedOrder;
      if (orderInput !== undefined) state[station].orderInput = orderInput;
      if (boxBarcodeInput !== undefined) state[station].boxBarcodeInput = boxBarcodeInput;
      if (selectedShelveData !== undefined) state[station].selectedShelveData = selectedProducts;
      if (selectedProducts !== undefined) state[station].selectedProducts = selectedProducts;
      if (isLoading !== undefined) state[station].isLoading = isLoading;
      if (orderList !== undefined) state.orderList = [...new Set([...state.orderList, ...orderList])];
      if (currentStation !== undefined) state.currentStation = currentStation;
    },

    // 切換到下一個階段
    nextStep: (state, action) => {
      const { station } = action.payload;
      if (!state[station]) return;
      state[station].step = state
    },

    // 重置某個站點的狀態
    resetStation: (state, action) => {
      const { station } = action.payload;
      if (!state[station]) return;
      state[station] = createStation();
    },

    // 設定當前站點
    setCurrentStation: (state, action) => {
      state.currentStation = action.payload;
    }
  }
});

export const {
  setOutbound,
  nextStep,
  resetStation,
  setCurrentStation
} = outboundSlice.actions;

export default outboundSlice.reducer;

// const initialState = {
//   page: 'A01',
//   step: 1,
//   A01: "",
// };

// const pageSlice = createSlice({
//   name: "outbound",
//   initialState,
//   reducers: {},
// });

// export const {} = pageSlice.actions;

// export default pageSlice.reducer;
