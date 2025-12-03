import { useSelector } from "react-redux";
import ShelfTransferTable from "@/components/shelfTransfer/shelfTransferTable";
import ShelfTransferStation from "@/components/shelfTransfer/shelfTransferStation";

export default function shelfTransfer() {
    const { stations, currentStation } = useSelector((s) => s.workstation);
    const currentStationSafe = currentStation || stations?.[0] || "";

    const { step, screen } = useSelector(
        (s) => s.shelfTransfer[currentStationSafe] || {}
    );

    if (screen === "loading") {
        return <LoadingShelf />;
    }

    if (step === 3) {
        return <ShelfTransferStation />;
    }

    return (
        <ShelfTransferTable />
    )
}