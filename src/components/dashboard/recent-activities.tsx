"use client";

import Link from "next/link";
import {
  ArrowUpLeft,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Tab = "transactions" | "rates" | "staff";

const tabs: { id: Tab; label: string }[] = [
  { id: "transactions", label: "معاملات" },
  { id: "rates", label: "تغییر نرخ" },
  { id: "staff", label: "کارکنان" },
];

const transactions = [
  { id: "1", type: "buy" as const, currency: "دلار", amount: "۵,۰۰۰", customer: "احمد محمدی", time: "۱۴:۳۰" },
  { id: "2", type: "sell" as const, currency: "یورو", amount: "۳,۰۰۰", customer: "علی رضایی", time: "۱۳:۴۵" },
  { id: "3", type: "buy" as const, currency: "روپیه", amount: "۵۰۰,۰۰۰", customer: "فاطمه کریمی", time: "۱۲:۱۵" },
  { id: "4", type: "sell" as const, currency: "دلار", amount: "۲,۰۰۰", customer: "حسن عباسی", time: "۱۱:۰۰" },
];

const rateChanges = [
  { id: "1", currency: "دلار", oldRate: "۵۸,۰۰۰", newRate: "۵۸,۲۰۰", change: "up" as const, time: "۱۴:۰۰" },
  { id: "2", currency: "یورو", oldRate: "۶۳,۸۰۰", newRate: "۶۳,۵۰۰", change: "down" as const, time: "۱۲:۳۰" },
  { id: "3", currency: "پوند", oldRate: "۷۴,۰۰۰", newRate: "۷۴,۵۰۰", change: "up" as const, time: "۱۱:۰۰" },
];

const staffActivities = [
  { id: "1", name: "سارا احمدی", action: "ثبت فروش ۳,۰۰۰ یورو", time: "۱۴:۳۰" },
  { id: "2", name: "امیر حسینی", action: "تغییر نرخ دلار", time: "۱۴:۰۰" },
  { id: "3", name: "نیلوفر رستمی", action: "ثبت خرید ۵۰۰,۰۰۰ روپیه", time: "۱۲:۱۵" },
];

export function RecentActivities() {
  const [activeTab, setActiveTab] = useState<Tab>("transactions");

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold text-gray-400 px-1 uppercase tracking-wider">آخرین فعالیت‌ها</h2>

      <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5 mx-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 rounded-md py-1.5 text-xs font-medium transition-all",
              activeTab === tab.id ? "bg-white text-gray-900" : "text-gray-400"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-0 px-1">
        {activeTab === "transactions" && transactions.map((t) => (
          <Link key={t.id} href={`/transactions/${t.id}`} className="flex items-center gap-3 px-3 py-3 border-b border-gray-50 last:border-0 active:bg-gray-50 -mx-3">
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", t.type === "buy" ? "bg-blue-50" : "bg-emerald-50")}>
              {t.type === "buy" ? <ArrowDownRight className="h-3.5 w-3.5 text-blue-600" strokeWidth={1.5} /> : <ArrowUpLeft className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.5} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-900">{t.type === "buy" ? "خرید" : "فروش"} {t.currency}</span>
                <span className="text-[10px] text-gray-300">{t.time}</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[11px] text-gray-400">{t.customer}</span>
                <span className="text-[11px] font-medium text-gray-600" dir="ltr">{t.amount}</span>
              </div>
            </div>
          </Link>
        ))}

        {activeTab === "rates" && rateChanges.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-3 py-3 border-b border-gray-50 last:border-0">
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", r.change === "up" ? "bg-green-50" : "bg-red-50")}>
              {r.change === "up" ? <TrendingUp className="h-3.5 w-3.5 text-green-600" strokeWidth={1.5} /> : <TrendingDown className="h-3.5 w-3.5 text-red-600" strokeWidth={1.5} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-900">{r.currency}</span>
                <span className="text-[10px] text-gray-300">{r.time}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-gray-400 line-through">{r.oldRate}</span>
                <span className={cn("text-[11px] font-medium", r.change === "up" ? "text-green-600" : "text-red-600")}>{r.newRate}</span>
              </div>
            </div>
          </div>
        ))}

        {activeTab === "staff" && staffActivities.map((s) => (
          <div key={s.id} className="flex items-center gap-3 px-3 py-3 border-b border-gray-50 last:border-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
              <UserCheck className="h-3.5 w-3.5 text-violet-600" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-900">{s.name}</span>
                <span className="text-[10px] text-gray-300">{s.time}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5 truncate">{s.action}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
