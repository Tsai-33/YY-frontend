import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentStation } from "@/redux/reducer/reducerWorkStations";
import { initStation } from "@/redux/reducer/reducerInventory";
import InventoryTable from "@/components/inventory/inventoryTable";
import InventoryShelf from "@/components/inventory/inventoryShelf";
import LoadingShelf from "@/components/common/loading/loading-shelf";

export default function Inventory() {
  const dispatch = useDispatch();
  const { stations, currentStation } = useSelector((s) => s.workstation);
  const { userId } = useSelector((state) => state.user);
  const { page } = useSelector((state) => state.inventory);
  const { screen } = useSelector((s) => s.inventory[currentStation] || {});

  useEffect(() => {
    // 一次性初始化所有站台
    stations.forEach((s) => {
      dispatch(initStation(s));
    });
  }, [stations]);

  return (
    <>
      {page === "inventory-table" && <InventoryTable />}
      {page === "inventory-shelf" && <InventoryShelf />}
      {screen === "loading" && <LoadingShelf />}
    </>
  );
}
