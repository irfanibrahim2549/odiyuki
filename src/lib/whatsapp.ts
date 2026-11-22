import type { OrderNote } from "@/types";
import { formatRupiah } from "./format";

export const OWNER_WA_PHONE =
  process.env.NEXT_PUBLIC_OWNER_WA_PHONE?.trim() || "6281298765432";

export const OWNER_WA_DISPLAY =
  process.env.NEXT_PUBLIC_OWNER_WA_DISPLAY?.trim() || "0812-9876-5432";

export function buildOrderSummaryText(order: OrderNote): string {
  const itemLines = order.items
    .map(
      (item, idx) =>
        `${idx + 1}. [${item.sku}] ${item.name} (x${item.qty}) - ${formatRupiah(
          item.price * item.qty
        )}`
    )
    .join("\n");

  const addressText = order.buyerInfo.address?.trim() || "-";
  const notesText = order.buyerInfo.notes?.trim() || "-";

  return [
    "Halo Kak, saya mau order aksesoris berikut:",
    `No. Order: #${order.orderId}`,
    "",
    itemLines,
    "",
    `Total Item: ${order.totalQty} pcs`,
    `Total Pembayaran: ${formatRupiah(order.totalAmount)}`,
    "",
    "Data Pembeli:",
    `Nama: ${order.buyerInfo.name}`,
    `No. WA: ${order.buyerInfo.phone}`,
    `Alamat: ${addressText}`,
    `Catatan: ${notesText}`,
  ].join("\n");
}

export function buildWhatsAppUrl(summaryText: string): string {
  const cleanPhone = OWNER_WA_PHONE.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(summaryText)}`;
}

export function triggerDownloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
