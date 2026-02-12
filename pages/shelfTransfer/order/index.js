import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import ShelfTransferTable from "@/components/shelfTransfer/shelfTransferTable";
import ShelfTransferStation from "@/components/shelfTransfer/shelfTransferStation";
import LoadingShelf from "@/components/common/loading/loading-shelf";
import ActionBtn from "@/components/common/btns/actionBtn";
import { resetShelfTransfer } from "@/redux/reducer/reducerShelfTransfer";

export default function ShelfTransferOrder() {
  const dispatch = useDispatch();
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const currentStationSafe = currentStation || stations?.[0] || "";

  const { step, screen } = useSelector((s) => s.shelfTransfer[currentStationSafe] || {});

  // 進入頁面時，如果沒有進行中的任務重置狀態
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      // 如果不是在理貨中(step 3)清除資料
      if (step !== 3) {
        dispatch(resetShelfTransfer());
      }
    }
  }, []);

  if (screen === "loading") {
    return <LoadingShelf />;
  }

  if (step === 3) {
    return <ShelfTransferStation />;
  }

  return <ShelfTransferTable />;
}
