"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MobileShell } from "@/components/MobileShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { fetchProductById } from "@/lib/catalog-service";
import type { Product } from "@/types";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    let active = true;
    async function load() {
      setIsLoading(true);
      try {
        const found = await fetchProductById(productId);
        if (active) setProduct(found);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [productId]);

  if (isLoading) {
    return (
      <MobileShell className="p-[16px] gap-[16px]">
        <div className="h-[38px] w-[180px] bg-[#f3f4f6] rounded-[12px] animate-pulse" />
        <div className="grid grid-cols-3 gap-[10px]">
          <div className="aspect-square bg-[#f3f4f6] rounded-[16px] animate-pulse" />
          <div className="aspect-square bg-[#f3f4f6] rounded-[16px] animate-pulse" />
        </div>
        <div className="h-[48px] bg-[#f3f4f6] rounded-[16px] animate-pulse" />
        <div className="h-[48px] bg-[#f3f4f6] rounded-[16px] animate-pulse" />
      </MobileShell>
    );
  }

  if (!product) {
    return (
      <MobileShell className="items-center justify-center p-[24px] text-center gap-[12px]">
        <p className="font-bold text-[16px] text-[#1f2937]">
          Produk tidak ditemukan
        </p>
        <Link
          href="/admin"
          className="bg-[#ec4899] text-white font-bold text-[14px] px-[20px] py-[12px] rounded-[16px]"
        >
          Kembali ke Dashboard
        </Link>
      </MobileShell>
    );
  }

  return <ProductForm mode="edit" initialProduct={product} />;
}
