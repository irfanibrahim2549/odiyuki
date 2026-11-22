"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/MobileShell";
import { HiddenReceiptTemplate } from "@/components/HiddenReceiptTemplate";
import { ShareFallbackModal } from "@/components/ShareFallbackModal";
import { fetchStoreSettings } from "@/lib/catalog-service";
import { formatRupiah, generateOrderId } from "@/lib/format";
import { shareOrDownloadOrderNote } from "@/lib/receipt-export";
import { DEFAULT_STORE_SETTINGS } from "@/lib/whatsapp";
import { useVisitorStore } from "@/store/useVisitorStore";
import type { OrderNote, StoreSettings } from "@/types";

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useVisitorStore((s) => s.cart);
  const buyerProfile = useVisitorStore((s) => s.buyerProfile);
  const hasHydrated = useVisitorStore((s) => s.hasHydrated);
  const updateQty = useVisitorStore((s) => s.updateQty);
  const removeFromCart = useVisitorStore((s) => s.removeFromCart);
  const clearCart = useVisitorStore((s) => s.clearCart);
  const saveOrderNote = useVisitorStore((s) => s.saveOrderNote);
  const setBuyerProfile = useVisitorStore((s) => s.setBuyerProfile);

  const [draftName, setDraftName] = useState<string | null>(null);
  const [draftPhone, setDraftPhone] = useState<string | null>(null);
  const [draftAddress, setDraftAddress] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState<string | null>(null);

  const name = draftName ?? (hasHydrated ? buyerProfile.name : "");
  const phone = draftPhone ?? (hasHydrated ? buyerProfile.phone : "");
  const address = draftAddress ?? (hasHydrated ? buyerProfile.address || "" : "");
  const notes = draftNotes ?? (hasHydrated ? buyerProfile.notes : "");

  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [copiedOwner, setCopiedOwner] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(
    DEFAULT_STORE_SETTINGS
  );

  useEffect(() => {
    let active = true;
    fetchStoreSettings()
      .then((settings) => {
        if (active) setStoreSettings(settings);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const [pendingOrder, setPendingOrder] = useState<OrderNote | null>(null);
  const [fallbackModalData, setFallbackModalData] = useState<{
    orderId: string;
    summaryText: string;
    copiedImage: boolean;
  } | null>(null);

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const receiptRef = useRef<HTMLDivElement | null>(null);

  const totalQty = useMemo(
    () => cart.reduce((acc, item) => acc + item.qty, 0),
    [cart]
  );

  const totalAmount = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.qty, 0),
    [cart]
  );

  const handleCopyOwnerPhone = async () => {
    const raw = storeSettings.owner_wa_display.replace(/[^0-9]/g, "");
    try {
      await navigator.clipboard.writeText(raw);
      setCopiedOwner(true);
      setTimeout(() => setCopiedOwner(false), 1800);
    } catch {
      // Ignore if clipboard unavailable
    }
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0 || isGenerating) return;

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanAddress = address.trim();
    const cleanNotes = notes.trim();

    const nextErrors: { name?: string; phone?: string } = {};
    if (!cleanName) {
      nextErrors.name = "Nama lengkap wajib diisi";
    }
    if (!cleanPhone) {
      nextErrors.phone = "Nomor WhatsApp wajib diisi";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      if (nextErrors.name) nameInputRef.current?.focus();
      else if (nextErrors.phone) phoneInputRef.current?.focus();
      return;
    }

    setErrors({});
    setSubmitError(null);
    setIsGenerating(true);

    const profile = {
      name: cleanName,
      phone: cleanPhone,
      address: cleanAddress,
      notes: cleanNotes,
    };
    setBuyerProfile(profile);

    const order: OrderNote = {
      orderId: generateOrderId(),
      createdAt: new Date().toISOString(),
      buyerInfo: profile,
      items: [...cart],
      totalAmount,
      totalQty,
    };

    setPendingOrder(order);

    try {
      // Tunggu 1 frame agar HiddenReceiptTemplate selesai ter-render ke DOM
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!receiptRef.current) {
        throw new Error("Template struk belum siap.");
      }

      saveOrderNote(order);
      const result = await shareOrDownloadOrderNote(
        order,
        receiptRef.current,
        storeSettings.owner_wa_phone
      );
      clearCart();

      if (result.mode === "native-share") {
        router.push(`/orders/detail?id=${order.orderId}`);
      } else {
        setFallbackModalData({
          orderId: order.orderId,
          summaryText: result.summaryText,
          copiedImage: result.copiedImage,
        });
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // User menutup share sheet di mobile; pesanan sudah tersimpan di Riwayat
        clearCart();
        router.push(`/orders/detail?id=${order.orderId}`);
        return;
      }
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat membuat struk pesanan."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <MobileShell>
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-white flex items-center gap-[12px] px-[16px] pt-[14px] pb-[12px]">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Kembali"
          className="bg-[#f6f6f6] hover:bg-[#eeeeee] flex items-center justify-center rounded-full w-[38px] h-[38px] cursor-pointer transition-colors shrink-0"
        >
          <img
            src="/assets/icons/back.svg"
            alt="Kembali"
            width={20}
            height={20}
            className="w-[20px] h-[20px]"
          />
        </button>
        <h1 className="font-bold text-[20px] leading-[28px] text-[#1f2937]">
          Checkout
        </h1>
      </header>

      {/* Body */}
      <main className="flex-1 flex flex-col gap-[12px] px-[16px] pt-[4px] pb-[24px]">
        {!hasHydrated ? (
          <div className="flex flex-col gap-[12px] animate-pulse">
            <div className="h-[72px] bg-[#f3f4f6] rounded-[16px]" />
            <div className="h-[72px] bg-[#f3f4f6] rounded-[16px]" />
          </div>
        ) : cart.length === 0 && !fallbackModalData ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-[64px] gap-[10px]">
            <div className="w-[56px] h-[56px] rounded-full bg-[#fce7f3] flex items-center justify-center">
              <img
                src="/assets/icons/receipt.svg"
                alt=""
                width={24}
                height={24}
                className="w-[24px] h-[24px]"
              />
            </div>
            <p className="font-bold text-[16px] text-[#1f2937]">
              Keranjangmu masih kosong
            </p>
            <p className="text-[13px] text-[#9ca3af] max-w-[260px]">
              Yuk pilih aksesoris favoritmu di katalog terlebih dahulu.
            </p>
            <Link
              href="/"
              className="mt-[6px] bg-[#ec4899] hover:bg-[#db2777] text-white font-bold text-[14px] px-[20px] py-[12px] rounded-[16px] transition-colors"
            >
              Jelajahi Katalog
            </Link>
          </div>
        ) : (
          <>
            {/* Ringkasan Item */}
            <p className="font-semibold text-[11px] leading-[15px] text-[#9ca3af] tracking-wide">
              RINGKASAN ITEM ({cart.length} PRODUK)
            </p>

            <div className="flex flex-col gap-[10px]">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="bg-[#f9fafb] flex items-center gap-[10px] px-[10px] py-[8px] rounded-[16px] w-full"
                >
                  <div className="w-[52px] h-[52px] rounded-[12px] overflow-hidden bg-[#f6f6f6] shrink-0">
                    <img
                      src={item.imageUrl || "/assets/products/kc-001.png"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
                    <p className="font-semibold text-[13px] leading-[18px] text-[#1f2937] line-clamp-2">
                      {item.name}
                    </p>
                    <p className="font-medium text-[11px] leading-[15px] text-[#9ca3af]">
                      {item.sku} • {formatRupiah(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-[6px] shrink-0">
                    <div className="bg-[#f6f6f6] flex items-center gap-[10px] px-[10px] py-[8px] rounded-[12px]">
                      <button
                        type="button"
                        onClick={() => updateQty(item.productId, -1)}
                        aria-label={`Kurangi jumlah ${item.name}`}
                        className="cursor-pointer flex items-center justify-center w-[16px] h-[16px]"
                      >
                        <img
                          src="/assets/icons/minus.svg"
                          alt="-"
                          width={14}
                          height={14}
                          className="w-[14px] h-[14px]"
                        />
                      </button>
                      <span className="font-bold text-[14px] leading-[20px] text-[#1f2937] min-w-[14px] text-center">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.productId, 1)}
                        aria-label={`Tambah jumlah ${item.name}`}
                        className="cursor-pointer flex items-center justify-center w-[16px] h-[16px]"
                      >
                        <img
                          src="/assets/icons/plus.svg"
                          alt="+"
                          width={14}
                          height={14}
                          className="w-[14px] h-[14px]"
                        />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                      aria-label={`Hapus ${item.name} dari keranjang`}
                      title="Hapus item"
                      className="w-[34px] h-[34px] rounded-[12px] bg-[#f6f6f6] hover:bg-[#fef2f2] flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <img
                        src="/assets/icons/trash.svg"
                        alt="Hapus"
                        width={16}
                        height={16}
                        className="w-[16px] h-[16px]"
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Form Info Pembeli */}
            <p className="font-semibold text-[11px] leading-[15px] text-[#9ca3af] tracking-wide pt-[4px]">
              INFORMASI PEMBELI
            </p>

            <div className="flex flex-col gap-[12px]">
              <div className="flex flex-col gap-[6px]">
                <label
                  htmlFor="buyer-name"
                  className="font-semibold text-[12px] leading-[16px] text-[#1f2937]"
                >
                  Nama Lengkap *
                </label>
                <input
                  ref={nameInputRef}
                  id="buyer-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setDraftName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Contoh: Budi Santoso"
                  className={`bg-[#f9fafb] border ${
                    errors.name ? "border-[#ef4444]" : "border-[#e5e7eb]"
                  } focus:border-[#ec4899] focus:outline-none px-[14px] py-[12px] rounded-[16px] text-[14px] leading-[20px] text-[#1f2937] placeholder:text-[#9ca3af] w-full transition-colors`}
                />
                {errors.name && (
                  <p className="text-[11px] font-medium text-[#ef4444]">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-[6px]">
                <label
                  htmlFor="buyer-phone"
                  className="font-semibold text-[12px] leading-[16px] text-[#1f2937]"
                >
                  Nomor WhatsApp *
                </label>
                <input
                  ref={phoneInputRef}
                  id="buyer-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setDraftPhone(e.target.value);
                    if (errors.phone)
                      setErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  placeholder="Contoh: 08123456789"
                  className={`bg-[#f9fafb] border ${
                    errors.phone ? "border-[#ef4444]" : "border-[#e5e7eb]"
                  } focus:border-[#ec4899] focus:outline-none px-[14px] py-[12px] rounded-[16px] text-[14px] leading-[20px] text-[#1f2937] placeholder:text-[#9ca3af] w-full transition-colors`}
                />
                {errors.phone && (
                  <p className="text-[11px] font-medium text-[#ef4444]">
                    {errors.phone}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-[6px]">
                <label
                  htmlFor="buyer-address"
                  className="font-semibold text-[12px] leading-[16px] text-[#1f2937]"
                >
                  Alamat Pengiriman (Opsional)
                </label>
                <textarea
                  id="buyer-address"
                  rows={3}
                  value={address}
                  onChange={(e) => setDraftAddress(e.target.value)}
                  placeholder="Contoh: Jl. Melati No. 12, Kec. Coblong, Bandung 40132"
                  className="bg-[#f9fafb] border border-[#e5e7eb] focus:border-[#ec4899] focus:outline-none px-[14px] py-[12px] rounded-[16px] text-[14px] leading-[20px] text-[#1f2937] placeholder:text-[#9ca3af] w-full resize-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-[6px]">
                <label
                  htmlFor="buyer-notes"
                  className="font-semibold text-[12px] leading-[16px] text-[#1f2937]"
                >
                  Catatan (Opsional)
                </label>
                <input
                  id="buyer-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder="Contoh: Packing bubble wrap ya kak"
                  className="bg-[#f9fafb] border border-[#e5e7eb] focus:border-[#ec4899] focus:outline-none px-[14px] py-[12px] rounded-[16px] text-[14px] leading-[20px] text-[#1f2937] placeholder:text-[#9ca3af] w-full transition-colors"
                />
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-[#f9fafb] border border-[#e5e7eb] flex flex-col gap-[4px] px-[12px] py-[10px] rounded-[16px] w-full">
              <div className="flex items-center justify-between text-[12px] leading-[16px]">
                <span className="font-medium text-[#9ca3af]">Total Item</span>
                <span className="font-semibold text-[#1f2937]">
                  {totalQty} pcs
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[14px] leading-[19px] text-[#1f2937]">
                  Total Pembayaran
                </span>
                <span className="font-bold text-[18px] leading-[24px] text-[#ec4899]">
                  {formatRupiah(totalAmount)}
                </span>
              </div>
            </div>

            {/* Owner WA Banner */}
            <div className="bg-[#fce7f3] flex items-center justify-between px-[12px] py-[10px] rounded-[16px] w-full">
              <div className="flex flex-col gap-[2px]">
                <span className="font-semibold text-[11px] leading-[15px] text-[#ec4899]">
                  WhatsApp Owner
                </span>
                <span className="font-bold text-[13px] leading-[18px] text-[#1f2937]">
                  {storeSettings.owner_wa_display}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyOwnerPhone}
                className="bg-white hover:bg-[#fdf2f8] flex items-center gap-[5px] px-[10px] py-[6px] rounded-full cursor-pointer transition-colors"
              >
                <img
                  src="/assets/icons/copy.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="w-[16px] h-[16px]"
                />
                <span className="font-bold text-[11px] leading-[15px] text-[#ec4899]">
                  {copiedOwner ? "Tersalin!" : "Salin Nomor"}
                </span>
              </button>
            </div>

            {submitError && (
              <div className="bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] rounded-[14px] px-[12px] py-[10px] text-[12px] font-medium">
                {submitError}
              </div>
            )}
          </>
        )}
      </main>

      {/* Sticky Bottom CTA */}
      {hasHydrated && cart.length > 0 && (
        <footer className="sticky bottom-0 z-20 bg-white px-[16px] pt-[12px] pb-[14px] shadow-[0px_-4px_16px_0px_rgba(0,0,0,0.08)]">
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleSubmitOrder}
            className="w-full h-[48px] bg-[#ec4899] hover:bg-[#db2777] disabled:opacity-70 text-white font-bold text-[14px] leading-[20px] rounded-[16px] flex items-center justify-center gap-[8px] cursor-pointer transition-colors"
          >
            {isGenerating ? (
              <>
                <span className="w-[16px] h-[16px] border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Membuat Order Notes...</span>
              </>
            ) : (
              "Buat Pesanan"
            )}
          </button>
        </footer>
      )}

      {/* Off-screen Receipt Template untuk html-to-image */}
      <HiddenReceiptTemplate order={pendingOrder} receiptRef={receiptRef} />

      {/* Fallback Modal Desktop */}
      <ShareFallbackModal
        isOpen={Boolean(fallbackModalData)}
        orderId={fallbackModalData?.orderId || ""}
        summaryText={fallbackModalData?.summaryText || ""}
        ownerPhone={storeSettings.owner_wa_phone}
        copiedImage={fallbackModalData?.copiedImage}
        onClose={() => {
          const id = fallbackModalData?.orderId;
          setFallbackModalData(null);
          if (id) router.push(`/orders/detail?id=${id}`);
          else router.push("/orders");
        }}
        onGoToOrders={() => {
          setFallbackModalData(null);
        }}
      />
    </MobileShell>
  );
}
