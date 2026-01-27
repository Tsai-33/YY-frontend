import Table from "@/components/common/table/table";
import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import NoCheckBoxTable from "../common/table/noCheckBoxTable";
import { setOutboundInternal } from "@/redux/reducer/reducerOutboundInternal";
import { getOutboundInternalOrderDetailByWID } from "@/pages/api";

export default function OutboundInternalTable({ data, selectedArray, setSelectedArray, detailTableData, setDetailTableData }) {
    const dispatch = useDispatch();
    const { stations, currentStation } = useSelector((s) => s.workstation);
    const currentStationSafe = currentStation || stations?.[0] || "";
    const { orderCode, step, waveNo, shelfItem, selected } = useSelector((s) => s.outboundInternal[currentStationSafe] || {});

    // =============== 畫面一 ====================
    const headers = [
        { label: "領用單號", key: "OUTSTOCK_NO", width: "60%" },
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
                    setOutboundInternal({
                        station: currentStationSafe,
                        order: {},
                        orderCode: "",
                        waveNo: null
                    }));
            } else {
                dispatch(
                    setOutboundInternal({
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
        { label: "總包數", key: "PP_NO", width: "30%" },
    ]

    // ============= 根據波次拿訂單的細節 =============
    useEffect(() => {
        if (!waveNo || step < 3) return;
        getList();
    }, [waveNo, step]);
    const getList = async () => {
        try {
            const res = await getOutboundInternalOrderDetailByWID(waveNo);
            if (res.data.success) {
                const detail = res.data.data;
                setDetailTableData(detail);
            }
        } catch (error) {
            console.warn("getList: ", error);
        }
    };

    // ============= 預設勾選整箱BOX_NO > 0 零散不勾 =============
    useEffect(() => {
        if (step !== 3 || detailTableData.length === 0) return;
        const fullBoxItems = detailTableData
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
    }, [step, detailTableData]);

    const checkedMakeNos = selectedArray.map(item => item.MAKE_NO);

    return (
        <>
        {step <= 2 &&
                <NoCheckBoxTable
                    headers={headers}
                    data={data}
                    type="radio"
                    name="outboundInternal"
                    variants="green"
                    idKey="OUTSTOCK_NO"
                    checked={orderCode}
                    onChange={handleSelectedOption}
                />}
            {step > 2 && 
                <Table 
                    headers={detailHeaders} 
                    data={detailTableData} 
                    type="checkbox" 
                    name="outboundInternal2" 
                    variants="green" 
                    idKey="MAKE_NO" 
                    checked={checkedMakeNos} 
                    onChange={handleSelectedOption} 
                />}            
        </>
    )
}