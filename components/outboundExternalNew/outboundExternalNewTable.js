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
                        outBoxNo: value.BOX_NO,
                        outPpNo: value.PP_NO
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
        { label: "總包數", key: "PP_NO", width: "30%" },
    ];

    // ============= 根據波次拿訂單的細節 =============
    useEffect(() => {
        if (!waveNo || step < 3) return;
        getList();
    }, [waveNo, step]);
    const getList = async () => {
        try {
            const res = await getOutBoundExternalOrderDetailByWID(waveNo);
            if (res.data.success) {
                setDetailTableData(res.data.data);
            }
        } catch (error) {
            console.warn("getList: ", error);
        }
    };

    // ============= 用當前站點貨架的 MAKE_NO 過濾 ORDER_DETAIL =============
    const filteredDetailData = useMemo(() => {
        console.log('=== DEBUG filteredDetailData ===');
        console.log('shelfItem:', shelfItem);
        console.log('detailTableData:', detailTableData);

        if (!shelfItem || !detailTableData || detailTableData.length === 0) {
            console.log('條件不滿足: shelfItem=', !!shelfItem, ', detailTableData長度=', detailTableData?.length || 0);
            return [];
        }

        // 1. 從貨架取得所有 MAKE_NO
        const items = Array.isArray(shelfItem) ? shelfItem : [shelfItem];
        const shelfMakeNos = items.flatMap(item => {
            if (!item.MAKE_NO) return [];
            return item.MAKE_NO.split(',').map(m => m.trim());
        });
        console.log('shelfMakeNos (拆分後):', shelfMakeNos);

        // 2. 展開 ORDER_DETAIL 中的 MAKE_NO
        const expandedDetails = [];
        for (const detail of detailTableData) {
            if (!detail.MAKE_NO) continue;
            const makeNos = detail.MAKE_NO.split(',').map(m => m.trim());
            const totalCount = makeNos.length;

            for (let i = 0; i < makeNos.length; i++) {
                const makeNo = makeNos[i];
                // 只保留貨架上有的 MAKE_NO
                if (shelfMakeNos.includes(makeNo)) {
                    expandedDetails.push({
                        ...detail,
                        MAKE_NO: makeNo,
                        // 按比例分配 BOX_NO 和 PP_NO
                        BOX_NO: Math.ceil((detail.BOX_NO || 0) / totalCount),
                        PP_NO: Math.round(((detail.PP_NO || 0) / totalCount) * 100) / 100
                    });
                }
            }
        }
        return expandedDetails;
    }, [shelfItem, detailTableData]);

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
                outBoxNo: item.BOX_NO,
                outPpNo: item.PP_NO
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
