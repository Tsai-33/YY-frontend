export const workstationConfig = {
  A: {
    computers: ["172.16.11.99", "172.16.11.74", "localhost"],
    stations: {
      "172.16.11.99": ["A01", "A02", "A03", "A04", "A05","A06", "A07", "A08", "A09", "A10"],
    },
    jobs: [
      { key: "inbound", text: "入倉", path: "/inbound", icon: "icon-inbound" },
      {
        key: "stockQuery",
        text: "庫存查詢",
        path: "/stockQuery",
        icon: "icon-stockQuery",
      },
      {
        key: "transfer",
        text: "調撥",
        path: "/transfer",
        icon: "icon-transfer",
      },
      {
        key: "inventory",
        text: "盤點",
        path: "/inventory",
        icon: "icon-inventory",
      },
    ],
  },

  B: {
    computers: ["172.16.11.75"],
    stations: {
      "172.16.11.75": ["B01", "B02", "B03", "B04", "B05"],
      "172.168.1.67": ["B06", "B07", "B08", "B09", "B10"],
      "172.168.1.88": ["B11", "B12", "B13", "B14"],
    },
    jobs: [
      {
        key: "outboundExternal",
        text: "銷貨",
        path: "/outboundExternal",
        icon: "icon-outboundExternal",
      },
      {
        key: "outboundInternal",
        text: "領用",
        path: "/outboundInternal",
        icon: "icon-outboundInternal",
      },
      {
        key: "shelfTransfer",
        text: "理貨",
        path: "/shelfTransfer",
        icon: "icon-shelfTransfer",
      },
      {
        key: "stockQuery",
        text: "庫存查詢",
        path: "/stockQuery",
        icon: "icon-stockQuery",
      },
      {
        key: "inventory",
        text: "盤點",
        path: "/inventory",
        icon: "icon-inventory",
      },
    ],
  },
};
