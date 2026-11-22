"use client";

import React, { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { createCategory, deleteCategory } from "@/lib/catalog-service";
import { suggestCategoryPrefix } from "@/lib/format";
import type { Category, Product } from "@/types";

interface CategoryManagerSheetProps {
  isOpen: boolean;
  categories: Category[];
  products: Product[];
  onClose: () => void;
  onUpdated: () => Promise<void> | void;
}

export function CategoryManagerSheet({
  isOpen,
  categories,
  products,
  onClose,
  onUpdated,
}: CategoryManagerSheetProps) {
  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [prefixManuallyEdited, setPrefixManuallyEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (value: string) => {
    setName(value);
    setErrorMsg(null);
    if (!prefixManuallyEdited) {
      setPrefix(suggestCategoryPrefix(value));
    }
  };

  const handlePrefixChange = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
    setPrefix(cleaned);
    setPrefixManuallyEdited(cleaned.length > 0);
    setErrorMsg(null);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await createCategory(name, prefix);
      setName("");
      setPrefix("");
      setPrefixManuallyEdited(false);
      await onUpdated();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menambah kategori."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    setErrorMsg(null);
    setDeletingId(categoryId);
    try {
      await deleteCategory(categoryId);
      await onUpdated();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Gagal menghapus kategori."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#121726]/55">
      <div className="w-full max-w-[480px] bg-white rounded-t-[24px] px-[16px] pt-[12px] pb-[24px] shadow-[0px_-8px_32px_rgba(0,0,0,0.16)] max-h-[85dvh] flex flex-col gap-[14px]">
        {/* Drag handle */}
        <div className="w-[40px] h-[4px] bg-[#e5e7eb] rounded-full mx-auto shrink-0" />

        {/* Sheet Header */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-bold text-[18px] leading-[24px] text-[#1f2937]">
              Kelola Kategori
            </h2>
            <p className="text-[12px] text-[#9ca3af]">
              Prefix SKU otomatis dibuat dari kategori (2–4 huruf)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-[34px] h-[34px] rounded-full bg-[#f6f6f6] hover:bg-[#eeeeee] flex items-center justify-center cursor-pointer"
          >
            <X className="w-[18px] h-[18px] text-[#1f2937]" />
          </button>
        </div>

        {/* Form Tambah Kategori */}
        <form
          onSubmit={handleAddCategory}
          className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[16px] p-[12px] flex flex-col gap-[10px] shrink-0"
        >
          <div className="grid grid-cols-3 gap-[8px]">
            <div className="col-span-2 flex flex-col gap-[4px]">
              <label className="font-semibold text-[11px] text-[#1f2937]">
                Nama Kategori
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Contoh: Hairpin"
                className="bg-white border border-[#e5e7eb] focus:border-[#ec4899] focus:outline-none px-[12px] py-[10px] rounded-[12px] text-[13px] text-[#1f2937]"
              />
            </div>
            <div className="col-span-1 flex flex-col gap-[4px]">
              <label className="font-semibold text-[11px] text-[#1f2937]">
                Prefix SKU
              </label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => handlePrefixChange(e.target.value)}
                placeholder="HP"
                maxLength={4}
                className="bg-white border border-[#e5e7eb] focus:border-[#ec4899] focus:outline-none px-[12px] py-[10px] rounded-[12px] text-[13px] font-bold uppercase text-[#ec4899]"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-[11px] font-medium text-[#ef4444]">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[42px] bg-[#ec4899] hover:bg-[#db2777] disabled:opacity-70 text-white font-bold text-[13px] rounded-[12px] flex items-center justify-center gap-[6px] cursor-pointer transition-colors"
          >
            <Plus className="w-[16px] h-[16px]" />
            <span>
              {isSubmitting ? "Menyimpan..." : "Tambah Kategori"}
            </span>
          </button>
        </form>

        {/* List Kategori Existing */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-[8px] pr-[2px]">
          {categories.map((cat) => {
            const count = products.filter(
              (p) => p.category_id === cat.id
            ).length;
            const isDeleting = deletingId === cat.id;

            return (
              <div
                key={cat.id}
                className="flex items-center justify-between bg-white border border-[#e5e7eb] rounded-[14px] px-[12px] py-[10px]"
              >
                <div className="flex items-center gap-[10px] min-w-0">
                  <span className="bg-[#fce7f3] text-[#ec4899] font-bold text-[11px] px-[8px] py-[4px] rounded-[8px] shrink-0">
                    {cat.prefix}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-[13px] text-[#1f2937] truncate">
                      {cat.name}
                    </p>
                    <p className="text-[11px] text-[#9ca3af]">
                      {count} produk aktif
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => handleDelete(cat.id)}
                  title={
                    count > 0
                      ? "Tidak dapat menghapus kategori yang memiliki produk"
                      : "Hapus kategori"
                  }
                  className={`p-[8px] rounded-[10px] transition-colors cursor-pointer ${
                    count > 0
                      ? "text-[#d1d5db] hover:bg-[#f9fafb]"
                      : "text-[#ef4444] hover:bg-[#fef2f2]"
                  }`}
                >
                  <Trash2 className="w-[16px] h-[16px]" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
