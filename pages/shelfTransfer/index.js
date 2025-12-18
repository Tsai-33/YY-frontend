import Link from "next/link";
import PageHeader from "@/components/common/pageHeader/pageHeader";
import CategoryBtn from "@/components/common/btns/categoryBtn";

export default function ShelfTransfer() {
    const menuItems = [
        { key: "order", text: "訂單理貨", path: "/shelfTransfer/order", icon: "" },
        { key: "shelf", text: "貨架調整", path: "/shelfTransfer/shelf", icon: "" },
    ];

    return (
        <>
            {/* <PageHeader title="理貨" backTo="/workspace" /> */}
            <div className="flex-1 flex justify-center items-center gap-20">
                {menuItems.map((item) => (
                    <Link key={item.key} href={item.path}>
                        <CategoryBtn icon={item.icon} text={item.text} variant="darkGreen" />
                    </Link>
                ))}
            </div>
        </>
    );
}