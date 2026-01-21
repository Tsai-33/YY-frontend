import { useRouter } from "next/router";
import CategoryBtn from "@/components/common/btns/categoryBtn";
import ActionBtn from "@/components/common/btns/actionBtn";

export default function ShelfTransfer() {
  const router = useRouter();
  const menuItems = [
    {
      key: "order",
      text: "訂單理貨",
      path: "/shelfTransfer/order",
      svgPath: "/common/icon-shelfTransfer-order.svg",
    },
    {
      key: "shelf",
      text: "貨架調整",
      path: "/shelfTransfer/shelf",
      svgPath: "/common/icon-shelfTransfer-adjust.svg",
    },
  ];

  return (
    <>
      <div className="absolute top-0 right-0">
        <ActionBtn
          icon="icon-goback"
          text="返回"
          variant="darkBlue"
          onClick={() => router.push("/workspace")}
        />
      </div>
      <div className="flex-1 flex justify-center items-center gap-40">
        {menuItems.map((item) => (
          <CategoryBtn
            key={item.key}
            svgPath={item.svgPath}
            text={item.text}
            variant="darkGreen"
            onClick={() => router.push(item.path)}
          />
        ))}
      </div>
    </>
  );
}
