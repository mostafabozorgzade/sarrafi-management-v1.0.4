"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BadgeIndianRupee, TrendingUp, Receipt, BarChart3, ArrowDownToLine, ArrowUpFromLine, UserPlus, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface DashboardData {
  stats: { totalTransactions: number; todayTransactions: number; totalProfit: bigint; todayProfit: bigint; totalCustomers: number; todayVolume: bigint; };
  rates: { currency: string; buyRate: bigint; sellRate: bigint; }[];
  recentTransactions: { id: string; type: string; currency: string; totalToman: bigint; profit: bigint; createdAt: string; customer: { name: string }; user: { firstName: string; lastName: string }; }[];
}

const currencyNames: Record<string, string> = { PKR: "روپیه", USD: "دلار", EUR: "یورو" };

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get("/api/dashboard").then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  if (loading) return <main className="min-h-dvh bg-white flex items-center justify-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" /></main>;
  if (!data) return <main className="min-h-dvh bg-white flex items-center justify-center"><p className="text-xs text-gray-300">خطا در بارگذاری</p></main>;

  const stats = [
    { label: "تعداد معاملات", value: String(data.stats.todayTransactions), icon: Receipt, bg: "bg-blue-50", color: "text-blue-600" },
    { label: "سود امروز", value: Number(data.stats.todayProfit).toLocaleString("en-US"), icon: TrendingUp, bg: "bg-green-50", color: "text-green-600" },
    { label: "حجم معاملات", value: Number(data.stats.todayVolume).toLocaleString("en-US"), icon: BarChart3, bg: "bg-amber-50", color: "text-amber-600" },
    { label: "مشتریان", value: String(data.stats.totalCustomers), icon: BadgeIndianRupee, bg: "bg-violet-50", color: "text-violet-600" },
  ];

  return (
    <div className="space-y-6 px-4 py-4">
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-gray-400 px-1 uppercase tracking-wider">وضعیت امروز</h2>
        <div className="grid grid-cols-2 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-3">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", s.bg)}><s.icon className={cn("h-4 w-4", s.color)} strokeWidth={1.5} /></div>
              <p className="mt-2 text-[10px] text-gray-400">{s.label}</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5" dir="ltr">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-gray-400 px-1 uppercase tracking-wider">نرخ ارز</h2>
        {data.rates.length === 0 ? <p className="text-xs text-gray-300 px-1">نرخی ثبت نشده</p> : (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">{data.rates.map((r) => (
            <div key={r.currency} className="min-w-[120px] rounded-xl border border-gray-100 bg-white p-3">
              <p className="text-[10px] text-gray-400">{currencyNames[r.currency] || r.currency}</p>
              <div className="flex items-center justify-between mt-1"><span className="text-[10px] text-blue-500">خرید</span><span className="text-xs font-bold text-blue-700" dir="ltr">{Number(r.buyRate).toLocaleString("en-US")}</span></div>
              <div className="flex items-center justify-between mt-0.5"><span className="text-[10px] text-emerald-500">فروش</span><span className="text-xs font-bold text-emerald-700" dir="ltr">{Number(r.sellRate).toLocaleString("en-US")}</span></div>
            </div>
          ))}</div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-gray-400 px-1 uppercase tracking-wider">دسترسی سریع</h2>
        <div className="grid grid-cols-4 gap-2">
          {[{ label: "خرید", icon: ArrowDownToLine, bg: "bg-blue-600", href: "/transactions/buy" }, { label: "فروش", icon: ArrowUpFromLine, bg: "bg-emerald-600", href: "/transactions/sell" }, { label: "مشتری", icon: UserPlus, bg: "bg-violet-600", href: "/customers/new" }, { label: "صندوق", icon: Wallet, bg: "bg-amber-500", href: "/cashier" }].map((a) => (
            <Link key={a.href} href={a.href} className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-3 active:bg-gray-50">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", a.bg)}><a.icon className="h-4 w-4 text-white" strokeWidth={1.5} /></div>
              <span className="text-[10px] font-medium text-gray-500">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-gray-400 px-1 uppercase tracking-wider">آخرین معاملات</h2>
        {data.recentTransactions.length === 0 ? <p className="text-xs text-gray-300 px-1">معامله‌ای ثبت نشده</p> : (
          <div className="space-y-0">{data.recentTransactions.map((t) => (
            <Link key={t.id} href={`/transactions/${t.id}`} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 active:bg-gray-50 -mx-4 px-4">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", t.type === "buy" ? "bg-blue-50" : "bg-emerald-50")}>
                {t.type === "buy" ? <ArrowDownToLine className="h-3.5 w-3.5 text-blue-600" strokeWidth={1.5} /> : <ArrowUpFromLine className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.5} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-900">{t.type === "buy" ? "خرید" : "فروش"} {currencyNames[t.currency]}</span><span className="text-[10px] text-gray-300">{new Date(t.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span></div>
                <span className="text-[11px] text-gray-400">{t.customer.name}</span>
              </div>
            </Link>
          ))}</div>
        )}
      </section>
    </div>
  );
}
