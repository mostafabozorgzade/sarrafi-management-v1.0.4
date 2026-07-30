"use client";

import { ExchangeLogo } from "@/components/shared/exchange-logo";

export function Logo() {
  return (
    <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
      <ExchangeLogo size={64} showText={false} />
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">صرافیکس</h1>
        <p className="text-sm text-gray-400 mt-1">مدیریت هوشمند صرافی</p>
      </div>
    </div>
  );
}
