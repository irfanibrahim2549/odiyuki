"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/MobileShell";
import { BrandLogo } from "@/components/BrandLogo";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEMO_ADMIN_COOKIE, isSupabaseConfigured } from "@/lib/supabase/config";

export default function AdminLoginPage() {
  const router = useRouter();
  const isLiveSupabase = isSupabaseConfigured();

  const [email, setEmail] = useState(isLiveSupabase ? "" : "admin@odiyuki.id");
  const [password, setPassword] = useState(isLiveSupabase ? "" : "admin123");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMsg("Email dan password wajib diisi.");
      return;
    }

    setIsLoading(true);
    try {
      if (!isLiveSupabase) {
        // Demo mode cookie auth
        document.cookie = `${DEMO_ADMIN_COOKIE}=1; path=/; max-age=86400; SameSite=Lax`;
        router.push("/admin");
        router.refresh();
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        throw new Error("Konfigurasi Supabase belum lengkap.");
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        throw new Error(
          error.message === "Invalid login credentials"
            ? "Email atau password salah."
            : error.message
        );
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal masuk ke admin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileShell className="justify-between px-[20px] py-[28px]">
      <div className="flex items-center justify-between">
        <BrandLogo />
        <Link
          href="/"
          className="text-[12px] font-semibold text-[#9ca3af] hover:text-[#1f2937] transition-colors"
        >
          Lihat Katalog →
        </Link>
      </div>

      <div className="my-auto py-[24px] flex flex-col gap-[20px]">
        <div className="flex flex-col gap-[6px]">
          <span className="inline-flex w-fit bg-[#fce7f3] text-[#ec4899] font-bold text-[11px] px-[10px] py-[4px] rounded-full">
            Admin Panel
          </span>
          <h1 className="font-bold text-[22px] leading-[30px] text-[#1f2937]">
            Masuk ke Kelola Katalog
          </h1>
          <p className="text-[13px] leading-[18px] text-[#9ca3af]">
            Kelola kategori, SKU otomatis, foto produk, dan stok langsung dari
            HP.
          </p>
        </div>

        {!isLiveSupabase && (
          <div className="bg-[#fce7f3]/70 border border-[#fbcfe8] rounded-[16px] px-[14px] py-[10px] text-[12px] leading-[17px] text-[#9d174d]">
            <strong>Mode Demo Lokal:</strong> Variabel Supabase belum diisi di{" "}
            <code className="bg-white/70 px-[4px] rounded">.env.local</code>.
            Klik tombol masuk di bawah untuk mencoba dashboard admin secara
            lokal.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]">
          <div className="flex flex-col gap-[6px]">
            <label
              htmlFor="admin-email"
              className="font-semibold text-[12px] leading-[16px] text-[#1f2937]"
            >
              Email Admin
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@odiyuki.id"
              autoComplete="email"
              className="bg-[#f9fafb] border border-[#e5e7eb] focus:border-[#ec4899] focus:outline-none px-[14px] py-[12px] rounded-[16px] text-[14px] text-[#1f2937] placeholder:text-[#9ca3af]"
            />
          </div>

          <div className="flex flex-col gap-[6px]">
            <label
              htmlFor="admin-password"
              className="font-semibold text-[12px] leading-[16px] text-[#1f2937]"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="bg-[#f9fafb] border border-[#e5e7eb] focus:border-[#ec4899] focus:outline-none px-[14px] py-[12px] rounded-[16px] text-[14px] text-[#1f2937] placeholder:text-[#9ca3af]"
            />
          </div>

          {errorMsg && (
            <div className="bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] rounded-[14px] px-[12px] py-[10px] text-[12px] font-medium">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-[4px] w-full h-[48px] bg-[#222222] hover:bg-[#111111] disabled:opacity-70 text-white font-bold text-[14px] rounded-[16px] flex items-center justify-center cursor-pointer transition-colors"
          >
            {isLoading ? "Memverifikasi..." : "Masuk ke Admin"}
          </button>
        </form>
      </div>

      <p className="text-center text-[11px] text-[#9ca3af]">
        Odiyuki Katalog Aksesoris • Mobile-First Admin
      </p>
    </MobileShell>
  );
}
