import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import NoCheckBoxTable from "../common/table/noCheckBoxTable";
import { setTransfer } from "@/redux/reducer/reducerTransfer";
import TableAll from "../common/table/tableAll";
import { getTransferByWID } from "@/pages/api";
import PurposeTable from "./tables/purposeTable";
import SourceTable from "./tables/sourceTable";

export default function TransferTable({ data, data2, setData2 }) {
  const dispatch = useDispatch();
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const currentStationSafe = currentStation || stations?.[0] || "";
  const { step, orderCode, waveNo } = useSelector((s) => s.transfer);
  const { selected, shelfItem } = useSelector((s) => s.transfer[currentStationSafe] || {});

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
    { label: "", key: "checkbox", width: `48px` },
    { label: "產品品號", key: "PRT_NO", width: `60%` },
    { label: "調出數量", key: "BOX_PACK", width: `30%` },
  ];
  useEffect(() => {
    if (!waveNo) return;
    getList();
  }, [shelfItem]);
  const getList = async () => {
    try {
      const res = await getTransferByWID(waveNo);
      if (res.data.success) {
        const detail = res.data.data; // 陣列
        const newDetail = detail.map((v) => ({
          ...v,
          type: "new",
          checked: false,
        }));
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
      dispatch(setTransfer({ station: currentStation, selected: allIds }));
    } else {
      dispatch(setTransfer({ station: currentStation, selected: [] }));
    }
  };

  useEffect(() => {
    if (!selectAllRef.current) return;

    // 本頁可選取的資料（排除 shortage）
    const validData = data2.filter((item) => !item.shortage);

    // 是否真的「全部都在 selected 裡」
    const allSelected = validData.length > 0 && validData.every((v) => selected.some((s) => s.INSTOCK_NO === v.INSTOCK_NO));

    selectAllRef.current.checked = allSelected;
  }, [data2, selected]);

  return (
    <>
      {step <= 2 && <NoCheckBoxTable headers={tableHeader} data={data} type="radio" name="transfer" variants="green" idKey="INSTOCK_NO" checked={orderCode} onChange={handleSelectedOption} />}
      {currentStation === 'A01' && step > 2 && <PurposeTable height={`65vh`} headers={tableHeader2} data={data2} name="transfer2" idKey="INSTOCK_NO" />}
      {currentStation !== 'A01' && step > 2 && <SourceTable height={`65vh`} headers={tableHeader2} data={data2} type="checkbox" name="transfer2" idKey="OUTSTOCK_NO" checked={selected} onChange={handleSelectedOption} selectAllRef={selectAllRef} onChangeAll={handleSelectAll} />}
    </>
  );
}
