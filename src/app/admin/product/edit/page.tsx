"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MobileShell } from "@/components/MobileShell";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import { ProductForm } from "@/components/admin/ProductForm";
import { fetchProductById } from "@/lib/catalog-service";
import type { Product } from "@/types";

function EditProductSkeleton() {
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

function EditProductContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(productId));

  useEffect(() => {
    if (!productId) return;
    let active = true;
    async function load(id: string) {
      try {
        const found = await fetchProductById(id);
        if (active) setProduct(found);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load(productId);
    return () => {
      active = false;
    };
  }, [productId]);

  if (productId && isLoading) {
    return <EditProductSkeleton />;
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

export default function EditProductPage() {
  return (
    <AdminAuthGuard>
      <Suspense fallback={<EditProductSkeleton />}>
        <EditProductContent />
      </Suspense>
    </AdminAuthGuard>
  );
}
