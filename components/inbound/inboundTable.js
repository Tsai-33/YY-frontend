import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import TableAll from "../common/table/tableAll";
import NoCheckBoxTable from "../common/table/noCheckBoxTable";
import { setInbound, updateShelfItem } from "@/redux/reducer/reducerInbound";
import { getInboundByWID } from "@/pages/api";
export default function InboundTable({ data,data2,setData2 }) {
  const dispatch = useDispatch();
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const currentStationSafe = currentStation || stations?.[0] || "";
  const { waveNo, orderCode, step, shelfItem, selected } = useSelector((s) => s.inbound[currentStationSafe] || {});
  // =============== 畫面一 ====================
  // radio table (左)
  const tableHeader = [
    { label: "入倉單號", key: "INSTOCK_NO", width: `60%` },
    { label: "單據日期", key: "BILL_TIME", width: `35%` },
  ];
  const handleSelectedOption = (name, value, idKey) => {
    const valueId = value[idKey];
    if (name === "checkbox") {
      let allIds;
      if (selected.some((item) => item[idKey] === valueId)) {
        allIds = selected.filter((item) => item[idKey] !== valueId);
      } else {
        allIds = [...selected, value];
      }
      dispatch(setInbound({ station: currentStation, selected: allIds }));
    } else if (name === "radio") {
      dispatch(setInbound({ station: currentStation, order: value, orderCode: value?.INSTOCK_NO, waveNo: value?.W_ID, step: 2 }));
    }
  };

  // =============== 畫面二 ====================
  // checkbox table
  const tableHeader2 = [
    { label: "", key: "checkbox", width: `48px` },
    { label: "產品品號", key: "PRT_CODE", width: `60%` },
    { label: "每箱包數", key: "BOX_PACK", width: `30%` },
  ];
  useEffect(() => {
    if (!waveNo) return;
    getList();
  }, [shelfItem]);
  const getList = async () => {
    try {
      const res = await getInboundByWID(waveNo);
      if (res.data.success) {
        const detail = res.data.data; // 陣列
        const newDetail = detail.map((v) => ({ ...v, type: "new", checked: false }));
        setData2(newDetail);
      }
    } catch (err) {
      console.warn("getList :", err);
    }
  };

  // ======== select ==========
  //  全選 / 全不選
  const selectAllRef = useRef(null);
  const handleSelectAll = (allData, idKey) => {
    const isChecked = selectAllRef.current.checked;
    const allIds = allData.filter((item) => !item.shortage);
    if (isChecked) {
      dispatch(setInbound({ station: currentStation, selected: allIds }));
    } else {
      dispatch(setInbound({ station: currentStation, selected: [] }));
    }
  };

  return (
    <>
      {step <= 2 && <NoCheckBoxTable headers={tableHeader} data={data} type="radio" name="inbound" variants="green" idKey="INSTOCK_NO" checked={orderCode} onChange={handleSelectedOption} />}
      {step > 2 && <TableAll height={`59vh`} headers={tableHeader2} data={data2} type="checkbox" name="inbound2" variants="green" idKey="INSTOCK_NO" checked={selected} onChange={handleSelectedOption} selectAllRef={selectAllRef} onChangeAll={handleSelectAll} />}
    </>
  );
}
