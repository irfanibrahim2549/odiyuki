"use client";

import React, { useMemo, useState } from "react";
import { Check, MessageCircle, X } from "lucide-react";
import { updateStoreSettings } from "@/lib/catalog-service";
import { normalizeWhatsAppInput } from "@/lib/whatsapp";
import type { StoreSettings } from "@/types";

interface WhatsAppSettingsSheetProps {
  isOpen: boolean;
  currentSettings: StoreSettings;
  onClose: () => void;
  onSaved: (nextSettings: StoreSettings) => void;
}

export function WhatsAppSettingsSheet({
  isOpen,
  currentSettings,
  onClose,
  onSaved,
}: WhatsAppSettingsSheetProps) {
  const [draftPhone, setDraftPhone] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const phoneInput = draftPhone ?? currentSettings.owner_wa_display;

  const preview = useMemo(() => {
    try {
      return normalizeWhatsAppInput(phoneInput);
    } catch {
      return null;
    }
  }, [phoneInput]);

  if (!isOpen) return null;

  const handleClose = () => {
    setDraftPhone(null);
    setErrorMsg(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSaving(true);
    try {
      const updated = await updateStoreSettings(phoneInput);
      onSaved(updated);
      setDraftPhone(null);
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan nomor WhatsApp owner."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#121726]/55">
      <div className="w-full max-w-[480px] bg-white rounded-t-[24px] px-[16px] pt-[12px] pb-[24px] shadow-[0px_-8px_32px_rgba(0,0,0,0.16)] flex flex-col gap-[14px]">
        {/* Drag handle */}
        <div className="w-[40px] h-[4px] bg-[#e5e7eb] rounded-full mx-auto" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[10px]">
            <div className="w-[36px] h-[36px] rounded-full bg-[#edfcf5] text-[#059669] flex items-center justify-center shrink-0">
              <MessageCircle className="w-[18px] h-[18px]" />
            </div>
            <div>
              <h2 className="font-bold text-[18px] leading-[24px] text-[#1f2937]">
                Nomor WhatsApp Owner
              </h2>
              <p className="text-[12px] text-[#9ca3af]">
                Tujuan pesanan pembeli saat checkout
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup"
            className="w-[34px] h-[34px] rounded-full bg-[#f6f6f6] hover:bg-[#eeeeee] flex items-center justify-center cursor-pointer"
          >
            <X className="w-[18px] h-[18px] text-[#1f2937]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-[12px]">
          <div className="flex flex-col gap-[6px]">
            <label
              htmlFor="owner-wa-input"
              className="font-semibold text-[12px] text-[#1f2937]"
            >
              Nomor WhatsApp Aktif *
            </label>
            <input
              id="owner-wa-input"
              type="tel"
              value={phoneInput}
              onChange={(e) => {
                setDraftPhone(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="Contoh: 081234567890 atau 6281234567890"
              className="bg-[#f9fafb] border border-[#e5e7eb] focus:border-[#ec4899] focus:outline-none px-[14px] py-[12px] rounded-[16px] text-[14px] font-semibold text-[#1f2937] placeholder:text-[#9ca3af]"
            />
            <p className="text-[11px] text-[#9ca3af]">
              Boleh diawali <code className="font-semibold">08...</code> atau{" "}
              <code className="font-semibold">628...</code> — otomatis
              diformat untuk tautan WhatsApp.
            </p>
          </div>

          {/* Live Preview */}
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[14px] px-[12px] py-[10px] flex flex-col gap-[4px]">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#9ca3af]">Tampilan di Checkout</span>
              <span className="font-bold text-[#1f2937]">
                {preview ? preview.owner_wa_display : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#9ca3af]">Link Tujuan WA</span>
              <span className="font-semibold text-[#059669]">
                {preview ? `wa.me/${preview.owner_wa_phone}` : "Format belum valid"}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] rounded-[12px] px-[12px] py-[8px] text-[12px] font-medium">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full h-[46px] bg-[#ec4899] hover:bg-[#db2777] disabled:opacity-70 text-white font-bold text-[14px] rounded-[16px] flex items-center justify-center gap-[6px] cursor-pointer transition-colors"
          >
            <Check className="w-[17px] h-[17px]" />
            <span>
              {isSaving ? "Menyimpan..." : "Simpan Nomor WhatsApp"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
