import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentPage: "home", // 預設在第一頁
  currentStep: 1,
  ip: "",
  history: [], // 記錄走過的頁面
};

const pageSlice = createSlice({
  name: "inbound",
  initialState,
  reducers: {
    setPage: (state, action) => {
      const page = action.payload;
      state.currentPage = page;
      state.history.push(page);
    },
    setStep: (state, action) => {
      const step = action.payload;
      state.currentStep = step;
    },
    setIP: (state, action) => {
      state.ip = action.payload;
    },
  },
});

export const { setPage, setStep, setIP } = pageSlice.actions;

export default pageSlice.reducer;
