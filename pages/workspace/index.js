import CategoryBtn from "@/components/common/btns/categoryBtn";
import PageTitle from "@/components/common/pageTitle";
import Link from "next/link";

export default function WorkspaceIndex() {
  return (
    <>
      <div className="flex-1 flex justify-center items-center gap-50">
        <Link href="/inventory/fullCheck">
          <CategoryBtn icon="icon-FullAreaInventoryCheck" text="全區盤點" variant="purple" />
        </Link>
        <Link href="/inventory/cycleCheck">
          <CategoryBtn icon="icon-FluctuationInventoryCheck" text="波動盤點" variant="purple" />
        </Link>
        <Link href="/inventory/abnormalCheck">
          <CategoryBtn icon="icon-InventoryDiscrepancyList" text="盤點異常清單" variant="purple" />
        </Link>
      </div>
    </>
  );
}
