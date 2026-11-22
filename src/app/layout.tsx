import type { Metadata, Viewport } from "next";
import { Inria_Sans, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inriaSans = Inria_Sans({
  variable: "--font-inria-sans",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Odiyuki Craft — Katalog Aksesoris & Order Notes",
  description:
    "Katalog aksesoris mobile-first dengan pembuatan Order Notes otomatis ke WhatsApp.",
  icons: {
    icon: "/assets/icons/brand-logo.svg",
    shortcut: "/assets/icons/brand-logo.svg",
    apple: "/assets/icons/brand-logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${inriaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#f3f4f6] text-[#1f2937]">{children}</body>
    </html>
  );
}
