import React from "react";

interface BrandLogoProps {
  className?: string;
  variant?: "default" | "solid";
}

export function BrandLogo({
  className = "",
  variant = "default",
}: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-[6px] shrink-0 ${className}`}>
      <img
        src="/assets/icons/brand-logo.svg"
        alt="Odiyuki Craft"
        width={36}
        height={36}
        crossOrigin="anonymous"
        className="w-[36px] h-[36px] shrink-0 block"
      />
      <span
        style={{ fontFamily: "var(--font-inria-sans), sans-serif" }}
        className={`font-bold text-[16px] leading-[24px] whitespace-nowrap ${
          variant === "solid"
            ? "text-[#4b2138]"
            : "bg-gradient-to-b from-[#1f2937] to-[#a1205f] bg-clip-text text-transparent"
        }`}
      >
        Odiyuki Craft
      </span>
    </div>
  );
}
