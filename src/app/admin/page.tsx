"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  FolderKanban,
  LogOut,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { CategoryManagerSheet } from "@/components/admin/CategoryManagerSheet";
import {
  deleteProduct,
  fetchCategories,
  fetchProducts,
  toggleProductAvailability,
} from "@/lib/catalog-service";
import { formatRupiah } from "@/lib/format";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEMO_ADMIN_COOKIE, isSupabaseConfigured } from "@/lib/supabase/config";
import type { Category, Product } from "@/types";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [confirmDeleteProduct, setConfirmDeleteProduct] =
    useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [cats, prods] = await Promise.all([
        fetchCategories(),
        fetchProducts(),
      ]);
      setCategories(cats);
      setProducts(prods);
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal memuat data katalog."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const [cats, prods] = await Promise.all([
          fetchCategories(),
          fetchProducts(),
        ]);
        if (!active) return;
        setCategories(cats);
        setProducts(prods);
        setErrorMsg(null);
      } catch (err) {
        if (!active) return;
        setErrorMsg(
          err instanceof Error ? err.message : "Gagal memuat data katalog."
        );
      } finally {
        if (active) setIsLoading(false);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCat =
        selectedCategoryId === "all" || p.category_id === selectedCategoryId;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category_name.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [products, selectedCategoryId, searchQuery]);

  const handleToggleAvailability = async (product: Product) => {
    const nextVal = !product.is_available;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, is_available: nextVal } : p
      )
    );
    try {
      await toggleProductAvailability(product.id, nextVal);
    } catch (err) {
      // Rollback jika gagal
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_available: !nextVal } : p
        )
      );
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal memperbarui status stok."
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteProduct || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteProduct(confirmDeleteProduct);
      setProducts((prev) =>
        prev.filter((p) => p.id !== confirmDeleteProduct.id)
      );
      setConfirmDeleteProduct(null);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menghapus produk."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    if (!isSupabaseConfigured()) {
      document.cookie = `${DEMO_ADMIN_COOKIE}=; path=/; max-age=0`;
      router.push("/admin/login");
      router.refresh();
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <MobileShell className="bg-[#f9fafb]">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#e5e7eb] px-[16px] pt-[14px] pb-[12px] flex flex-col gap-[12px]">
        <div className="flex items-center justify-between gap-[8px]">
          <div>
            <h1 className="font-bold text-[19px] leading-[24px] text-[#1f2937]">
              Kelola Katalog
            </h1>
            <p className="text-[11px] text-[#9ca3af]">
              {products.length} produk • {categories.length} kategori
            </p>
          </div>

          <div className="flex items-center gap-[6px]">
            <Link
              href="/"
              title="Lihat Katalog Pengunjung"
              className="w-[36px] h-[36px] rounded-full bg-[#f6f6f6] hover:bg-[#eeeeee] flex items-center justify-center text-[#1f2937] transition-colors"
            >
              <ExternalLink className="w-[16px] h-[16px]" />
            </Link>
            <button
              type="button"
              onClick={() => setIsCategorySheetOpen(true)}
              className="h-[36px] px-[12px] rounded-full bg-[#fce7f3] hover:bg-[#fbcfe8] text-[#ec4899] font-semibold text-[12px] flex items-center gap-[5px] cursor-pointer transition-colors"
            >
              <FolderKanban className="w-[15px] h-[15px]" />
              <span>Kategori</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              title="Keluar"
              aria-label="Logout"
              className="w-[36px] h-[36px] rounded-full bg-[#f6f6f6] hover:bg-[#fef2f2] text-[#1f2937] hover:text-[#ef4444] flex items-center justify-center cursor-pointer transition-colors"
            >
              <LogOut className="w-[16px] h-[16px]" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="w-[16px] h-[16px] text-[#9ca3af] absolute left-[12px] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama produk atau kode SKU (misal: KC-001)..."
            className="w-full bg-[#f6f6f6] border border-transparent focus:border-[#ec4899] focus:bg-white focus:outline-none pl-[36px] pr-[12px] py-[9px] rounded-[14px] text-[13px] text-[#1f2937] placeholder:text-[#9ca3af] transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-[8px] overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategoryId("all")}
            className={`px-[12px] py-[6px] rounded-full text-[12px] whitespace-nowrap cursor-pointer transition-colors ${
              selectedCategoryId === "all"
                ? "bg-[#ec4899] text-white font-semibold"
                : "bg-[#f3f4f6] text-[#1f2937] font-medium"
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-[12px] py-[6px] rounded-full text-[12px] whitespace-nowrap cursor-pointer transition-colors ${
                selectedCategoryId === cat.id
                  ? "bg-[#ec4899] text-white font-semibold"
                  : "bg-[#f3f4f6] text-[#1f2937] font-medium"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Product Card List */}
      <main className="flex-1 px-[16px] pt-[12px] pb-[92px] flex flex-col gap-[10px]">
        {errorMsg && (
          <div className="bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] rounded-[14px] px-[12px] py-[10px] text-[12px]">
            {errorMsg}
          </div>
        )}

        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-[16px] p-[12px] h-[88px] animate-pulse border border-[#e5e7eb]"
            />
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="py-[56px] text-center flex flex-col items-center gap-[8px]">
            <p className="font-semibold text-[14px] text-[#1f2937]">
              Tidak ada produk ditemukan
            </p>
            <p className="text-[12px] text-[#9ca3af]">
              Tambahkan produk baru atau ubah kata kunci pencarianmu.
            </p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const thumb = product.images[0] || "/assets/products/kc-001.png";
            return (
              <div
                key={product.id}
                className="bg-white border border-[#e5e7eb] rounded-[16px] p-[12px] flex items-center gap-[12px] shadow-[0px_1px_4px_rgba(0,0,0,0.03)]"
              >
                <Link
                  href={`/admin/product/${product.id}`}
                  className="w-[60px] h-[60px] rounded-[12px] overflow-hidden bg-[#f6f6f6] shrink-0 relative"
                >
                  <img
                    src={thumb}
                    alt={product.name}
                    className={`w-full h-full object-cover ${
                      !product.is_available ? "opacity-60 grayscale-[30%]" : ""
                    }`}
                  />
                </Link>

                <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
                  <div className="flex items-center gap-[6px]">
                    <span className="bg-[#fce7f3] text-[#ec4899] font-bold text-[10px] px-[7px] py-[2px] rounded-full">
                      {product.sku}
                    </span>
                    <span className="text-[11px] text-[#9ca3af] truncate">
                      {product.category_name}
                    </span>
                  </div>
                  <Link
                    href={`/admin/product/${product.id}`}
                    className="font-semibold text-[13px] leading-[18px] text-[#1f2937] line-clamp-2 hover:text-[#ec4899] transition-colors"
                  >
                    {product.name}
                  </Link>
                  <p className="font-bold text-[13px] text-[#1f2937]">
                    {formatRupiah(product.price)}
                  </p>
                </div>

                {/* Right Controls: Quick Toggle Switch + Edit & Delete */}
                <div className="flex flex-col items-end gap-[8px] shrink-0">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={product.is_available}
                    onClick={() => handleToggleAvailability(product)}
                    className="flex items-center gap-[6px] cursor-pointer"
                  >
                    <span
                      className={`text-[10px] font-bold ${
                        product.is_available
                          ? "text-[#10b981]"
                          : "text-[#ef4444]"
                      }`}
                    >
                      {product.is_available ? "Ready" : "Habis"}
                    </span>
                    <span
                      className={`w-[36px] h-[20px] rounded-full p-[2px] transition-colors flex items-center ${
                        product.is_available ? "bg-[#10b981]" : "bg-[#d1d5db]"
                      }`}
                    >
                      <span
                        className={`w-[16px] h-[16px] rounded-full bg-white shadow-sm transition-transform ${
                          product.is_available
                            ? "translate-x-[16px]"
                            : "translate-x-0"
                        }`}
                      />
                    </span>
                  </button>

                  <div className="flex items-center gap-[4px]">
                    <Link
                      href={`/admin/product/${product.id}`}
                      aria-label={`Edit ${product.name}`}
                      className="w-[30px] h-[30px] rounded-[10px] bg-[#f6f6f6] hover:bg-[#fce7f3] text-[#1f2937] hover:text-[#ec4899] flex items-center justify-center transition-colors"
                    >
                      <Pencil className="w-[14px] h-[14px]" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteProduct(product)}
                      aria-label={`Hapus ${product.name}`}
                      className="w-[30px] h-[30px] rounded-[10px] bg-[#f6f6f6] hover:bg-[#fef2f2] text-[#9ca3af] hover:text-[#ef4444] flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-[14px] h-[14px]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Floating Action Button (+ Tambah Produk) */}
      <div className="sticky bottom-[18px] z-20 px-[16px] flex justify-end pointer-events-none">
        <Link
          href="/admin/product/new"
          className="pointer-events-auto bg-[#ec4899] hover:bg-[#db2777] text-white font-bold text-[13px] h-[48px] px-[18px] rounded-full shadow-[0px_8px_24px_rgba(236,72,153,0.35)] flex items-center gap-[6px] transition-colors"
        >
          <Plus className="w-[18px] h-[18px]" />
          <span>Tambah Produk</span>
        </Link>
      </div>

      {/* Bottom Sheet Kelola Kategori */}
      <CategoryManagerSheet
        isOpen={isCategorySheetOpen}
        categories={categories}
        products={products}
        onClose={() => setIsCategorySheetOpen(false)}
        onUpdated={loadData}
      />

      {/* Bottom Sheet Konfirmasi Hapus Produk */}
      {confirmDeleteProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#121726]/55">
          <div className="w-full max-w-[480px] bg-white rounded-t-[24px] px-[18px] pt-[12px] pb-[24px] flex flex-col gap-[14px]">
            <div className="w-[40px] h-[4px] bg-[#e5e7eb] rounded-full mx-auto" />
            <div>
              <h3 className="font-bold text-[17px] text-[#1f2937]">
                Hapus Produk Ini?
              </h3>
              <p className="text-[13px] text-[#9ca3af] mt-[4px]">
                Produk{" "}
                <strong className="text-[#1f2937]">
                  [{confirmDeleteProduct.sku}] {confirmDeleteProduct.name}
                </strong>{" "}
                dan foto terkait akan dihapus permanen.
              </p>
            </div>
            <div className="flex gap-[10px]">
              <button
                type="button"
                onClick={() => setConfirmDeleteProduct(null)}
                className="flex-1 h-[44px] bg-[#f6f6f6] text-[#1f2937] font-bold text-[13px] rounded-[14px] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="flex-1 h-[44px] bg-[#ef4444] hover:bg-[#dc2626] disabled:opacity-70 text-white font-bold text-[13px] rounded-[14px] cursor-pointer"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
