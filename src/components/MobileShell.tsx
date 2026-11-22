import React from "react";

interface MobileShellProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileShell({ children, className = "" }: MobileShellProps) {
  return (
    <div className="min-h-dvh w-full bg-[#f3f4f6] flex justify-center">
      <div
        className={`w-full max-w-[480px] min-h-dvh bg-white border-x border-[#e5e7eb] shadow-sm relative flex flex-col ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
