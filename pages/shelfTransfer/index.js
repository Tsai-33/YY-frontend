import Table from "@/components/common/table/table";
import { testTable } from "./testData";

export default function ShelfTransfer() {

    const headers = [
        { label: "訂單單號", key: "orderNumber", width: "50%" },
        { label: "配置貨架數量", key: "deploy", width: "40%" },
        { label: "箱數", key: "box", width: "10%" },
    ];
    
    return (
        <Table
            variant="green"
            type="checkbox"
            headers={headers}
            data={testTable}
            needInput={false}
            idKey="orderNumber"
            height="55vh"
        />
    )
}