import TableAll from "@/components/common/table/tableAll";
import { useRef, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import NoCheckBoxTable from "../common/table/noCheckBoxTable";
import { setOutboundExternal } from "@/redux/reducer/reducerOutboundExternal";

export default function OutboundExternalTable({ data, selectedArray, setSelectedArray, detailTableData, setDetailTableData }) {
    const dispatch = useDispatch();
    const { stations, currentStation } = useSelector((s) => s.workstation);
    const currentStationSafe = currentStation || stations?.[0] || "";
    const { orderCode, step, waveNo, shelfItem, selected } = useSelector((s) => s.outboundExternal[currentStationSafe] || {});
    const hasInitializedRef = useRef({}); // 追蹤每個站點是否已做過初始勾選
    const selectAllRef = useRef(null);

    // =============== 畫面一 ====================
    const headers = [
        { label: "銷貨單號", key: "OUTSTOCK_NO", width: "60%" },
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
                        outPpNo: value.BOX_PACK || 0,
                        PALLET_NO: value.PALLET_NO || null
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
            if (orderCode === valueId) {
                dispatch(
                    setOutboundExternal({
                        station: currentStationSafe,
                        order: {},
                        orderCode: "",
                        waveNo: null
                    }));
            } else {
                dispatch(
                    setOutboundExternal({
                        station: currentStationSafe,
                        order: value,
                        orderCode: value?.OUTSTOCK_NO,
                        waveNo: value?.W_ID
                    }));
            }
        }
    };

    // =============== 畫面二 ====================
    const detailHeaders = [
        { label: "", key: "checkbox", width: "10%" },
        { label: "產品品號", key: "PRT_NO", width: "60%" },
        { label: "總包數", key: "BOX_PACK", width: "30%" },
    ]

    // ============= 直接用 WMS 的 MAKE_NO 顯示 =============
    const filteredDetailData = useMemo(() => {
        if (!shelfItem) {
            return [];
        }

        // 從 WMS 展開 MAKE_NO
        const items = Array.isArray(shelfItem) ? shelfItem : [shelfItem];
        const expandedDetails = [];

        for (const item of items) {
            if (!item.MAKE_NO) continue;
            const makeNos = item.MAKE_NO.split(',').map(m => m.trim());

            for (let i = 0; i < makeNos.length; i++) {
                const makeNo = makeNos[i];
                expandedDetails.push({
                    PRT_NO: item.PRT_NO,
                    PRT_NAME: item.PRT_NAME,
                    MAKE_NO: makeNo,
                    BOX_NO: 1,
                    PP_NO: item.BOX_PACK || 0,
                    BOX_PACK: item.BOX_PACK || 0,
                    PALLET_NO: item.PALLET_NO || null
                });
            }
        }
        return expandedDetails;
    }, [shelfItem]);

    // ============= 預設勾選整箱BOX_NO > 0 零散不勾 =============
    useEffect(() => {
        // 只有當 step 為 3、有資料、且該站點尚未做過初始勾選時才設定預設值
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
                outPpNo: item.BOX_PACK || 0,
                PALLET_NO: item.PALLET_NO || null
            }));

        setSelectedArray(fullBoxItems);
        hasInitializedRef.current[currentStationSafe] = true; // 標記該站點已初始化
    }, [step, filteredDetailData, currentStationSafe]);

    // 當 step 變回 <= 2 時重置該站點的初始化狀態
    useEffect(() => {
        if (step <= 2) {
            hasInitializedRef.current[currentStationSafe] = false;
        }
    }, [step, currentStationSafe]);

    const checkedMakeNos = selectedArray.map(item => item.MAKE_NO);
    // ===== Group By PRT_NO 版本=====
    // const checkedPrtNos = [...new Set(selectedArray.map(item => item.PRT_NO))];

    // ============= 全選/全不選 =============
    const handleSelectAll = (allData, idKey) => {
        const isChecked = selectAllRef.current.checked;
        if (isChecked) {
            const allItems = allData.map(item => ({
                PRT_NO: item.PRT_NO,
                MAKE_NO: item.MAKE_NO,
                outBoxNo: 1,
                outPpNo: item.BOX_PACK || 0,
                PALLET_NO: item.PALLET_NO || null
            }));
            setSelectedArray(allItems);
        } else {
            setSelectedArray([]);
        }
    };

    // 同步全選按鈕狀態
    useEffect(() => {
        if (!selectAllRef.current || step <= 2) return;
        const allSelected = filteredDetailData.length > 0 &&
            filteredDetailData.every(item => checkedMakeNos.includes(item.MAKE_NO));
        selectAllRef.current.checked = allSelected;
    }, [filteredDetailData, checkedMakeNos, step]);

    return (
        <>
        {step <= 2 &&
                <NoCheckBoxTable
                    headers={headers}
                    data={data}
                    type="radio"
                    name="outboundExternal"
                    variants="green"
                    idKey="OUTSTOCK_NO"
                    checked={orderCode}
                    onChange={handleSelectedOption}
                />}
            {step > 2 &&
                <TableAll
                    headers={detailHeaders}
                    data={filteredDetailData}
                    type="checkbox"
                    name="outboundExternal2"
                    variants="green"
                    idKey="MAKE_NO"
                    checked={selectedArray}
                    onChange={handleSelectedOption}
                    selectAllRef={selectAllRef}
                    onChangeAll={handleSelectAll}
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