"use client";

import { Construction } from "lucide-react";

export default function ReportsPage() {
  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white">
        <div className="flex h-12 items-center px-4">
          <h1 className="text-sm font-semibold text-gray-900">گزارشات</h1>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center px-4 py-20">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50 mb-4">
          <Construction className="h-10 w-10 text-amber-400" strokeWidth={1.5} />
        </div>
        <h2 className="text-sm font-semibold text-gray-900 mb-1">بزودی فعال می‌شود</h2>
        <p className="text-[11px] text-gray-400 text-center max-w-[240px] leading-relaxed">
          این بخش در حال توسعه است و به زودی در دسترس قرار خواهد گرفت.
        </p>
      </div>
    </main>
  );
}
