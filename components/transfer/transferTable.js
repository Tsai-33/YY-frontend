import React, { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import Table from "../common/table/table";
import NoCheckBoxTable from "../common/table/noCheckBoxTable";
import { setTransfer } from "@/redux/reducer/reducerTransfer";

export default function TransferTable({ data, selectedArray, setSelectedArray }) {
  const dispatch = useDispatch();
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const currentStationSafe = currentStation || stations?.[0] || "";
  const { orderCode, step } = useSelector((s) => s.transfer[currentStationSafe] || { step: 1, orderCode: "" });
  const [tableData2, setTableData2] = useState([]);

  // =============== 畫面一 ====================
  // radio table (左)
  const tableHeader = [
    { label: "調撥單號", key: "orderId", width: `50%` },
    { label: "調撥備註", key: "remark", width: `50%` },
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
      dispatch(setTransfer({ station: currentStation, orderCode: valueId, step: 2 }));
    }
  };

  // =============== 畫面二 ====================
  // checkbox table
  const tableHeader2 = [
    { label: "", key: "checkbox", width: `5%` },
    { label: "產品品號", key: "productId", width: `60%` },
    { label: "調出數量", key: "count", width: `35%` },
  ];

  return (
    <>
      {step <= 2 && <NoCheckBoxTable headers={tableHeader} data={data} type="radio" name="transfer" variants="green" idKey="orderId" checked={orderCode} onChange={handleSelectedOption} />}
      {step > 2 && <Table headers={tableHeader2} data={tableData2} type="checkbox" name="transfer2" variants="green" idKey="orderId" checked={selectedArray} onChange={handleSelectedOption} />}
    </>
  );
}
