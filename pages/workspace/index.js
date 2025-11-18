import CategoryBtn from "@/components/common/btns/categoryBtn";
import Link from "next/link";
import { useState } from "react";

export default function WorkspaceIndex() {
  const [changeSpace, setChangeSpace] = useState(false);
  return (
    <>
      <div className="flex-1 flex justify-center items-center gap-50">
        {changeSpace ? (
          <>
            <Link href="/inbound">
              <CategoryBtn icon="icon-" text="入庫" variant="darkGreen" />
            </Link>
            <Link href="/">
              <CategoryBtn icon="icon-" text="調撥" variant="darkGreen" />
            </Link>
            <Link href="/">
              <CategoryBtn icon="icon-" text="盤點" variant="darkGreen" />
            </Link>
          </>
        ) : (
          <>
            <Link href="/outbound">
              <CategoryBtn icon="icon-" text="出庫" variant="darkGreen" />
            </Link>
            <Link href="/shelfTransfer">
              <CategoryBtn icon="icon-" text="理貨" variant="darkGreen" />
            </Link>
          </>
        )}
        <Link href="/">
          <CategoryBtn icon="icon-" text="庫存查詢" variant="darkGreen" />
        </Link>

        {/* ========= 臨時按鈕 ========= */}
        <button
          className="absolute top-0 left-0
          px-4 py-2
          rounded-xl
          bg-gradient-to-r from-red-500 to-pink-500
          text-white font-semibold
          shadow-md
          hover:shadow-xl
          hover:scale-105
          transition-all duration-200"
          onClick={() => {
            setChangeSpace(!changeSpace);
          }}
        >
          暫時切換按鈕
        </button>
        {/* ========= 臨時按鈕 ========= */}
      </div>
    </>
  );
}
