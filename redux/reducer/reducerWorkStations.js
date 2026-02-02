import { createSlice } from "@reduxjs/toolkit";
import { workstationConfig } from "@/config/workstationConfig";

const IP_D = process.env.NEXT_PUBLIC_IP_D;

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
    const stations = config.A.stations[ip];

    dispatch(
      setWorkstation({
        area: "A",
        ip,
        stations: config.A.stations[ip],
        jobs: config.A.jobs,
        currentStation: null,
        currentJob: null,
      }),
    );

    // ⬅️ 如果 currentStation 為 null，自動設定為 A01
    dispatch(setCurrentStation(stations[0]));
    return { success: true };
  }
  // --- B 區 
  if (config.B.computers.includes(ip)) {
    const stations = config.B.stations[ip];

    dispatch(
      setWorkstation({
        area: "B",
        ip,
        stations: config.B.stations[ip],
        jobs: config.B.jobs,
        currentStation: null,
        currentJob: null,
      }),
    );
    // ⬅️ 自動設定成 B01 或 B06（依據 IP）
    dispatch(setCurrentStation(stations[0]));
    return { success: true };
  }

  // --- C 區
  if (config.C.computers.includes(ip)) {
    const stations = config.C.stations[ip];

    dispatch(
      setWorkstation({
        area: "C",
        ip,
        stations: config.C.stations[ip],
        jobs: config.C.jobs,
        currentStation: null,
        currentJob: null,
      }),
    );
    // ⬅️ 自動設定成 D01 或 D05（依據 IP）
    dispatch(setCurrentStation(stations[0]));
    return { success: true };
  }

  // 未授權 IP
  return { success: false, message: "IP 未授權" };
};

export const { setWorkstation, setCurrentStation, setCurrentJob, resetWorkstation } = workstationSlice.actions;

export default workstationSlice.reducer;
