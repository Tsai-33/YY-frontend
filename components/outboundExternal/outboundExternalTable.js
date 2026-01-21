import Table from "@/components/common/table/table";
import { useState, useRef, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import NoCheckBoxTable from "../common/table/noCheckBoxTable";
import { setOutboundExternal } from "@/redux/reducer/reducerOutboundExternal";
import { getOutBoundExternalOrderDetailByWID } from "@/pages/api";

export default function OutboundExternalTable({ data, selectedArray, setSelectedArray, detailTableData, setDetailTableData }) {
    const dispatch = useDispatch();
    const { stations, currentStation } = useSelector((s) => s.workstation);
    const currentStationSafe = currentStation || stations?.[0] || "";
    const { orderCode, step, waveNo, shelfItem, selected } = useSelector((s) => s.outboundExternal[currentStationSafe] || {});

    // =============== 畫面一 ====================
    const headers = [
        { label: "銷貨單號", key: "SALE_NO", width: "60%" },
        { label: "出庫日期", key: "WORK_TIME", width: "30%" },
    ];

    const handleSelectedOption = (name, value, idKey) => {
        const valueId = value[idKey];
        if (name === "checkbox") {
            setSelectedArray((prev) => {
                const exists = prev.some(item =>
                    item.MAKE_NO === valueId ||
                    item.MAKE_NO?.includes(valueId)
                );

                if (exists) {
                    return prev.filter(item =>
                        item.MAKE_NO !== valueId &&
                        !item.MAKE_NO?.includes(valueId)
                    );
                } else {
                    return [...prev, {
                        PRT_NO: value.PRT_NO,
                        MAKE_NO: valueId,
                        outBoxNo: value.BOX_NO,
                        outPpNo: value.PP_NO
                    }];
                }
            });
            // ===== Group By PRT_NO 版本 =====
            // setSelectedArray((prev) => {
            //     // 檢查該 PRT_NO 是否已被勾選
            //     const exists = prev.some(item => item.PRT_NO === valueId);
            //
            //     if (exists) {
            //         return prev.filter(item => item.PRT_NO !== valueId);
            //     } else {
            //         const newItems = (value.MAKE_NOs || []).map(makeNo => ({
            //             PRT_NO: value.PRT_NO,
            //             MAKE_NO: makeNo,
            //             outBoxNo: value.totalBOX_NO,
            //             outPpNo: value.totalPP_NO
            //         }));
            //         return [...prev, ...newItems];
            //     }
            // });
        } else if (name === "radio") {
            dispatch(
                setOutboundExternal({
                    station: currentStationSafe,
                    order: value,
                    orderCode: value?.SALE_NO,
                    waveNo: value?.W_ID
                }));
        }
    };

    // =============== 畫面二 ====================
    const detailHeaders = [
        { label: "", key: "checkbox", width: "10%" },
        { label: "產品品號", key: "PRT_NO", width: "60%" },
        { label: "總包數", key: "PP_NO", width: "30%" },
    ]

    // ============= 根據波次拿訂單的細節 =============
    useEffect(() => {
        if (!waveNo || step < 3) return;
        getList();
    }, [waveNo, step]);
    const getList = async () => {
        try {
            const res = await getOutBoundExternalOrderDetailByWID(waveNo);
            if (res.data.success) {
                const detail = res.data.data;
                setDetailTableData(detail);
            }
        } catch (error) {
            console.warn("getList: ", error);
        }
    };

    // ============= 用當前站點貨架的 MAKE_NO 過濾 ORDER_DETAIL =============
    const filteredDetailData = useMemo(() => {
        if (!shelfItem || !detailTableData || detailTableData.length === 0) {
            return [];
        }

        const items = Array.isArray(shelfItem) ? shelfItem : [shelfItem];

        // 取得所有 MAKE_NO 並展開逗號分隔的值
        const shelfMakeNos = items.flatMap(item => {
            if (!item.MAKE_NO) return [];
            return item.MAKE_NO.split(',').map(m => m.trim());
        });

        // 用貨架的 MAKE_NO 比對 ORDER_DETAIL 的 MAKE_NO
        return detailTableData.filter(detail => shelfMakeNos.includes(detail.MAKE_NO));

        // ===== Group By PRT_NO 版本=====
        // const matched = detailTableData.filter(detail => shelfMakeNos.includes(detail.MAKE_NO));
        //
        // // 按 PRT_NO 分組加總
        // const grouped = matched.reduce((acc, item) => {
        //     const prtNo = item.PRT_NO;
        //     if (!acc[prtNo]) {
        //         acc[prtNo] = {
        //             PRT_NO: prtNo,
        //             PRT_NAME: item.PRT_NAME,
        //             totalPP_NO: 0,
        //             totalBOX_NO: 0,
        //             MAKE_NOs: []
        //         };
        //     }
        //     acc[prtNo].totalPP_NO += Number(item.PP_NO) || 0;
        //     acc[prtNo].totalBOX_NO += Number(item.BOX_NO) || 0;
        //     acc[prtNo].MAKE_NOs.push(item.MAKE_NO);
        //     return acc;
        // }, {});
        //
        // return Object.values(grouped).map(group => ({
        //     PRT_NO: group.PRT_NO,
        //     PRT_NAME: group.PRT_NAME,
        //     PP_NO: `${group.totalPP_NO}(${group.totalBOX_NO}箱)`,
        //     totalPP_NO: group.totalPP_NO,
        //     totalBOX_NO: group.totalBOX_NO,
        //     MAKE_NOs: group.MAKE_NOs
        // }));
    }, [shelfItem, detailTableData]);

    // ============= 預設勾選整箱BOX_NO > 0 零散不勾 =============
    useEffect(() => {
        // 只有當 step 為 3、有資料、且尚未選擇任何資料時才顯示預設值
        if (step !== 3 || filteredDetailData.length === 0 || selectedArray.length > 0) return;

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

        // ===== Group By PRT_NO 版本=====
        // const fullBoxItems = filteredDetailData
        //     .filter(item => item.totalBOX_NO > 0)
        //     .flatMap(item =>
        //         item.MAKE_NOs.map(makeNo => ({
        //             PRT_NO: item.PRT_NO,
        //             MAKE_NO: makeNo,
        //             outBoxNo: item.totalBOX_NO,
        //             outPpNo: item.totalPP_NO
        //         }))
        //     );
        // setSelectedArray(fullBoxItems);
    }, [step, filteredDetailData, selectedArray.length]);

    const checkedMakeNos = selectedArray.map(item => item.MAKE_NO);
    // ===== Group By PRT_NO 版本=====
    // const checkedPrtNos = [...new Set(selectedArray.map(item => item.PRT_NO))];

    return (
        <>
            {step <= 2 && 
                <NoCheckBoxTable 
                    headers={headers} 
                    data={data} 
                    type="radio" 
                    name="outboundExternal" 
                    variants="green" 
                    idKey="SALE_NO" 
                    checked={orderCode} 
                    onChange={handleSelectedOption} 
                />}
            {step > 2 &&
                <Table
                    headers={detailHeaders}
                    data={filteredDetailData}
                    type="checkbox"
                    name="outboundExternal2"
                    variants="green"
                    idKey="MAKE_NO"
                    checked={checkedMakeNos}
                    onChange={handleSelectedOption}
                />}
            {/* ===== Group By PRT_NO 版本 =====
            {step > 2 &&
                <Table
                    headers={detailHeaders}
                    data={filteredDetailData}
                    type="checkbox"
                    name="outboundExternal2"
                    variants="green"
                    idKey="PRT_NO"
                    checked={checkedPrtNos}
                    onChange={handleSelectedOption}
                />}
            */}            
        </>
    )
}