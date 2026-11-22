"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MobileShell } from "./MobileShell";
import { BrandLogo } from "./BrandLogo";
import {
  fetchCatalogProductsPage,
  fetchCategories,
} from "@/lib/catalog-service";
import { formatRupiah } from "@/lib/format";
import { useVisitorStore } from "@/store/useVisitorStore";
import type { CatalogProductCard, Category } from "@/types";

const CATALOG_PAGE_SIZE = 12;

export function CatalogClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<CatalogProductCard[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cart = useVisitorStore((s) => s.cart);
  const savedOrders = useVisitorStore((s) => s.savedOrders);
  const hasHydrated = useVisitorStore((s) => s.hasHydrated);

  // Ambil kategori sekali langsung dari browser ke Supabase
  useEffect(() => {
    let active = true;
    fetchCategories()
      .then((cats) => {
        if (active) setCategories(cats);
      })
      .catch(() => {
        // Error ditangani pada fetch katalog
      });
    return () => {
      active = false;
    };
  }, []);

  // Ambil produk per halaman (12 produk) langsung dari browser ke Supabase
  useEffect(() => {
    let active = true;
    async function loadPage() {
      try {
        setIsLoading(true);
        const result = await fetchCatalogProductsPage({
          categoryId: selectedCategoryId,
          page: currentPage,
          pageSize: CATALOG_PAGE_SIZE,
        });
        if (!active) return;
        setProducts(result.items);
        setTotalCount(result.totalCount);
        setTotalPages(result.totalPages);
        setErrorMsg(null);
      } catch (err) {
        if (!active) return;
        setErrorMsg(
          err instanceof Error ? err.message : "Gagal memuat katalog produk."
        );
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadPage();
    return () => {
      active = false;
    };
  }, [selectedCategoryId, currentPage]);

  const handleSelectCategory = (categoryId: string) => {
    if (categoryId === selectedCategoryId) return;
    setSelectedCategoryId(categoryId);
    setCurrentPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) {
      return;
    }
    setCurrentPage(nextPage);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const cartQtyMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!hasHydrated) return map;
    for (const item of cart) {
      map.set(item.productId, item.qty);
    }
    return map;
  }, [cart, hasHydrated]);

  const totalQty = useMemo(() => {
    if (!hasHydrated) return 0;
    return cart.reduce((acc, item) => acc + item.qty, 0);
  }, [cart, hasHydrated]);

  const totalAmount = useMemo(() => {
    if (!hasHydrated) return 0;
    return cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  }, [cart, hasHydrated]);

  const orderCount = hasHydrated ? savedOrders.length : 0;

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  return (
    <MobileShell>
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-20 bg-white px-[16px] py-[16px] flex flex-col gap-[16px]">
        <div className="flex items-center justify-between w-full">
          <BrandLogo />
          <div className="flex items-center gap-[8px]">
            <Link
              href="/orders"
              prefetch={false}
              className="bg-[#fce7f3] hover:bg-[#fbcfe8] transition-colors flex items-center gap-[6px] pl-[12px] pr-[10px] py-[6px] rounded-full shrink-0"
            >
              <span className="font-semibold text-[12px] leading-[16px] text-[#ec4899] whitespace-nowrap">
                Pesanan ({orderCount})
              </span>
              <img
                src="/assets/icons/receipt.svg"
                alt=""
                width={16}
                height={16}
                className="w-[16px] h-[16px] shrink-0"
              />
            </Link>
          </div>
        </div>

        {/* Category Filter Pills */}
        <nav
          aria-label="Filter kategori"
          className="flex items-center gap-[8px] overflow-x-auto no-scrollbar w-full"
        >
          <button
            type="button"
            onClick={() => handleSelectCategory("all")}
            className={`flex items-center gap-[6px] py-[7px] rounded-full text-[12px] leading-[16px] whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              selectedCategoryId === "all"
                ? "bg-[#ec4899] text-white font-semibold pl-[12px] pr-[14px]"
                : "bg-[#f3f4f6] text-[#1f2937] font-medium px-[14px] hover:bg-[#e5e7eb]"
            }`}
          >
            {selectedCategoryId === "all" && (
              <img
                src="/assets/icons/check.svg"
                alt=""
                width={14}
                height={14}
                className="w-[14px] h-[14px] shrink-0"
              />
            )}
            <span>All</span>
          </button>

          {categories.map((cat) => {
            const isActive = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                className={`flex items-center gap-[6px] py-[7px] rounded-full text-[12px] leading-[16px] whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  isActive
                    ? "bg-[#ec4899] text-white font-semibold pl-[12px] pr-[14px]"
                    : "bg-[#f3f4f6] text-[#1f2937] font-medium px-[14px] hover:bg-[#e5e7eb]"
                }`}
              >
                {isActive && (
                  <img
                    src="/assets/icons/check.svg"
                    alt=""
                    width={14}
                    height={14}
                    className="w-[14px] h-[14px] shrink-0"
                  />
                )}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Product Grid Body */}
      <main className="flex-1 px-[16px] pt-[6px] pb-[16px] flex flex-col gap-[14px]">
        {selectedCategory && !isLoading && (
          <p className="font-medium text-[11px] leading-[15px] text-[#9ca3af]">
            Menampilkan {totalCount} produk di kategori {selectedCategory.name}
          </p>
        )}

        {errorMsg && (
          <div className="bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] rounded-[16px] p-[14px] text-[13px]">
            {errorMsg}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-[12px]">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="flex flex-col gap-[8px] animate-pulse">
                <div className="aspect-square w-full bg-[#f3f4f6] rounded-[16px]" />
                <div className="h-[16px] bg-[#f3f4f6] rounded w-4/5" />
                <div className="h-[12px] bg-[#f3f4f6] rounded w-3/5" />
                <div className="h-[16px] bg-[#f3f4f6] rounded w-2/5" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-[56px] flex flex-col items-center text-center gap-[8px]">
            <p className="font-semibold text-[15px] text-[#1f2937]">
              Belum ada produk di kategori ini
            </p>
            <p className="text-[13px] text-[#9ca3af]">
              Coba pilih kategori lain atau lihat semua produk.
            </p>
            {selectedCategoryId !== "all" && (
              <button
                type="button"
                onClick={() => handleSelectCategory("all")}
                className="mt-[8px] bg-[#fce7f3] text-[#ec4899] font-semibold text-[13px] px-[16px] py-[8px] rounded-full cursor-pointer"
              >
                Tampilkan Semua
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-[12px] gap-y-[14px]">
              {products.map((product) => {
                const qtyInCart = cartQtyMap.get(product.id) || 0;
                const coverImg =
                  product.cover_image || "/assets/products/kc-001.png";

                const cardContent = (
                  <>
                    <div className="relative aspect-square w-full bg-[#f6f6f6] rounded-[16px] overflow-hidden">
                      <img
                        src={coverImg}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                      />
                      {product.is_available && qtyInCart > 0 && (
                        <div className="absolute top-[8px] right-[8px] bg-[#ec4899] px-[8px] py-[3px] rounded-full">
                          <span className="font-bold text-[11px] leading-[15px] text-white block">
                            {qtyInCart}x
                          </span>
                        </div>
                      )}
                      {!product.is_available && (
                        <>
                          <div className="absolute inset-0 bg-[#1f2938]/45" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-[#222222] text-white font-bold text-[12px] leading-[16px] px-[12px] py-[5px] rounded-full">
                              Habis
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex flex-col gap-[3px] w-full">
                      <h2 className="font-semibold text-[14px] leading-[19px] text-[#1f2937] line-clamp-2">
                        {product.name}
                      </h2>
                      <p className="font-medium text-[11px] leading-[15px] text-[#9ca3af] truncate">
                        {product.category_name} • {product.sku}
                      </p>
                      <p
                        className={`font-bold text-[14px] leading-[20px] ${
                          product.is_available
                            ? "text-[#1f2937]"
                            : "text-[#9ca3af]"
                        }`}
                      >
                        {formatRupiah(product.price)}
                      </p>
                    </div>
                  </>
                );

                if (!product.is_available) {
                  return (
                    <div
                      key={product.id}
                      aria-disabled="true"
                      className="flex flex-col gap-[8px] items-start w-full cursor-not-allowed"
                    >
                      {cardContent}
                    </div>
                  );
                }

                return (
                  <Link
                    key={product.id}
                    href={`/product?id=${product.id}`}
                    prefetch={false}
                    className="group flex flex-col gap-[8px] items-start w-full"
                  >
                    {cardContent}
                  </Link>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav
                aria-label="Navigasi halaman katalog"
                className="mt-[20px] flex items-center justify-between gap-[10px] pt-[12px] border-t border-[#f3f4f6]"
              >
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="h-[38px] px-[12px] rounded-full bg-[#f3f4f6] hover:bg-[#e5e7eb] disabled:opacity-45 text-[#1f2937] font-semibold text-[12px] flex items-center gap-[4px] cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-[15px] h-[15px]" />
                  <span>Sebelumnya</span>
                </button>

                <span className="text-[12px] font-semibold text-[#9ca3af]">
                  Hal. <strong className="text-[#1f2937]">{currentPage}</strong>{" "}
                  / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="h-[38px] px-[12px] rounded-full bg-[#fce7f3] hover:bg-[#fbcfe8] disabled:bg-[#f3f4f6] disabled:opacity-45 text-[#ec4899] disabled:text-[#9ca3af] font-semibold text-[12px] flex items-center gap-[4px] cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-[15px] h-[15px]" />
                </button>
              </nav>
            )}
          </>
        )}
      </main>

      {/* Floating Bottom Action Bar */}
      <footer className="sticky bottom-0 z-20 bg-white px-[16px] pt-[12px] pb-[14px] shadow-[0px_-4px_16px_0px_rgba(0,0,0,0.08)] flex items-center gap-[12px]">
        <Link
          href={totalQty > 0 ? "/checkout" : "#"}
          prefetch={false}
          aria-disabled={totalQty === 0}
          onClick={(e) => {
            if (totalQty === 0) e.preventDefault();
          }}
          className={`relative w-[48px] h-[48px] shrink-0 block ${
            totalQty === 0 ? "pointer-events-none" : ""
          }`}
        >
          <div
            className={`w-[44px] h-[44px] mt-[4px] rounded-full flex items-center justify-center transition-colors ${
              totalQty > 0 ? "bg-[#222222]" : "bg-[#9ca3af]"
            }`}
          >
            <img
              src="/assets/icons/cart.svg"
              alt="Keranjang"
              width={20}
              height={20}
              className="w-[20px] h-[20px]"
            />
          </div>
          {totalQty > 0 && (
            <span className="absolute top-0 right-0 bg-[#ec4899] text-white font-bold text-[11px] leading-[15px] min-w-[19px] h-[19px] px-[5px] rounded-full flex items-center justify-center">
              {totalQty}
            </span>
          )}
        </Link>

        {totalQty > 0 ? (
          <Link
            href="/checkout"
            prefetch={false}
            className="flex-1 h-[48px] bg-[#222222] hover:bg-[#111111] text-white font-bold text-[14px] leading-[20px] rounded-[16px] flex items-center justify-center px-[16px] transition-colors"
          >
            Checkout • {formatRupiah(totalAmount)}
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="flex-1 h-[48px] bg-[#f3f4f6] text-[#9ca3af] font-bold text-[14px] leading-[20px] rounded-[16px] flex items-center justify-center px-[16px] cursor-not-allowed"
          >
            Keranjang Kosong
          </button>
        )}
      </footer>
    </MobileShell>
  );
}
