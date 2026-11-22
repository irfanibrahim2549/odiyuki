"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Star, X } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { ImageCropSheet } from "@/components/admin/ImageCropSheet";
import {
  compressAndUploadProductImages,
  computeNextSkuPreview,
  createProduct,
  fetchCategories,
  fetchProducts,
  updateProduct,
} from "@/lib/catalog-service";
import { formatRupiah } from "@/lib/format";
import type { Category, Product } from "@/types";

interface ProductFormProps {
  mode: "create" | "edit";
  initialProduct?: Product | null;
}

export function ProductForm({ mode, initialProduct }: ProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);

  const [name, setName] = useState(initialProduct?.name || "");
  const [priceStr, setPriceStr] = useState(
    initialProduct ? String(initialProduct.price) : ""
  );
  const [categoryId, setCategoryId] = useState(
    initialProduct?.category_id || ""
  );
  const [images, setImages] = useState<string[]>(initialProduct?.images || []);
  const [removedOriginalImages, setRemovedOriginalImages] = useState<string[]>(
    []
  );
  const [isAvailable, setIsAvailable] = useState<boolean>(
    initialProduct ? initialProduct.is_available : true
  );

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [cropTotalCount, setCropTotalCount] = useState<number>(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoadingMeta(true);
      try {
        const [cats, prods] = await Promise.all([
          fetchCategories(),
          fetchProducts(),
        ]);
        if (!active) return;
        setCategories(cats);
        setAllProducts(prods);
        if (!categoryId && cats.length > 0) {
          setCategoryId(cats[0].id);
        }
      } catch (err) {
        if (active) {
          setErrorMsg(
            err instanceof Error ? err.message : "Gagal memuat kategori."
          );
        }
      } finally {
        if (active) setIsLoadingMeta(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [categoryId]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) || null,
    [categories, categoryId]
  );

  const skuPreview = useMemo(() => {
    if (mode === "edit" && initialProduct) {
      return initialProduct.sku;
    }
    if (!selectedCategory) return "---";
    return computeNextSkuPreview(selectedCategory.prefix, allProducts);
  }, [mode, initialProduct, selectedCategory, allProducts]);

  const numericPrice = useMemo(() => {
    const cleaned = priceStr.replace(/[^0-9]/g, "");
    return cleaned ? Number.parseInt(cleaned, 10) : 0;
  }, [priceStr]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    const remainingSlots = 5 - images.length;
    if (remainingSlots <= 0) {
      setErrorMsg("Maksimal 5 foto per produk.");
      return;
    }

    const selected = files.slice(0, remainingSlots);
    setErrorMsg(null);
    setCropQueue(selected);
    setCropTotalCount(selected.length);
  };

  const advanceCropQueue = () => {
    setCropQueue((prev) => {
      const next = prev.slice(1);
      if (next.length === 0) setCropTotalCount(0);
      return next;
    });
  };

  const handleConfirmCrop = async (croppedFile: File) => {
    setErrorMsg(null);
    setIsUploading(true);
    try {
      const uploadedUrls = await compressAndUploadProductImages([croppedFile]);
      setImages((prev) => [...prev, ...uploadedUrls].slice(0, 5));
      advanceCropQueue();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal mengunggah foto."
      );
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const targetUrl = images[index];
    setImages((prev) => prev.filter((_, i) => i !== index));

    if (
      mode === "edit" &&
      initialProduct?.images.includes(targetUrl) &&
      !removedOriginalImages.includes(targetUrl)
    ) {
      setRemovedOriginalImages((prev) => [...prev, targetUrl]);
    }
  };

  const handleMakeCover = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const target = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [target, ...rest];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Nama produk wajib diisi.");
      return;
    }
    if (numericPrice <= 0) {
      setErrorMsg("Harga produk harus lebih dari 0.");
      return;
    }
    if (!categoryId) {
      setErrorMsg("Pilih kategori produk terlebih dahulu.");
      return;
    }
    if (images.length === 0) {
      setErrorMsg("Unggah minimal 1 foto produk.");
      return;
    }

    setIsSaving(true);
    try {
      if (mode === "create") {
        await createProduct({
          name,
          price: numericPrice,
          category_id: categoryId,
          images,
          is_available: isAvailable,
        });
      } else if (initialProduct) {
        await updateProduct(
          initialProduct.id,
          {
            name,
            price: numericPrice,
            category_id: categoryId,
            images,
            is_available: isAvailable,
          },
          removedOriginalImages
        );
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menyimpan produk."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MobileShell>
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#e5e7eb] flex items-center gap-[12px] px-[16px] pt-[14px] pb-[12px]">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          aria-label="Kembali ke dashboard"
          className="w-[38px] h-[38px] rounded-full bg-[#f6f6f6] hover:bg-[#eeeeee] flex items-center justify-center cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-[18px] h-[18px] text-[#1f2937]" />
        </button>
        <h1 className="font-bold text-[19px] leading-[24px] text-[#1f2937]">
          {mode === "create" ? "Tambah Produk Baru" : "Edit Produk"}
        </h1>
      </header>

      <form
        id="product-form"
        onSubmit={handleSubmit}
        className="flex-1 px-[16px] py-[16px] flex flex-col gap-[16px]"
      >
        {/* Multi-Photo Upload */}
        <div className="flex flex-col gap-[8px]">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-[12px] text-[#1f2937]">
              Foto Produk (Maks. 5 Foto) *
            </label>
            <span className="text-[11px] text-[#9ca3af]">
              {images.length}/5 • WebP &lt;150KB
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="grid grid-cols-3 gap-[10px]">
            {images.map((url, idx) => (
              <div
                key={`${url}-${idx}`}
                className={`relative aspect-square rounded-[16px] overflow-hidden bg-[#f6f6f6] border ${
                  idx === 0 ? "border-2 border-[#ec4899]" : "border-[#e5e7eb]"
                }`}
              >
                <img
                  src={url}
                  alt={`Foto ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {idx === 0 ? (
                  <span className="absolute bottom-[6px] left-[6px] bg-[#ec4899] text-white text-[10px] font-bold px-[7px] py-[2px] rounded-full">
                    Cover
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleMakeCover(idx)}
                    title="Jadikan foto utama"
                    className="absolute bottom-[6px] left-[6px] bg-[#222222]/75 text-white text-[10px] font-semibold px-[6px] py-[2px] rounded-full flex items-center gap-[3px] cursor-pointer"
                  >
                    <Star className="w-[10px] h-[10px]" />
                    <span>Cover</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  aria-label="Hapus foto"
                  className="absolute top-[6px] right-[6px] w-[22px] h-[22px] rounded-full bg-[#222222]/75 text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-[12px] h-[12px]" />
                </button>
              </div>
            ))}

            {images.length < 5 && (
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-[16px] border-2 border-dashed border-[#e5e7eb] hover:border-[#ec4899] bg-[#f9fafb] flex flex-col items-center justify-center gap-[4px] text-[#9ca3af] hover:text-[#ec4899] cursor-pointer transition-colors"
              >
                {isUploading ? (
                  <span className="w-[20px] h-[20px] border-2 border-[#ec4899] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ImagePlus className="w-[22px] h-[22px]" />
                )}
                <span className="text-[11px] font-semibold">
                  {isUploading ? "Kompres..." : "+ Foto"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Pilih Kategori + Preview SKU Otomatis */}
        <div className="flex flex-col gap-[8px]">
          <div className="flex items-center justify-between gap-[8px]">
            <label className="font-semibold text-[12px] text-[#1f2937]">
              Kategori *
            </label>
            <span className="bg-[#fce7f3] text-[#ec4899] font-bold text-[11px] px-[10px] py-[3px] rounded-full">
              {mode === "create"
                ? `SKU otomatis: ${skuPreview}`
                : `SKU: ${skuPreview}`}
            </span>
          </div>

          {isLoadingMeta ? (
            <div className="h-[40px] bg-[#f3f4f6] rounded-[14px] animate-pulse" />
          ) : (
            <div className="flex flex-wrap gap-[8px]">
              {categories.map((cat) => {
                const selected = cat.id === categoryId;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`px-[12px] py-[8px] rounded-full text-[12px] cursor-pointer transition-colors ${
                      selected
                        ? "bg-[#ec4899] text-white font-semibold"
                        : "bg-[#f3f4f6] text-[#1f2937] font-medium hover:bg-[#e5e7eb]"
                    }`}
                  >
                    {cat.name} ({cat.prefix})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Nama Produk */}
        <div className="flex flex-col gap-[6px]">
          <label
            htmlFor="product-name"
            className="font-semibold text-[12px] text-[#1f2937]"
          >
            Nama Produk *
          </label>
          <input
            id="product-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Moonlight Sonata Winter Edition"
            className="bg-[#f9fafb] border border-[#e5e7eb] focus:border-[#ec4899] focus:outline-none px-[14px] py-[12px] rounded-[16px] text-[14px] text-[#1f2937] placeholder:text-[#9ca3af]"
          />
        </div>

        {/* Harga */}
        <div className="flex flex-col gap-[6px]">
          <div className="flex items-center justify-between">
            <label
              htmlFor="product-price"
              className="font-semibold text-[12px] text-[#1f2937]"
            >
              Harga (Rupiah) *
            </label>
            {numericPrice > 0 && (
              <span className="text-[11px] font-bold text-[#ec4899]">
                {formatRupiah(numericPrice)}
              </span>
            )}
          </div>
          <input
            id="product-price"
            type="number"
            inputMode="numeric"
            min={0}
            value={priceStr}
            onChange={(e) => setPriceStr(e.target.value)}
            placeholder="Contoh: 15000"
            className="bg-[#f9fafb] border border-[#e5e7eb] focus:border-[#ec4899] focus:outline-none px-[14px] py-[12px] rounded-[16px] text-[14px] text-[#1f2937] placeholder:text-[#9ca3af]"
          />
        </div>

        {/* Status Ketersediaan */}
        <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[16px] px-[14px] py-[12px] flex items-center justify-between">
          <div>
            <p className="font-semibold text-[13px] text-[#1f2937]">
              Status Ketersediaan
            </p>
            <p className="text-[11px] text-[#9ca3af]">
              {isAvailable
                ? "Tersedia (Ready) untuk dipesan"
                : "Habis (Sold Out) di katalog"}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isAvailable}
            onClick={() => setIsAvailable((prev) => !prev)}
            className={`w-[44px] h-[24px] rounded-full p-[3px] transition-colors flex items-center cursor-pointer ${
              isAvailable ? "bg-[#10b981]" : "bg-[#d1d5db]"
            }`}
          >
            <span
              className={`w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform ${
                isAvailable ? "translate-x-[20px]" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] rounded-[14px] px-[12px] py-[10px] text-[12px] font-medium">
            {errorMsg}
          </div>
        )}
      </form>

      {/* Sticky Bottom CTA */}
      <footer className="sticky bottom-0 z-20 bg-white px-[16px] pt-[12px] pb-[14px] shadow-[0px_-4px_16px_0px_rgba(0,0,0,0.08)]">
        <button
          type="submit"
          form="product-form"
          disabled={isSaving || isUploading}
          className="w-full h-[48px] bg-[#ec4899] hover:bg-[#db2777] disabled:opacity-70 text-white font-bold text-[14px] rounded-[16px] flex items-center justify-center cursor-pointer transition-colors"
        >
          {isSaving ? "Menyimpan Produk..." : "Simpan Produk"}
        </button>
      </footer>

      {/* Modal Crop 1:1 Foto Produk */}
      <ImageCropSheet
        key={cropQueue[0] ? `${cropQueue[0].name}-${cropQueue[0].size}-${cropQueue.length}` : "empty"}
        file={cropQueue[0] || null}
        queuePosition={
          cropTotalCount > 1
            ? {
                current: cropTotalCount - cropQueue.length + 1,
                total: cropTotalCount,
              }
            : undefined
        }
        onCancelAll={() => {
          setCropQueue([]);
          setCropTotalCount(0);
        }}
        onSkipCurrent={advanceCropQueue}
        onConfirmCrop={handleConfirmCrop}
      />
    </MobileShell>
  );
}
