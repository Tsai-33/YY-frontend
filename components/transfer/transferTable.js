import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import NoCheckBoxTable from "../common/table/noCheckBoxTable";
import { setTransfer } from "@/redux/reducer/reducerTransfer";
import PurposeTable from "./tables/purposeTable";
import SourceTable from "./tables/sourceTable";

export default function TransferTable({ data, data2, setAbnormal }) {
  const dispatch = useDispatch();
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const currentStationSafe = currentStation || stations?.[0] || "";
  const { step, orderCode } = useSelector((s) => s.transfer);
  const { selected, job } = useSelector((s) => s.transfer[currentStationSafe] || {});

  // =============== 畫面一 ====================
  // radio table (左)
  const tableHeader = [
    { label: "調撥單號", key: "INSTOCK_NO", width: `50%` },
    { label: "調撥備註", key: "REMARK", width: `50%` },
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
      dispatch(setTransfer({ station: currentStation, selected: allIds }));
    } else if (name === "radio") {
      dispatch(setTransfer({ station: currentStation, order: value, orderCode: valueId, waveNo: value?.W_ID, step: 2 }));
    }
  };

  // =============== 畫面二 ====================
  // checkbox table
  const tableHeader2 = [
    { label: "", key: "checkbox", width: `10%` },
    { label: "產品品號", key: "PRT_NO", width: `60%` },
    { label: "調入總數", key: "PP_NO", width: `30%` },
  ];

  const tableHeader3 = [
    { label: "", key: "checkbox", width: `10%` },
    { label: "產品品號", key: "PRT_NO", width: `55%` },
    { label: "調出數量", key: "PP_NO", width: `20%` },
    { label: "動作", key: "", width: `15%` },
  ];

  //  全選 / 全不選
  const selectAllRef = useRef(null);
  const handleSelectAll = (e, allData) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      dispatch(setTransfer({ station: currentStation, selected: allData }));
    } else {
      dispatch(setTransfer({ station: currentStation, selected: [] }));
    }
  };

  // 控制全選按鈕
  useEffect(() => {
    if (!selectAllRef.current) return;

    // 本頁可選取的資料（排除 shortage）
    const validData = data2.filter((item) => !item.shortage);

    // 是否真的「全部都在 selected 裡」
    const allSelected = validData.length > 0 && validData.every((v) => selected.some((s) => s.OUTSTOCK_NO === v.OUTSTOCK_NO));

    selectAllRef.current.checked = allSelected;
  }, [data2, selected]);

  return (
    <>
      {step <= 2 && <NoCheckBoxTable headers={tableHeader} data={data} type="radio" name="transfer" variants="green" idKey="INSTOCK_NO" checked={orderCode} onChange={handleSelectedOption} />}
      {currentStation === stations[0] && step > 2 && <PurposeTable headers={tableHeader2} data={job} detail={data2} name="transfer1" idKey="INSTOCK_NO" />}
      {currentStation !== stations[0] && step > 2 && <SourceTable headers={tableHeader3} data={job} type="checkbox" name="transfer2" idKey="PRT_NO" checked={selected} onChange={handleSelectedOption} selectAllRef={selectAllRef} onChangeAll={handleSelectAll} setAbnormal={setAbnormal} />}
    </>
  );
}
