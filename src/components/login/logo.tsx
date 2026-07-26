"use client";

import { Landmark } from "lucide-react";

export function Logo() {
  return (
    <div className="flex flex-col items-center gap-3 animate-in fade-in duration-500">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600">
        <Landmark className="h-8 w-8 text-white" strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <h1 className="text-xl font-bold text-gray-900">SarafiX</h1>
        <p className="text-xs text-gray-400 mt-0.5">مدیریت هوشمند صرافی</p>
      </div>
    </div>
  );
}
