"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MobileShell } from "@/components/MobileShell";
import { fetchProductById } from "@/lib/catalog-service";
import { formatRupiah } from "@/lib/format";
import { useVisitorStore } from "@/store/useVisitorStore";
import type { Product } from "@/types";

function ProductDetailSkeleton() {
  return (
    <MobileShell>
      <div className="px-[16px] pt-[14px] pb-[12px] flex items-center justify-between">
        <div className="w-[40px] h-[40px] rounded-full bg-[#f3f4f6] animate-pulse" />
        <div className="w-[72px] h-[26px] rounded-full bg-[#f3f4f6] animate-pulse" />
      </div>
      <div className="px-[16px] flex flex-col gap-[16px] animate-pulse">
        <div className="aspect-square w-full rounded-[24px] bg-[#f3f4f6]" />
        <div className="flex gap-[10px]">
          <div className="w-[48px] h-[48px] rounded-[12px] bg-[#f3f4f6]" />
          <div className="w-[48px] h-[48px] rounded-[12px] bg-[#f3f4f6]" />
        </div>
        <div className="h-[16px] w-[80px] rounded bg-[#f3f4f6]" />
        <div className="h-[28px] w-4/5 rounded bg-[#f3f4f6]" />
        <div className="h-[28px] w-2/5 rounded bg-[#f3f4f6]" />
      </div>
    </MobileShell>
  );
}

function ProductDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("id");

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(productId));
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [justAdded, setJustAdded] = useState<boolean>(false);

  const touchStartX = useRef<number | null>(null);

  const addToCart = useVisitorStore((s) => s.addToCart);
  const cart = useVisitorStore((s) => s.cart);
  const hasHydrated = useVisitorStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!productId) return;
    let active = true;
    async function load(id: string) {
      try {
        const found = await fetchProductById(id);
        if (!active) return;
        setProduct(found);
        setActiveIndex(0);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load(productId);
    return () => {
      active = false;
    };
  }, [productId]);

  const images = useMemo(() => {
    if (!product || !product.images || product.images.length === 0) {
      return ["/assets/products/kc-001.png"];
    }
    return product.images;
  }, [product]);

  const qtyInCart = useMemo(() => {
    if (!hasHydrated || !product) return 0;
    return cart.find((i) => i.productId === product.id)?.qty || 0;
  }, [cart, hasHydrated, product]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || images.length <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const diff = touchStartX.current - endX;
    if (Math.abs(diff) > 36) {
      if (diff > 0) {
        setActiveIndex((prev) => (prev + 1) % images.length);
      } else {
        setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    }
    touchStartX.current = null;
  };

  const handleAddToCart = () => {
    if (!product || !product.is_available) return;
    addToCart(product);
    setJustAdded(true);
    router.push("/");
  };

  if (productId && isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <MobileShell>
        <header className="px-[16px] pt-[14px] pb-[12px] flex items-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="bg-[#f6f6f6] flex items-center justify-center rounded-full w-[40px] h-[40px] cursor-pointer"
          >
            <img
              src="/assets/icons/back.svg"
              alt="Kembali"
              width={20}
              height={20}
              className="w-[20px] h-[20px]"
            />
          </button>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-[24px] text-center gap-[12px]">
          <p className="font-bold text-[18px] text-[#1f2937]">
            Produk tidak ditemukan
          </p>
          <p className="text-[13px] text-[#9ca3af]">
            Produk mungkin sudah dihapus atau tautan tidak valid.
          </p>
          <Link
            href="/"
            className="mt-[6px] bg-[#ec4899] text-white font-bold text-[14px] px-[20px] py-[12px] rounded-[16px]"
          >
            Kembali ke Katalog
          </Link>
        </main>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      {/* TopNavBar */}
      <header className="flex items-center justify-between px-[16px] pt-[14px] pb-[12px] shrink-0">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Kembali"
          className="bg-[#f6f6f6] hover:bg-[#eeeeee] flex items-center justify-center rounded-full w-[40px] h-[40px] cursor-pointer transition-colors"
        >
          <img
            src="/assets/icons/back.svg"
            alt="Kembali"
            width={20}
            height={20}
            className="w-[20px] h-[20px]"
          />
        </button>

        <div className="bg-[#fce7f3] px-[12px] py-[5px] rounded-full">
          <span className="font-bold text-[12px] leading-[16px] text-[#ec4899]">
            {product.sku}
          </span>
        </div>
      </header>

      {/* DetailContent */}
      <main className="flex-1 flex flex-col gap-[16px] px-[16px] pt-[4px] pb-[24px]">
        {/* Main Image Carousel */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative aspect-square w-full bg-[#f6f6f6] rounded-[24px] overflow-hidden select-none"
        >
          <img
            src={images[activeIndex]}
            alt={`${product.name} - Foto ${activeIndex + 1}`}
            className="w-full h-full object-cover"
          />

          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Foto sebelumnya"
                onClick={() =>
                  setActiveIndex(
                    (prev) => (prev - 1 + images.length) % images.length
                  )
                }
                className="absolute inset-y-0 left-0 w-1/4 cursor-pointer opacity-0"
              />
              <button
                type="button"
                aria-label="Foto berikutnya"
                onClick={() =>
                  setActiveIndex((prev) => (prev + 1) % images.length)
                }
                className="absolute inset-y-0 right-0 w-1/4 cursor-pointer opacity-0"
              />
            </>
          )}

          {/* Counter Pill */}
          <div className="absolute right-[14px] bottom-[14px] bg-[#212121]/65 px-[10px] py-[4px] rounded-full">
            <span className="font-semibold text-[11px] leading-[15px] text-white">
              {activeIndex + 1} / {images.length}
            </span>
          </div>
        </div>

        {/* Thumbnail Selector */}
        {images.length > 1 && (
          <div className="flex items-center gap-[10px] overflow-x-auto no-scrollbar">
            {images.map((imgUrl, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={`${imgUrl}-${idx}`}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Pilih foto ${idx + 1}`}
                  className={`relative w-[48px] h-[48px] rounded-[12px] overflow-hidden shrink-0 cursor-pointer bg-white transition-all ${
                    isActive
                      ? "border-2 border-[#ec4899]"
                      : "border border-[#e5e7eb] opacity-75 hover:opacity-100"
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Product Info */}
        <div className="flex flex-col gap-[6px] w-full">
          <span className="font-semibold text-[12px] leading-[16px] text-[#ec4899]">
            {product.category_name}
          </span>
          <h1 className="font-bold text-[22px] leading-[30px] text-[#1f2937]">
            {product.name}
          </h1>
          <div className="flex items-center justify-between w-full pt-[2px]">
            <span className="font-bold text-[20px] leading-[28px] text-[#1f2937]">
              {formatRupiah(product.price)}
            </span>
            {product.is_available ? (
              <span className="bg-[#edfcf5] text-[#059669] font-semibold text-[11px] leading-[15px] px-[10px] py-[4px] rounded-full">
                Stok Tersedia
              </span>
            ) : (
              <span className="bg-[#fef2f2] text-[#ef4444] font-semibold text-[11px] leading-[15px] px-[10px] py-[4px] rounded-full">
                Stok Habis
              </span>
            )}
          </div>
        </div>

        {qtyInCart > 0 && (
          <div className="bg-[#fce7f3] rounded-[16px] px-[14px] py-[10px] flex items-center justify-between gap-[10px]">
            <span className="font-semibold text-[12px] text-[#ec4899]">
              {justAdded
                ? `Ditambahkan! (${qtyInCart}x di keranjang)`
                : `${qtyInCart}x sudah di keranjang`}
            </span>
            <Link
              href="/checkout"
              prefetch={false}
              className="font-bold text-[12px] text-[#db2777] underline underline-offset-2 whitespace-nowrap"
            >
              Lihat Checkout
            </Link>
          </div>
        )}
      </main>

      {/* Sticky Bottom Action Bar */}
      <footer className="sticky bottom-0 z-20 bg-white px-[16px] pt-[12px] pb-[14px] shadow-[0px_-4px_16px_0px_rgba(0,0,0,0.08)]">
        <button
          type="button"
          disabled={!product.is_available}
          onClick={handleAddToCart}
          className={`w-full h-[48px] rounded-[16px] font-bold text-[14px] leading-[20px] flex items-center justify-center transition-colors ${
            product.is_available
              ? "bg-[#ec4899] hover:bg-[#db2777] text-white cursor-pointer"
              : "bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed"
          }`}
        >
          {product.is_available
            ? justAdded
              ? "✓ Ditambahkan ke Keranjang"
              : "+ Tambah ke Keranjang"
            : "Stok Habis"}
        </button>
      </footer>
    </MobileShell>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailContent />
    </Suspense>
  );
}
