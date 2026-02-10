import Table from "@/components/common/table/table";
import { useState, useRef, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import NoCheckBoxTable from "../common/table/noCheckBoxTable";
import { setOutboundExternalNew } from "@/redux/reducer/reducerOutboundExternalNew";
import { getOutBoundExternalOrderDetailByWID } from "@/pages/api";

export default function OutboundExternalNewTable({ data, selectedArray, setSelectedArray, detailTableData, setDetailTableData }) {
    const dispatch = useDispatch();
    const { stations, currentStation } = useSelector((s) => s.workstation);
    const currentStationSafe = currentStation || stations?.[0] || "";
    const { orderCode, step, waveNo, shelfItem, selected } = useSelector((s) => s.outboundExternalNew[currentStationSafe] || {});
    const hasInitializedRef = useRef({});

    // =============== 畫面一 ====================
    const headers = [
        { label: "銷貨單號", key: "OUTSTOCK_NO", width: "50%" },
        // { label: "狀態", key: "STATUS", width: "15%", render: (row) => row.STATUS === 4 ? "部分出庫" : "" },
        { label: "出庫日期", key: "WORK_TIME", width: "30%" },
    ];

    const handleSelectedOption = (name, value, idKey) => {
        const valueId = value[idKey];
        if (name === "checkbox") {
            setSelectedArray((prev) => {
                const exists = prev.some(item => item.MAKE_NO === valueId);
                if (exists) {
                    return prev.filter(item => item.MAKE_NO !== valueId);
                } else {
                    return [...prev, {
                        PRT_NO: value.PRT_NO,
                        MAKE_NO: valueId,
                        outBoxNo: 1,
                        outPpNo: value.BOX_PACK || 0
                    }];
                }
            });
        } else if (name === "radio") {
            if (orderCode === valueId) {
                dispatch(
                    setOutboundExternalNew({
                        station: currentStationSafe,
                        order: {},
                        orderCode: "",
                        waveNo: null,
                        selectedShelves: [],
                    }));
            } else {
                dispatch(
                    setOutboundExternalNew({
                        station: currentStationSafe,
                        order: value,
                        orderCode: value?.OUTSTOCK_NO,
                        waveNo: value?.W_ID,
                        step: 2,
                        selectedShelves: [],
                    }));
            }
        }
    };

    // =============== 畫面二 ====================
    const detailHeaders = [
        { label: "", key: "checkbox", width: "10%" },
        { label: "產品品號", key: "PRT_NO", width: "60%" },
        { label: "總包數", key: "BOX_PACK", width: "30%" },
    ];

    // ============= 直接用 WMS 的 MAKE_NO 顯示 =============
    const filteredDetailData = useMemo(() => {
        if (!shelfItem) {
            return [];
        }

        // 從WMS展開 MAKE_NO
        const items = Array.isArray(shelfItem) ? shelfItem : [shelfItem];
        const expandedDetails = [];

        for (const item of items) {
            if (!item.MAKE_NO) continue;
            const makeNos = item.MAKE_NO.split(',').map(m => m.trim());
            const totalCount = makeNos.length;

            for (let i = 0; i < makeNos.length; i++) {
                const makeNo = makeNos[i];
                expandedDetails.push({
                    PRT_NO: item.PRT_NO,
                    PRT_NAME: item.PRT_NAME,
                    MAKE_NO: makeNo,
                    // 按比例分配 BOX_NO 和 PP_NO
                    BOX_NO: Math.ceil((item.BOX_NO || 0) / totalCount),
                    PP_NO: Math.round(((item.PP_NO || 0) / totalCount) * 100) / 100,
                    BOX_PACK: item.BOX_PACK || 0
                });
            }
        }
        return expandedDetails;
    }, [shelfItem]);

    // ============= 預設勾選整箱BOX_NO > 0 零散不勾 =============
    useEffect(() => {
        if (step !== 3 || filteredDetailData.length === 0 || hasInitializedRef.current[currentStationSafe]) return;
        const fullBoxItems = filteredDetailData
            .filter(item => {
                const boxNo = Number(item.BOX_NO) || 0;
                return boxNo > 0 && boxNo % 1 === 0;
            })
            .map(item => ({
                PRT_NO: item.PRT_NO,
                MAKE_NO: item.MAKE_NO,
                outBoxNo: 1,
                outPpNo: item.BOX_PACK || 0
            }));
        setSelectedArray(fullBoxItems);
        hasInitializedRef.current[currentStationSafe] = true;
    }, [step, filteredDetailData, currentStationSafe]);

    useEffect(() => {
        if (step <= 2) {
            hasInitializedRef.current[currentStationSafe] = false;
        }
    }, [step, currentStationSafe]);

    const checkedMakeNos = selectedArray.map(item => item.MAKE_NO);

    return (
        <>
            {step <= 2 &&
                <NoCheckBoxTable
                    headers={headers}
                    data={data}
                    type="radio"
                    name="outboundExternalNew"
                    variants="green"
                    idKey="OUTSTOCK_NO"
                    checked={orderCode}
                    onChange={handleSelectedOption}
                />}
            {step > 2 &&
                <Table
                    headers={detailHeaders}
                    data={filteredDetailData}
                    type="checkbox"
                    name="outboundExternalNew2"
                    variants="green"
                    idKey="MAKE_NO"
                    checked={checkedMakeNos}
                    onChange={handleSelectedOption}
                />}
        </>
    );
}
