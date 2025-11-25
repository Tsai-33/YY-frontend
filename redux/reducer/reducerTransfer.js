import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  step: 1,
};

const pageSlice = createSlice({
  name: "transfer",
  initialState,
  reducers: {
    setTransfer: (state, action) => {
      const { step } = action.payload;
      if (step !== undefined) state.step = step;
    },
  },
});

export const { setTransfer } = pageSlice.actions;

export default pageSlice.reducer;
