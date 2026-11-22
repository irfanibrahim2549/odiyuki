export const DEMO_ADMIN_COOKIE = "odiyuki-demo-admin";

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(
    url &&
      key &&
      url.startsWith("http") &&
      !url.includes("your-project") &&
      !key.includes("your-anon-key")
  );
}
