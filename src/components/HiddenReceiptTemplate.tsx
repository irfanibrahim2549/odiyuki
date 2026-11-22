"use client";

import React from "react";
import { ReceiptCard } from "./ReceiptCard";
import type { OrderNote } from "@/types";

interface HiddenReceiptTemplateProps {
  order: OrderNote | null;
  receiptRef: React.RefObject<HTMLDivElement | null>;
}

export function HiddenReceiptTemplate({
  order,
  receiptRef,
}: HiddenReceiptTemplateProps) {
  if (!order) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed -left-[9999px] top-0 pointer-events-none select-none z-[-1]"
    >
      <div ref={receiptRef} className="w-[420px] bg-white p-[4px] rounded-[24px]">
        <ReceiptCard order={order} isExport />
      </div>
    </div>
  );
}
