import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  page: 'A01',
  step: 1,
  A01: "",
};

const pageSlice = createSlice({
  name: "outbound",
  initialState,
  reducers: {},
});

export const {} = pageSlice.actions;

export default pageSlice.reducer;
