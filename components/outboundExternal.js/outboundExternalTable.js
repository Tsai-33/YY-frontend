import Table from "@/components/common/table/table";
import { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import NoCheckBoxTable from "../common/table/noCheckBoxTable";
import { setOutboundExternal } from "@/redux/reducer/reducerOutboundExternal";

export default function OutboundExternalTable({ data, selectedArray, setSelectedArray }) {
    const dispatch = useDispatch();
    const { stations, currentStation } = useSelector((s) => s.workstation);
    const currentStationSafe = currentStation || stations?.[0] || "";
    const { orderCode, step } = useSelector((s) => s.outboundExternal[currentStationSafe] || {});
    const [detailTableData, setDetailTableData] = useState([]);

    // =============== 畫面一 ====================
    const headers = [
        { label: "銷貨單號", key: "orderId", width: "60%" },
        { label: "出庫日期", key: "outbound_date", width: "30%" },
    ];

    const handleSelectedOption = (name, value, idKey) => {
        const valueId = value[idKey];
        if (name === "checkbox") {
            setSelectedArray((prev) => {
                let newArray;
                if (prev.includes(valueId)) {
                    newArray = prev.filter((id) => id !== valueId);
                } else {
                    newArray = [...prev, valueId];
                }
                return newArray;
            });
        } else if (name === "radio") {
          dispatch(setOutboundExternal({ station: currentStation, orderCode: valueId, step: 2 }));
        }
    };

    // =============== 畫面二 ====================
    const detailHeaders = [
        { label: "", key: "checkbox", width: "10%" },
        { label: "產品品號", key: "material", width: "60%" },
        { label: "總包數", key: "bag", width: "30%" },
    ]

    return (
        <>
            {step <= 2 && <NoCheckBoxTable headers={headers} data={data} type="radio" name="outboundExternal" variants="green" idKey="orderId" checked={orderCode} onChange={handleSelectedOption} />}
            {step > 2 && <Table headers={detailHeaders} data={detailTableData} type="checkbox" name="outboundExternal2" variants="green" idKey="orderId" checked={selectedArray} onChange={handleSelectedOption} />}
        </>
    )
}