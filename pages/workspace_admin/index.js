import Link from "next/link";
import CategoryBtn from "@/components/common/btns/categoryBtn";

export default function WorkspaceIndex() {
  return (
    <>
      <div className="flex-1 flex justify-center items-center gap-50">
        <Link href="/usermanage">
          <CategoryBtn icon="icon-user" text="用戶管理" variant="darkGreen" />
        </Link>
        <Link href="/warehousePlan">
          <CategoryBtn
            icon="icon-stockArea"
            text="庫區倉別規劃"
            variant="darkGreen"
          />
        </Link>
      </div>
    </>
  );
}
