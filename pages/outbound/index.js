import React, { useState } from "react";
import { CountAbnormalModal } from "@/components/modal/modal-list";
export default function Outbound() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => {
          setOpen(true);
        }}
      >打開</button>
      <CountAbnormalModal
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      />
    </div>
  );
}
