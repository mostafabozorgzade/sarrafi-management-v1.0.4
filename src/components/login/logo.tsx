"use client";

import { ExchangeLogo } from "@/components/shared/exchange-logo";

export function Logo() {
  return (
    <div className="flex flex-col items-center gap-4 animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-[5px] bg-gray-50">
        <ExchangeLogo size={48} showText={false} />
      </div>
      <div className="text-center">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">صرافیکس</h1>
        <p className="text-[11px] text-gray-400 mt-0.5">مدیریت هوشمند صرافی</p>
      </div>
    </div>
  );
}
