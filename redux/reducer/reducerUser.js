import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userId: "",
  userIP: "",
  userName: "",
  userRole: "",
};

const pageSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      const { id, name, role } = action.payload;
      if (id !== undefined) state.userId = id;
      if (name !== undefined) state.userName = name;
      if (role !== undefined) state.userRole = role;
    },
    setIP: (state, action) => {
      state.userIP = action.payload;
    },
    resetUser: () => initialState,
  },
});

export const { setUser, setIP, resetUser } = pageSlice.actions;

export default pageSlice.reducer;
