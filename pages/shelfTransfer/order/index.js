import { useSelector } from "react-redux";
import ShelfTransferTable from "@/components/shelfTransfer/shelfTransferTable";
import ShelfTransferStation from "@/components/shelfTransfer/shelfTransferStation";
import LoadingShelf from "@/components/common/loading/loading-shelf";
import ActionBtn from "@/components/common/btns/actionBtn";

export default function ShelfTransferOrder() {
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const currentStationSafe = currentStation || stations?.[0] || "";

  const { step, screen } = useSelector((s) => s.shelfTransfer[currentStationSafe] || {});

  if (screen === "loading") {
    return <LoadingShelf />;
  }

  if (step === 3) {
    return <ShelfTransferStation />;
  }

  return <ShelfTransferTable />;
}
