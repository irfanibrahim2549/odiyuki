import React from "react";

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-[8px] shrink-0 ${className}`}>
      <img
        src="/assets/icons/brand-logo.svg"
        alt="Odiyuki"
        width={24}
        height={24}
        crossOrigin="anonymous"
        className="w-[24px] h-[24px] shrink-0 block"
      />
      <span className="font-bold text-[18px] leading-[24px] text-[#1f2937] whitespace-nowrap">
        Odiyuki
      </span>
    </div>
  );
}
