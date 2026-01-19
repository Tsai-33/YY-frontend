const IP_A = process.env.NEXT_PUBLIC_IP_A;
const IP_A1 = process.env.NEXT_PUBLIC_IP_A1;
const IP_B = process.env.NEXT_PUBLIC_IP_B;
const IP_C = process.env.NEXT_PUBLIC_IP_C;
const IP_D = process.env.NEXT_PUBLIC_IP_D;

export const workstationConfig = {
  A: {
    computers: [IP_A, IP_A1, "localhost"],
    stations: {
      [IP_A]: [
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
      [IP_A1]: [
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
    computers: [IP_B, IP_C, IP_D],
    stations: {
      [IP_B]: ["B01", "B02", "B03", "B04", "B05"],
      [IP_C]: ["C01", "C02", "C03", "C04", "C05"],
      [IP_D]: ["D01", "D02", "D03", "D04"],
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
