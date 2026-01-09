export const workstationConfig = {
  A: {
    computers: ["172.16.11.99","192.168.1.100", "localhost"],
    stations: {
      "172.16.11.99": [
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
      "192.168.1.100":[
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
      ]
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
    computers: ["172.16.11.75", "172.16.11.74"],
    stations: {
      "172.16.11.75": ["B01", "B02", "B03", "B04", "B05"],
      "172.168.1.67": ["C01", "C02", "C03", "C04", "C05"],
      "172.16.11.74": ["D01", "D02", "D03", "D04"],
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
