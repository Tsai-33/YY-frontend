import { createSlice } from "@reduxjs/toolkit";
import { workstationConfig } from "@/config/workstationConfig";

const initialState = {
  area: null,
  ip: null,
  stations: [],
  jobs: [],
  currentStation: null,
  currentJob: null,
};

const workstationSlice = createSlice({
  name: "workstation",
  initialState,
  reducers: {
    setWorkstation(state, action) {
      return { ...state, ...action.payload };
    },
    setCurrentStation(state, action) {
      state.currentStation = action.payload;
    },
    setCurrentJob(state, action) {
      state.currentJob = action.payload;
    },
    resetWorkstation() {
      return initialState;
    },
  },
});

export const initWorkstation = (ip) => (dispatch) => {
  const config = workstationConfig;

  // --- A 區 (一台電腦，十個站台)
  if (config.A.computers.includes(ip)) {
    const stations = config.A.stations;

    dispatch(
      setWorkstation({
        area: "A",
        ip,
        stations: config.A.stations,
        jobs: config.A.jobs,
        currentStation: null,
        currentJob: null,
      })
    );

    // ⬅️ 如果 currentStation 為 null，自動設定為 A01
    dispatch(setCurrentStation(stations[0]));
    return { success: true };
  }
  // --- B 區 (兩台電腦，各管 5 個站)
  if (config.B.computers.includes(ip)) {
    const stations = config.B.stations[ip];

    dispatch(
      setWorkstation({
        area: "B",
        ip,
        stations: config.B.stations[ip], // 每台電腦管自己的 station
        jobs: config.B.jobs,
        currentStation: null,
        currentJob: null,
      })
    );
    // ⬅️ 自動設定成 B01 或 B06（依據 IP）
    dispatch(setCurrentStation(stations[0]));
    return { success: true };
  }

  // 未授權 IP
  return { success: false, message: "IP 未授權" };
};

export const {
  setWorkstation,
  setCurrentStation,
  setCurrentJob,
  resetWorkstation,
} = workstationSlice.actions;

export default workstationSlice.reducer;
