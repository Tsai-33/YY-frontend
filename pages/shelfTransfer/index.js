import Link from "next/link";
import { useRouter } from "next/router";
import CategoryBtn from "@/components/common/btns/categoryBtn";
import ActionBtn from "@/components/common/btns/actionBtn";

export default function ShelfTransfer() {
    const router = useRouter();
    const menuItems = [
        { key: "order", text: "訂單理貨", path: "/shelfTransfer/order", svgPath: "/common/icon-shelfTransfer-order.svg" },
        { key: "shelf", text: "貨架調整", path: "/shelfTransfer/shelf", svgPath: "/common/icon-shelfTransfer-adjust.svg" },
    ];

    return (
        <>
            <div className="w-full flex justify-end p-4">
                <ActionBtn icon="icon-goback" text="返回" variant="darkBlue" onClick={() => router.push("/workspace")} />
            </div>
            <div className="flex-1 flex justify-center items-center gap-20">
                {menuItems.map((item) => (
                    <Link key={item.key} href={item.path}>
                        <CategoryBtn svgPath={item.svgPath} text={item.text} variant="darkGreen" />
                    </Link>
                ))}
            </div>
        </>
    );
}