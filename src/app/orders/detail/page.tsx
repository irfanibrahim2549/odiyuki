"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MobileShell } from "@/components/MobileShell";
import { ReceiptCard } from "@/components/ReceiptCard";
import { HiddenReceiptTemplate } from "@/components/HiddenReceiptTemplate";
import { ShareFallbackModal } from "@/components/ShareFallbackModal";
import { fetchStoreSettings } from "@/lib/catalog-service";
import {
  generateReceiptPngBlob,
  shareOrDownloadOrderNote,
} from "@/lib/receipt-export";
import { DEFAULT_STORE_SETTINGS, triggerDownloadBlob } from "@/lib/whatsapp";
import { useVisitorStore } from "@/store/useVisitorStore";
import type { StoreSettings } from "@/types";

function OrderReceiptSkeleton() {
  return (
    <MobileShell className="bg-[#f6f6f6]">
      <div className="bg-white px-[16px] pt-[14px] pb-[12px] flex items-center gap-[12px]">
        <div className="w-[38px] h-[38px] rounded-full bg-[#f3f4f6] animate-pulse" />
        <div className="h-[24px] w-[180px] bg-[#f3f4f6] rounded animate-pulse" />
      </div>
      <div className="p-[16px]">
        <div className="h-[380px] bg-white rounded-[20px] animate-pulse" />
      </div>
    </MobileShell>
  );
}

function OrderReceiptPreviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("id");

  const savedOrders = useVisitorStore((s) => s.savedOrders);
  const hasHydrated = useVisitorStore((s) => s.hasHydrated);

  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [isProcessing, setIsProcessing] = useState<"share" | "download" | null>(
    null
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [fallbackData, setFallbackData] = useState<{
    summaryText: string;
    copiedImage: boolean;
  } | null>(null);
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

  const order = useMemo(
    () => (orderId ? savedOrders.find((o) => o.orderId === orderId) || null : null),
    [savedOrders, orderId]
  );

  const handleReshare = async () => {
    if (!order || !receiptRef.current || isProcessing) return;
    setIsProcessing("share");
    setStatusMessage(null);
    try {
      const result = await shareOrDownloadOrderNote(
        order,
        receiptRef.current,
        storeSettings.owner_wa_phone
      );
      if (result.mode === "fallback") {
        setFallbackData({
          summaryText: result.summaryText,
          copiedImage: result.copiedImage,
        });
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === "AbortError")) {
        setStatusMessage("Gagal membagikan struk. Coba download gambar.");
      }
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDownload = async () => {
    if (!order || !receiptRef.current || isProcessing) return;
    setIsProcessing("download");
    setStatusMessage(null);
    try {
      const blob = await generateReceiptPngBlob(receiptRef.current);
      triggerDownloadBlob(blob, `Order-Notes-${order.orderId}.png`);
      setStatusMessage("Gambar struk berhasil diunduh.");
      setTimeout(() => setStatusMessage(null), 2500);
    } catch {
      setStatusMessage("Gagal mengunduh gambar struk.");
    } finally {
      setIsProcessing(null);
    }
  };

  if (!hasHydrated) {
    return <OrderReceiptSkeleton />;
  }

  if (!order) {
    return (
      <MobileShell>
        <header className="flex items-center gap-[12px] px-[16px] pt-[14px] pb-[12px]">
          <button
            type="button"
            onClick={() => router.push("/orders")}
            className="bg-[#f6f6f6] flex items-center justify-center rounded-full w-[38px] h-[38px] cursor-pointer"
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
            Preview Order Notes
          </h1>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center text-center px-[24px] gap-[12px]">
          <p className="font-bold text-[16px] text-[#1f2937]">
            Struk pesanan tidak ditemukan
          </p>
          <Link
            href="/orders"
            className="bg-[#ec4899] text-white font-bold text-[14px] px-[20px] py-[12px] rounded-[16px]"
          >
            Kembali ke Riwayat
          </Link>
        </main>
      </MobileShell>
    );
  }

  return (
    <MobileShell className="bg-[#f6f6f6]">
      <header className="sticky top-0 z-20 bg-white flex items-center gap-[12px] px-[16px] pt-[14px] pb-[12px]">
        <button
          type="button"
          onClick={() => router.push("/orders")}
          aria-label="Kembali ke riwayat"
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
          Preview Order Notes
        </h1>
      </header>

      <main className="flex-1 px-[16px] py-[14px] flex flex-col gap-[12px]">
        <ReceiptCard order={order} />

        {statusMessage && (
          <div className="bg-[#edfcf5] text-[#059669] text-[12px] font-semibold text-center px-[12px] py-[8px] rounded-[12px]">
            {statusMessage}
          </div>
        )}
      </main>

      <footer className="sticky bottom-0 z-20 bg-white px-[16px] pt-[12px] pb-[14px] shadow-[0px_-4px_16px_0px_rgba(0,0,0,0.08)] flex flex-col gap-[8px]">
        <button
          type="button"
          disabled={Boolean(isProcessing)}
          onClick={handleReshare}
          className="w-full h-[48px] bg-[#ec4899] hover:bg-[#db2777] disabled:opacity-70 text-white font-bold text-[14px] leading-[20px] rounded-[16px] flex items-center justify-center gap-[8px] cursor-pointer transition-colors"
        >
          {isProcessing === "share"
            ? "Memproses Struk..."
            : "Kirim Ulang ke WhatsApp"}
        </button>
        <button
          type="button"
          disabled={Boolean(isProcessing)}
          onClick={handleDownload}
          className="w-full h-[44px] bg-[#fce7f3] hover:bg-[#fbcfe8] disabled:opacity-70 text-[#ec4899] font-bold text-[14px] leading-[20px] rounded-[16px] flex items-center justify-center gap-[8px] cursor-pointer transition-colors"
        >
          {isProcessing === "download"
            ? "Mengunduh PNG..."
            : "Download Gambar Struk"}
        </button>
      </footer>

      <HiddenReceiptTemplate order={order} receiptRef={receiptRef} />

      <ShareFallbackModal
        isOpen={Boolean(fallbackData)}
        orderId={order.orderId}
        summaryText={fallbackData?.summaryText || ""}
        ownerPhone={storeSettings.owner_wa_phone}
        copiedImage={fallbackData?.copiedImage}
        onClose={() => setFallbackData(null)}
        onGoToOrders={() => {
          setFallbackData(null);
          router.push("/orders");
        }}
      />
    </MobileShell>
  );
}

export default function OrderReceiptPreviewPage() {
  return (
    <Suspense fallback={<OrderReceiptSkeleton />}>
      <OrderReceiptPreviewContent />
    </Suspense>
  );
}
