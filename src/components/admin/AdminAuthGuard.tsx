"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { MobileShell } from "@/components/MobileShell";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEMO_ADMIN_COOKIE, isSupabaseConfigured } from "@/lib/supabase/config";

export function hasDemoAdminCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((part) => part.trim() === `${DEMO_ADMIN_COOKIE}=1`);
}

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "authorized">("checking");

  useEffect(() => {
    let active = true;

    async function verifySession() {
      if (!isSupabaseConfigured()) {
        if (hasDemoAdminCookie()) {
          if (active) setStatus("authorized");
        } else {
          router.replace("/admin/login");
        }
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        router.replace("/admin/login");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      if (!session?.user) {
        router.replace("/admin/login");
        return;
      }

      setStatus("authorized");
    }

    verifySession();

    const supabase = isSupabaseConfigured() ? getSupabaseBrowserClient() : null;
    const subscription = supabase?.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!session?.user) {
          router.replace("/admin/login");
        }
      }
    );

    return () => {
      active = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, [router]);

  if (status !== "authorized") {
    return (
      <MobileShell className="bg-[#f9fafb] p-[16px] gap-[12px]">
        <div className="h-[44px] w-[180px] bg-[#e5e7eb]/60 rounded-[14px] animate-pulse" />
        <div className="h-[40px] w-full bg-[#e5e7eb]/60 rounded-[14px] animate-pulse" />
        <div className="h-[88px] w-full bg-white rounded-[16px] border border-[#e5e7eb] animate-pulse" />
        <div className="h-[88px] w-full bg-white rounded-[16px] border border-[#e5e7eb] animate-pulse" />
      </MobileShell>
    );
  }

  return <>{children}</>;
}
