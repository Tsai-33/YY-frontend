export const workstationConfig = {
  A: {
    computers: ["172.16.11.99", "172.16.11.74"],
    stations: [
      "A01",
      "A02",
      "A03",
      "A04",
      "A05",
      "A06",
      "A07",
      "A08",
      "A09",
      "A10",
    ],
    jobs: [
      { key: "inbound", text: "入庫", path: "/inbound", icon: "" },
      { key: "stockQuery", text: "庫存查詢", path: "/stockQuery", icon: "" },
      { key: "transfer", text: "調撥", path: "/transfer", icon: "" },
      { key: "inventory", text: "盤點", path: "/inventory", icon: "" },
    ],
  },

  B: {
    computers: ["172.16.11.75"],
    stations: {
      "172.16.11.75": ["B01", "B02", "B03", "B04", "B05"],
      "172.168.1.67": ["B06", "B07", "B08", "B09", "B10"],
    },
    jobs: [
      { key: "outboundExternal", text: "銷貨出庫", path: "/outboundExternal", icon: "" },
      { key: "inventory", text: "庫存查詢", path: "/inventory", icon: "" },
      { key: "sorting", text: "理貨", path: "/sorting", icon: "" },
    ],
  },
};
