"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/MobileShell";
import { formatOrderDate, formatRupiah } from "@/lib/format";
import { useVisitorStore } from "@/store/useVisitorStore";

export default function OrdersHistoryPage() {
  const router = useRouter();
  const savedOrders = useVisitorStore((s) => s.savedOrders);
  const hasHydrated = useVisitorStore((s) => s.hasHydrated);
  const removeOrderNote = useVisitorStore((s) => s.removeOrderNote);
  const clearOrders = useVisitorStore((s) => s.clearOrders);

  const [deleteTarget, setDeleteTarget] = useState<
    { type: "single"; orderId: string } | { type: "all" } | null
  >(null);

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "single") {
      removeOrderNote(deleteTarget.orderId);
    } else {
      clearOrders();
    }
    setDeleteTarget(null);
  };

  return (
    <MobileShell>
      {/* TopHeader */}
      <header className="sticky top-0 z-20 bg-white flex items-center justify-between gap-[12px] px-[16px] pt-[14px] pb-[12px]">
        <div className="flex items-center gap-[12px]">
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="Kembali ke katalog"
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
            Riwayat Pesanan
          </h1>
        </div>

        {hasHydrated && savedOrders.length > 0 && (
          <button
            type="button"
            onClick={() => setDeleteTarget({ type: "all" })}
            className="text-[12px] font-semibold text-[#ef4444] hover:text-[#dc2626] bg-[#fef2f2] hover:bg-[#fee2e2] px-[12px] py-[6px] rounded-full cursor-pointer transition-colors"
          >
            Hapus Semua
          </button>
        )}
      </header>

      <main className="flex-1 flex flex-col gap-[12px] px-[16px] pt-[4px] pb-[24px]">
        {!hasHydrated ? (
          <div className="flex flex-col gap-[12px] animate-pulse">
            <div className="h-[136px] bg-[#f3f4f6] rounded-[20px]" />
            <div className="h-[136px] bg-[#f3f4f6] rounded-[20px]" />
          </div>
        ) : savedOrders.length === 0 ? (
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
              Belum ada riwayat pesanan
            </p>
            <p className="text-[13px] text-[#9ca3af] max-w-[260px]">
              Pesanan yang sudah kamu buat akan tersimpan otomatis di perangkat
              ini.
            </p>
            <Link
              href="/"
              className="mt-[6px] bg-[#ec4899] hover:bg-[#db2777] text-white font-bold text-[14px] px-[20px] py-[12px] rounded-[16px] transition-colors"
            >
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <>
            <p className="font-medium text-[12px] leading-[16px] text-[#9ca3af]">
              Tersimpan otomatis di perangkat ini ({savedOrders.length} pesanan)
            </p>

            <div className="flex flex-col gap-[12px]">
              {savedOrders.map((order, idx) => {
                const isLatest = idx === 0;
                const previewThumbs = order.items.slice(0, 3);
                return (
                  <div
                    key={order.orderId}
                    className={`bg-white flex flex-col gap-[10px] p-[14px] rounded-[20px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.05)] transition-colors ${
                      isLatest
                        ? "border-[1.5px] border-[#ec4899]"
                        : "border border-[#e5e7eb] hover:border-[#ec4899]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-[8px] w-full">
                      <Link
                        href={`/orders/detail?id=${order.orderId}`}
                        prefetch={false}
                        className="font-bold text-[12px] leading-[16px] text-[#ec4899] hover:underline"
                      >
                        #{order.orderId}
                      </Link>
                      <div className="flex items-center gap-[8px]">
                        <span className="font-medium text-[11px] leading-[15px] text-[#9ca3af]">
                          {formatOrderDate(order.createdAt)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({
                              type: "single",
                              orderId: order.orderId,
                            })
                          }
                          aria-label={`Hapus pesanan ${order.orderId}`}
                          title="Hapus pesanan"
                          className="w-[28px] h-[28px] rounded-[8px] bg-[#f6f6f6] hover:bg-[#fef2f2] flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <img
                            src="/assets/icons/trash.svg"
                            alt="Hapus"
                            width={15}
                            height={15}
                            className="w-[15px] h-[15px]"
                          />
                        </button>
                      </div>
                    </div>

                    <Link
                      href={`/orders/detail?id=${order.orderId}`}
                      prefetch={false}
                      className="flex flex-col gap-[10px] w-full"
                    >
                      <div className="flex items-center gap-[8px] w-full">
                        {previewThumbs.map((item) => (
                          <div
                            key={`${order.orderId}-${item.productId}`}
                            className="w-[40px] h-[40px] rounded-[12px] overflow-hidden bg-[#f6f6f6] shrink-0"
                          >
                            <img
                              src={
                                item.imageUrl || "/assets/products/kc-001.png"
                              }
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        <p className="font-semibold text-[13px] leading-[18px] text-[#1f2937] truncate">
                          {order.buyerInfo.name} • {order.totalQty} pcs
                        </p>
                      </div>

                      <div className="w-full border-t border-dashed border-[#e5e7eb]" />

                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-[14px] leading-[20px] text-[#1f2937]">
                          Total: {formatRupiah(order.totalAmount)}
                        </span>
                        <div className="flex items-center gap-[4px]">
                          <span className="font-semibold text-[12px] leading-[16px] text-[#ec4899]">
                            Lihat Struk
                          </span>
                          <img
                            src="/assets/icons/chevron-right.svg"
                            alt=""
                            width={18}
                            height={18}
                            className="w-[18px] h-[18px]"
                          />
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Bottom Sheet Konfirmasi Hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#121726]/55">
          <div className="w-full max-w-[480px] bg-white rounded-t-[24px] px-[18px] pt-[12px] pb-[24px] flex flex-col gap-[14px]">
            <div className="w-[40px] h-[4px] bg-[#e5e7eb] rounded-full mx-auto" />
            <div>
              <h2 className="font-bold text-[17px] text-[#1f2937]">
                {deleteTarget.type === "all"
                  ? "Hapus Semua Riwayat Pesanan?"
                  : "Hapus Riwayat Pesanan Ini?"}
              </h2>
              <p className="text-[13px] text-[#9ca3af] mt-[4px]">
                {deleteTarget.type === "all"
                  ? `Seluruh ${savedOrders.length} pesanan yang tersimpan di perangkat ini akan dihapus.`
                  : `Pesanan #${deleteTarget.orderId} akan dihapus dari riwayat perangkat ini.`}
              </p>
            </div>
            <div className="flex gap-[10px]">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-[44px] bg-[#f6f6f6] text-[#1f2937] font-bold text-[13px] rounded-[14px] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 h-[44px] bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold text-[13px] rounded-[14px] cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
