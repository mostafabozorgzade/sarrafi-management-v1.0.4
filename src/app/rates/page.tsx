"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Clock, User } from "lucide-react";
import { currencyRates, currencyNames } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function RatesPage() {
  const [tab, setTab] = useState<"current" | "history">("current");

  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white">
        <div className="flex h-12 items-center px-4">
          <h1 className="text-sm font-semibold text-gray-900">نرخ ارز</h1>
        </div>
        <div className="flex gap-1 px-4 pb-2">
          <button onClick={() => setTab("current")} className={cn("flex-1 rounded-md py-1.5 text-xs font-medium transition-colors", tab === "current" ? "bg-gray-900 text-white" : "text-gray-400")}>نرخ فعلی</button>
          <button onClick={() => setTab("history")} className={cn("flex-1 rounded-md py-1.5 text-xs font-medium transition-colors", tab === "history" ? "bg-gray-900 text-white" : "text-gray-400")}>تاریخچه</button>
        </div>
      </div>

      <div className="p-4">
        {tab === "current" && currencyRates.map((rate) => (
          <div key={rate.id} className="rounded-xl border border-gray-100 p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-bold text-blue-600">PK</div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-900">{currencyNames[rate.currency]}</h3>
                  <p className="text-[9px] text-gray-300">آخرین تغییر: {rate.lastChangedBy}</p>
                </div>
              </div>
              <span className="text-[10px] text-gray-300">{rate.lastChangedAt}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <TrendingDown className="h-3 w-3 text-blue-500" strokeWidth={1.5} />
                  <span className="text-[10px] text-blue-500">خرید</span>
                </div>
                <p className="text-lg font-bold text-blue-700" dir="ltr">{rate.buyRate.toLocaleString("en-US")}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <TrendingUp className="h-3 w-3 text-emerald-500" strokeWidth={1.5} />
                  <span className="text-[10px] text-emerald-500">فروش</span>
                </div>
                <p className="text-lg font-bold text-emerald-700" dir="ltr">{rate.sellRate.toLocaleString("en-US")}</p>
              </div>
            </div>
            <div className="mt-2 rounded-lg bg-gray-50 p-2 flex items-center justify-between">
              <span className="text-[10px] text-gray-400">حاشیه</span>
              <span className="text-xs font-semibold text-green-600">{rate.sellRate - rate.buyRate} تومان</span>
            </div>
          </div>
        ))}

        {tab === "history" && currencyRates[0]?.history.map((h, i) => (
          <div key={i} className="border-b border-gray-50 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-gray-300" strokeWidth={1.5} />
                <span className="text-[10px] text-gray-400">{h.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-2.5 w-2.5 text-gray-300" strokeWidth={1.5} />
                <span className="text-[9px] text-gray-300">{h.changedBy}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] text-gray-300 mb-0.5">خرید</p>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-gray-300 line-through">{h.oldBuy}</span>
                  <span className="text-gray-200">→</span>
                  <span className={cn("font-semibold", h.newBuy > h.oldBuy ? "text-green-600" : "text-red-500")}>{h.newBuy}</span>
                </div>
              </div>
              <div>
                <p className="text-[9px] text-gray-300 mb-0.5">فروش</p>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-gray-300 line-through">{h.oldSell}</span>
                  <span className="text-gray-200">→</span>
                  <span className={cn("font-semibold", h.newSell > h.oldSell ? "text-green-600" : "text-red-500")}>{h.newSell}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
