"use client";

import React from "react";
import Link from "next/link";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

interface ShareFallbackModalProps {
  isOpen: boolean;
  orderId: string;
  summaryText: string;
  ownerPhone?: string;
  copiedImage?: boolean;
  onClose: () => void;
  onGoToOrders: () => void;
}

export function ShareFallbackModal({
  isOpen,
  orderId,
  summaryText,
  ownerPhone,
  copiedImage = false,
  onClose,
  onGoToOrders,
}: ShareFallbackModalProps) {
  if (!isOpen) return null;

  const waUrl = buildWhatsAppUrl(summaryText, ownerPhone);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121726]/55 px-[16px]">
      <div className="bg-white w-full max-w-[344px] rounded-[24px] px-[18px] py-[20px] shadow-[0px_12px_32px_0px_rgba(0,0,0,0.16)] flex flex-col gap-[14px]">
        {/* Top Row: Status Pill & Close */}
        <div className="flex items-center justify-between w-full">
          <div className="bg-[#fce7f3] flex items-center gap-[6px] px-[10px] py-[6px] rounded-full">
            <span className="bg-[#ec4899] flex items-center justify-center rounded-full w-[18px] h-[18px] shrink-0">
              <img
                src="/assets/icons/check.svg"
                alt=""
                width={11}
                height={11}
                className="w-[11px] h-[11px]"
              />
            </span>
            <span className="font-bold text-[11px] leading-[15px] text-[#ec4899]">
              Order Notes Tersimpan
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="bg-[#f6f6f6] hover:bg-[#eeeeee] flex items-center justify-center rounded-full w-[32px] h-[32px] cursor-pointer transition-colors"
          >
            <img
              src="/assets/icons/close.svg"
              alt="Tutup"
              width={18}
              height={18}
              className="w-[18px] h-[18px]"
            />
          </button>
        </div>

        {/* Title */}
        <h2 className="font-bold text-[20px] leading-[28px] text-[#1f2937]">
          Kirim Struk ke WhatsApp
        </h2>

        {/* Downloaded File Preview */}
        <div className="bg-[#f9fafb] border border-[#e5e7eb] flex items-center gap-[10px] px-[12px] py-[10px] rounded-[16px] w-full">
          <img
            src="/assets/icons/receipt.svg"
            alt=""
            width={20}
            height={20}
            className="w-[20px] h-[20px] shrink-0"
          />
          <div className="flex flex-col gap-[2px] min-w-0">
            <p className="font-semibold text-[12px] leading-[16px] text-[#1f2937] truncate">
              Order-Notes-{orderId}.png
            </p>
            <p className="font-medium text-[11px] leading-[15px] text-[#059669]">
              {copiedImage
                ? "Gambar disalin ke clipboard & terunduh otomatis"
                : "Terunduh otomatis ke perangkat"}
            </p>
          </div>
        </div>

        {/* Instruction */}
        <p className="font-medium text-[13px] leading-[18px] text-[#9ca3af]">
          {copiedImage
            ? "Di WhatsApp Desktop/Web, langsung tekan Ctrl+V (Tempel) di kolom chat untuk melampirkan gambar Order Notes bersama teks pesanan."
            : "Gambar Order Notes telah terunduh otomatis. Silakan lampirkan gambar tersebut di chat WhatsApp yang terbuka."}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-[10px] w-full">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#ec4899] hover:bg-[#db2777] text-white font-bold text-[14px] leading-[20px] h-[48px] rounded-[16px] flex items-center justify-center w-full transition-colors"
          >
            Buka WhatsApp Sekarang
          </a>
          <Link
            href="/orders"
            onClick={onGoToOrders}
            className="bg-[#fce7f3] hover:bg-[#fbcfe8] text-[#ec4899] font-bold text-[14px] leading-[20px] h-[44px] rounded-[16px] flex items-center justify-center w-full transition-colors"
          >
            Lihat Riwayat Pesanan
          </Link>
        </div>
      </div>
    </div>
  );
}
