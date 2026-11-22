import type { OrderNote, StoreSettings } from "@/types";
import { formatRupiah } from "./format";

export const OWNER_WA_PHONE =
  process.env.NEXT_PUBLIC_OWNER_WA_PHONE?.trim() || "6281298765432";

export const OWNER_WA_DISPLAY =
  process.env.NEXT_PUBLIC_OWNER_WA_DISPLAY?.trim() || "0812-9876-5432";

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  owner_wa_phone: OWNER_WA_PHONE,
  owner_wa_display: OWNER_WA_DISPLAY,
};

export function normalizeWhatsAppInput(rawInput: string): StoreSettings {
  const digitsOnly = rawInput.replace(/[^0-9]/g, "");
  if (digitsOnly.length < 9 || digitsOnly.length > 15) {
    throw new Error("Nomor WhatsApp harus terdiri dari 9–15 digit angka.");
  }

  let waPhone = digitsOnly;
  if (waPhone.startsWith("0")) {
    waPhone = `62${waPhone.slice(1)}`;
  } else if (!waPhone.startsWith("62") && waPhone.startsWith("8")) {
    waPhone = `62${waPhone}`;
  }

  // Format display lokal agar mudah dibaca (contoh: 0812-9876-5432)
  const localDigits = waPhone.startsWith("62")
    ? `0${waPhone.slice(2)}`
    : waPhone;
  const formattedLocal = localDigits.replace(
    /^(\d{4})(\d{4})(\d+)$/,
    "$1-$2-$3"
  );

  return {
    owner_wa_phone: waPhone,
    owner_wa_display: formattedLocal,
  };
}

export function buildOrderSummaryText(order: OrderNote): string {
  const addressText = order.buyerInfo.address?.trim() || "-";
  const notesText = order.buyerInfo.notes?.trim() || "-";

  return [
    "Halo Kak, saya mau order aksesoris berikut (detail item ada di gambar Order Notes):",
    `No. Order: #${order.orderId}`,
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

export function buildWhatsAppUrl(
  summaryText: string,
  ownerPhone?: string
): string {
  const target = (ownerPhone || OWNER_WA_PHONE).replace(/[^0-9]/g, "");
  return `https://wa.me/${target}?text=${encodeURIComponent(summaryText)}`;
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
