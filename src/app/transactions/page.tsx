"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpLeft, ArrowDownRight, Search } from "lucide-react";
import { transactions, currencyNames } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function TransactionsPage() {
  const [filter, setFilter] = useState<"today" | "week" | "month">("today");
  const [typeFilter, setTypeFilter] = useState<"all" | "buy" | "sell">("all");
  const [search, setSearch] = useState("");

  const filtered = transactions.filter((t) => {
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (search && !t.customer.includes(search)) return false;
    return true;
  });

  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white">
        <div className="flex h-12 items-center px-4">
          <h1 className="text-sm font-semibold text-gray-900">معاملات</h1>
        </div>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300" strokeWidth={1.5} />
            <input type="text" placeholder="جستجو..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pr-8 pl-3 text-xs text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div className="flex gap-1 px-4 pb-2">
          {(["today", "week", "month"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn("rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors", filter === f ? "bg-gray-900 text-white" : "text-gray-400")}>
              {f === "today" ? "امروز" : f === "week" ? "هفته" : "ماه"}
            </button>
          ))}
          <div className="mx-1 h-4 w-px bg-gray-200 self-center" />
          {(["all", "buy", "sell"] as const).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)} className={cn("rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors", typeFilter === t ? "bg-blue-600 text-white" : "text-gray-400")}>
              {t === "all" ? "همه" : t === "buy" ? "خرید" : "فروش"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3">
        <p className="text-[10px] text-gray-300 mb-2">{filtered.length} معامله</p>
        <div className="space-y-0">
          {filtered.map((t) => (
            <Link key={t.id} href={`/transactions/${t.id}`} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 active:bg-gray-50 -mx-4 px-4">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", t.type === "buy" ? "bg-blue-50" : "bg-emerald-50")}>
                {t.type === "buy" ? <ArrowDownRight className="h-4 w-4 text-blue-600" strokeWidth={1.5} /> : <ArrowUpLeft className="h-4 w-4 text-emerald-600" strokeWidth={1.5} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-900">{t.type === "buy" ? "خرید" : "فروش"} {currencyNames[t.currency]}</span>
                  <span className="text-[10px] text-gray-300">{t.id}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[11px] text-gray-400">{t.customer}</span>
                  <span className="text-xs font-semibold text-gray-800" dir="ltr">{t.totalToman.toLocaleString("en-US")}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] text-gray-300">{t.date}</span>
                  <span className="text-[10px] text-green-500 font-medium">سود: {t.profit.toLocaleString("en-US")}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
