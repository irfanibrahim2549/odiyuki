import React from "react";
import { BrandLogo } from "./BrandLogo";
import { formatOrderDate, formatRupiah } from "@/lib/format";
import type { OrderNote } from "@/types";

interface ReceiptCardProps {
  order: OrderNote;
  isExport?: boolean;
}

export function ReceiptCard({ order, isExport = false }: ReceiptCardProps) {
  const addressText = order.buyerInfo.address?.trim();
  const notesText = order.buyerInfo.notes?.trim();

  return (
    <div
      className={`bg-white border border-[#e5e7eb] flex flex-col gap-[12px] p-[18px] rounded-[20px] ${
        isExport
          ? "w-[420px] shadow-none"
          : "w-full shadow-[0px_2px_8px_0px_rgba(0,0,0,0.05)]"
      }`}
    >
      {/* Header Struk */}
      <div className="flex items-center justify-between w-full">
        <BrandLogo />
        <div className="flex flex-col items-end gap-[2px] whitespace-nowrap">
          <span className="font-bold text-[12px] leading-[16px] text-[#ec4899]">
            #{order.orderId}
          </span>
          <span className="font-medium text-[11px] leading-[15px] text-[#9ca3af]">
            {formatOrderDate(order.createdAt)}
          </span>
        </div>
      </div>

      {/* Dashed Divider */}
      <div className="w-full border-t border-dashed border-[#e5e7eb]" />

      {/* Info Pembeli */}
      <div className="bg-[#f9fafb] flex flex-col gap-[3px] px-[12px] py-[10px] rounded-[12px] w-full">
        <p className="font-semibold text-[12px] leading-[16px] text-[#1f2937]">
          Pembeli: {order.buyerInfo.name}
        </p>
        <p className="font-medium text-[11px] leading-[15px] text-[#9ca3af]">
          No. WA: {order.buyerInfo.phone}
        </p>
        <p className="font-medium text-[11px] leading-[15px] text-[#9ca3af] break-words">
          Alamat: {addressText || "-"}
        </p>
        <p className="font-medium text-[11px] leading-[15px] text-[#9ca3af] break-words">
          Catatan: {notesText || "-"}
        </p>
      </div>

      {/* Daftar Item */}
      <div className="flex flex-col gap-[12px] w-full">
        {order.items.map((item) => (
          <div
            key={`${item.productId}-${item.sku}`}
            className="flex items-center gap-[10px] w-full"
          >
            <div className="w-[40px] h-[40px] rounded-[12px] overflow-hidden bg-[#f6f6f6] shrink-0">
              <img
                src={item.imageUrl || "/assets/products/kc-001.png"}
                alt={item.name}
                width={40}
                height={40}
                crossOrigin="anonymous"
                className="w-full h-full object-cover block"
              />
            </div>
            <div className="flex flex-col gap-[2px] flex-1 min-w-0">
              <p className="font-semibold text-[12px] leading-[16px] text-[#1f2937] break-words">
                {item.name}
              </p>
              <p className="font-medium text-[11px] leading-[15px] text-[#9ca3af]">
                [{item.sku}] • x{item.qty}
              </p>
            </div>
            <span className="font-bold text-[12px] leading-[16px] text-[#1f2937] whitespace-nowrap shrink-0">
              {formatRupiah(item.price * item.qty)}
            </span>
          </div>
        ))}
      </div>

      {/* Dashed Divider */}
      <div className="w-full border-t border-dashed border-[#e5e7eb]" />

      {/* Total Qty */}
      <div className="flex items-center justify-between w-full text-[11px] leading-[15px]">
        <span className="font-medium text-[#9ca3af]">Total Item</span>
        <span className="font-semibold text-[#1f2937]">
          {order.totalQty} pcs
        </span>
      </div>

      {/* Grand Total */}
      <div className="flex items-center justify-between w-full">
        <span className="font-bold text-[12px] leading-[16px] text-[#1f2937]">
          TOTAL PEMBAYARAN
        </span>
        <span className="font-bold text-[18px] leading-[24px] text-[#ec4899]">
          {formatRupiah(order.totalAmount)}
        </span>
      </div>

      {/* Footer Note */}
      <p className="font-medium text-[11px] leading-[15px] text-[#9ca3af] text-center pt-[2px]">
        Mohon tunggu konfirmasi ketersediaan stok &amp; ongkir dari admin
      </p>
    </div>
  );
}
