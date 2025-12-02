export const testTable = [
    { orderId: "M510-11403200017", outbound_date: 20251207 },
    { orderId: "F220-11402180005", outbound_date: 20251017 },
    { orderId: "M510-11403200041", outbound_date: 20251027 },
    { orderId: "F220-11401230004", outbound_date: 20250301 },
    { orderId: "M510-11403050032", outbound_date: 20251230 },
    { orderId: "F220-11403110001", outbound_date: 20251017 },
    { orderId: "M510-11403220041", outbound_date: 20250916 },
    { orderId: "F220-11402180010", outbound_date: 20251111 },
    { orderId: "F220-11402200004", outbound_date: 20251017 },
]

export const testShelve = [
    { orderId: "M510-11403200017", shelve_Id:"R0001", box: 9, bag: 2250, stock_class: "美規", stock: "D01", material:"Y01TSL025100YB", materialSpec: "黑色束帶,100條/包,250包/箱" },
    { orderId: "F220-11402180005", shelve_Id:"R0100", box: 13, bag: 1820, stock_class: "歐規", stock: "F02", material:"Y01TSL025100YB", materialSpec: "黑色束帶,100條/包,700包/箱" },
    { orderId: "F220-11402180005", shelve_Id:"R0100", box: 9, bag: 810, stock_class: "歐規", stock: "F02", material:" Y01TSL036150YB", materialSpec: "黑色束帶,100條/包,400包/箱" },
    { orderId: "M510-11403200041", shelve_Id:"R0200", box: 41, bag: 2050, stock_class: "美規", stock: "F02", material:"Y01TSL045300YB", materialSpec: "黑色束帶,100條/包,140包/箱" },
    { orderId: "F220-11401230004", shelve_Id:"R0250", box: 15, bag: 750, stock_class: "歐規", stock: "F02", material:"Y01TSL076290YB", materialSpec: "黑色束帶,100條/包,75包/箱" },
    { orderId: "F220-11401230004", shelve_Id:"R0250", box: 27, bag: 4050, stock_class: "歐規", stock: "F02", material:"Y01TSL033290YT", materialSpec: "黑色束帶,100條/包,200包/箱" },
]

export const testShelveGroups = [
    {
        shelveId: "R0002",
        items: ["M510-11403200013-0001"]
    },
    {
        shelveId: "R0003",
        items: [
            "M510-11403200017-0012",
            "M510-11403200017-0013",
            "M510-11403200017-0014",
            "M510-11403200017-0015",
            "M510-11403200017-0016",
            "M510-11403200017-0017",
            "M510-11403200017-0018",
            "M510-11403200017-0019",
            "M510-11403200017-0020"
        ]
    },
    {
        shelveId: "R0004",
        items: ["M510-11403200020-0001"]
    },
    {
        shelveId: "R0005",
        items: [
            "M510-11403200041-0001",
            "M510-11403200041-0002",
            "M510-11403200041-0003",
            "M510-11403200041-0004",
            "M510-11403200041-0005",
            "M510-11403200041-0006",
            "M510-11403200041-0007",
            "M510-11403200041-0008",
            "M510-11403200041-0009"
        ]
    }
]