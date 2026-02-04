import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import TableAll from "../common/table/tableAll";
import NoCheckBoxTable from "../common/table/noCheckBoxTable";
import { setInbound } from "@/redux/reducer/reducerInbound";
import { getList } from "./inboundFunction";


export default function InboundTable({ data, data2, setData2 }) {
  const dispatch = useDispatch();
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const currentStationSafe = currentStation || stations?.[0] || "";
  const { orderCode, step, selected, shelfItem, waveNo } = useSelector((s) => s.inbound[currentStationSafe] || {});
  // =============== 畫面一 ====================
  // radio table (左)
  const tableHeader = [
    { label: "入倉單號", key: "INSTOCK_NO", width: `35%` },
    { label: "訂單單號", key: "SALE_NO", width: `35%` },
    { label: "客戶", key: "CUS_NO", width: `15%` },
    { label: "日期", key: "BILL_TIME", width: `15%` },
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

      // 顯示選擇
      if (allIds?.length <= 0) {
        dispatch(setInbound({ station: currentStation, step: 3 }));
      } else {
        dispatch(setInbound({ station: currentStation, step: 4 }));
      }

      dispatch(setInbound({ station: currentStation, selected: allIds }));
    } else if (name === "radio") {
      dispatch(
        setInbound({
          station: currentStation,
          order: value,
          orderCode: value?.INSTOCK_NO,
          waveNo: value?.W_ID,
          step: 2,
        }),
      );
    }
  };

  // 搜尋 WMS 相關資料

  // =============== 畫面二 ====================
  // checkbox table
  const tableHeader2 = [
    { label: "", key: "checkbox", width: `48px` },
    { label: "產品品號", key: "PRT_NO", width: `60%` },
    { label: "總包數", key: "BOX_PACK", width: `30%` },
  ];
  useEffect(() => {
    if (!waveNo) return;
    getList(waveNo, setData2);
  }, [shelfItem]);

  // ======== select ==========
  const selectAllRef = useRef(null);
  const handleSelectAll = (allData, idKey) => {
    const isChecked = selectAllRef.current.checked;
    const allIds = allData.filter((item) => !item.shortage);
    if (isChecked) {
      dispatch(setInbound({ station: currentStation, selected: allIds, step: 4 }));
    } else {
      dispatch(setInbound({ station: currentStation, selected: [], step: 3 }));
    }
  };

  // 控制全選按鈕
  useEffect(() => {
    if (!selectAllRef.current) return;

    // 本頁可選取的資料
    const validData = data2.filter((item) => item.W_ID == waveNo);

    // 是否真的「全部都在 selected 裡」
    const allSelected = validData.length > 0 && validData.every((v) => selected.some((s) => s.INSTOCK_NO === v.INSTOCK_NO));
    selectAllRef.current.checked = allSelected;
  }, [data2, selected]);

  return (
    <>
      {step <= 2 && <NoCheckBoxTable headers={tableHeader} data={data} type="radio" name="inbound" variants="green" idKey="INSTOCK_NO" checked={orderCode} onChange={handleSelectedOption} />}
      {step > 2 && <TableAll headers={tableHeader2} data={data2} type="checkbox" name="inbound2" variants="green" idKey="INSTOCK_NO" checked={selected} onChange={handleSelectedOption} selectAllRef={selectAllRef} onChangeAll={handleSelectAll} />}
    </>
  );
}
