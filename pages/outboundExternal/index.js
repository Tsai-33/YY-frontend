import React, { useState } from "react";
import { useSelector } from "react-redux";
import OutboundExternalTable from "@/components/outboundExternal.js/outboundExternalTable";

export default function OutboundExternal() {
  const currentStep = useSelector((state) => state.page.currentStep);
  return (
    <OutboundExternalTable />
  );
}
