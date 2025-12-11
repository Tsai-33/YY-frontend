import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Table from "../common/table/table";
import NoCheckBoxTable from "../common/table/noCheckBoxTable";
import { setInbound } from "@/redux/reducer/reducerInbound";
import { getInboundByWID } from "@/pages/api";
export default function InboundTable({
  data,
  selectedArray,
  setSelectedArray,
}) {
  const dispatch = useDispatch();
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const currentStationSafe = currentStation || stations?.[0] || "";
  const { waveNo, orderCode, step, shelfItem } = useSelector(
    (s) => s.inbound[currentStationSafe] || {}
  );
  const [tableData2, setTableData2] = useState([]);

  // =============== 畫面一 ====================
  // radio table (左)
  const tableHeader = [
    { label: "訂單單號/製令單號", key: "INSTOCK_NO", width: `60%` },
    { label: "入庫日期", key: "BILL_TIME", width: `35%` },
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
      dispatch(
        setInbound({
          station: currentStation,
          order: value,
          orderCode: value?.INSTOCK_NO,
          waveNo: value?.W_ID,
          step: 2,
        })
      );
    }
  };

  // =============== 畫面二 ====================
  // checkbox table
  const tableHeader2 = [
    { label: "", key: "checkbox", width: `8%` },
    { label: "產品品號", key: "PRT_CODE", width: `60%` },
    { label: "每箱包數", key: "BOX_PACK", width: `32%` },
  ];
  useEffect(() => {
    if (!waveNo) return;
    getList();
  }, [shelfItem]);
  const getList = async () => {
    try {
      const res = await getInboundByWID(waveNo);
      if (res.data.success) {
        // const all = {shelf.} // 物件
        const detail = res.data.data; // 陣列
        setTableData2([...detail]);
      }
    } catch (err) {
      console.warn("getList :", err);
    }
  };
  return (
    <>
      {step <= 2 && (
        <NoCheckBoxTable
          headers={tableHeader}
          data={data}
          type="radio"
          name="inbound"
          variants="green"
          idKey="INSTOCK_NO"
          checked={orderCode}
          onChange={handleSelectedOption}
        />
      )}
      {step > 2 && (
        <Table
          headers={tableHeader2}
          data={tableData2}
          type="checkbox"
          name="inbound2"
          variants="green"
          idKey="INSTOCK_NO"
          checked={selectedArray}
          onChange={handleSelectedOption}
        />
      )}
    </>
  );
}
