"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Receipt, ClipboardList, ArrowDownToLine, Wallet, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface DashboardData {
  stats: {
    todayTransactions: number;
    todayProfit: bigint;
    todayVolume: bigint;
    totalProfit: bigint;
    totalCustomers: number;
    pendingOrders: number;
    inProgressOrders: number;
  };
  registers: { id: string; name: string; type: string; balance: bigint }[];
  rates: { id: string; currency: { code: string; name: string }; buyRate: bigint; sellRate: bigint }[];
  recentOrders: {
    id: string; orderType: string; status: string; amount: bigint; totalToman: bigint;
    createdAt: string; customer: { name: string }; currency: { code: string };
  }[];
  profitByEmployee: { name: string; profit: bigint; count: number }[];
}

const typeLabels: Record<string, string> = {
  IR_TO_PK: "ایران→پاکستان", PK_TO_IR: "پاکستان→ایران", BUY_PKR: "خرید روپیه", SELL_PKR: "فروش روپیه",
};
const typeColors: Record<string, string> = {
  IR_TO_PK: "bg-blue-50 text-blue-600", PK_TO_IR: "bg-emerald-50 text-emerald-600",
  BUY_PKR: "bg-violet-50 text-violet-600", SELL_PKR: "bg-amber-50 text-amber-600",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get("/api/dashboard").then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  if (loading) return <main className="min-h-dvh bg-white flex items-center justify-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" /></main>;
  if (!data) return <main className="min-h-dvh bg-white flex items-center justify-center"><p className="text-xs text-gray-300">خطا در بارگذاری</p></main>;

  const tomanReg = data.registers.find((r) => r.type === "toman");
  const rupeeReg = data.registers.find((r) => r.type === "rupee");

  const stats = [
    { label: "سود امروز", value: Number(data.stats.todayProfit).toLocaleString("en-US"), icon: TrendingUp, bg: "bg-green-50", color: "text-green-600" },
    { label: "حجم امروز", value: Number(data.stats.todayVolume).toLocaleString("en-US"), icon: Receipt, bg: "bg-blue-50", color: "text-blue-600" },
    { label: "سفارشات فعال", value: String(data.stats.pendingOrders + data.stats.inProgressOrders), icon: ClipboardList, bg: "bg-amber-50", color: "text-amber-600" },
    { label: "در حال انجام", value: String(data.stats.inProgressOrders), icon: Clock, bg: "bg-violet-50", color: "text-violet-600" },
  ];

  return (
    <div className="space-y-6 px-4 py-4">
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-gray-400 px-1 uppercase tracking-wider">موجودی صندوق‌ها</h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-gray-100 bg-white p-3">
            <div className="flex items-center gap-1.5 mb-1"><Wallet className="h-3.5 w-3.5 text-blue-500" strokeWidth={1.5} /><span className="text-[10px] text-gray-400">تومان</span></div>
            <p className="text-lg font-bold text-blue-700" dir="ltr">{tomanReg ? Number(tomanReg.balance).toLocaleString("en-US") : "0"}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-3">
            <div className="flex items-center gap-1.5 mb-1"><Wallet className="h-3.5 w-3.5 text-emerald-500" strokeWidth={1.5} /><span className="text-[10px] text-gray-400">روپیه</span></div>
            <p className="text-lg font-bold text-emerald-700" dir="ltr">{rupeeReg ? Number(rupeeReg.balance).toLocaleString("en-US") : "0"}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-gray-400 px-1 uppercase tracking-wider">آمار امروز</h2>
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
            <div key={r.id} className="min-w-[120px] rounded-xl border border-gray-100 bg-white p-3">
              <p className="text-[10px] text-gray-400">{r.currency.name}</p>
              <div className="flex items-center justify-between mt-1"><span className="text-[10px] text-blue-500">خرید</span><span className="text-xs font-bold text-blue-700" dir="ltr">{Number(r.buyRate).toLocaleString("en-US")}</span></div>
              <div className="flex items-center justify-between mt-0.5"><span className="text-[10px] text-emerald-500">فروش</span><span className="text-xs font-bold text-emerald-700" dir="ltr">{Number(r.sellRate).toLocaleString("en-US")}</span></div>
            </div>
          ))}</div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-gray-400 px-1 uppercase tracking-wider">دسترسی سریع</h2>
        <div className="grid grid-cols-4 gap-2">
          {[{ label: "سفارش جدید", icon: ClipboardList, bg: "bg-gray-900", href: "/orders/new" }, { label: "صندوق", icon: Wallet, bg: "bg-amber-500", href: "/cashier" }, { label: "نرخ ارز", icon: TrendingUp, bg: "bg-blue-600", href: "/rates" }, { label: "مشتریان", icon: ArrowDownToLine, bg: "bg-violet-600", href: "/customers" }].map((a) => (
            <Link key={a.href} href={a.href} className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-3 active:bg-gray-50">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", a.bg)}><a.icon className="h-4 w-4 text-white" strokeWidth={1.5} /></div>
              <span className="text-[10px] font-medium text-gray-500">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-gray-400 px-1 uppercase tracking-wider">آخرین سفارشات</h2>
        {data.recentOrders.length === 0 ? <p className="text-xs text-gray-300 px-1">سفارشی ثبت نشده</p> : (
          <div className="space-y-0">{data.recentOrders.map((o) => (
            <Link key={o.id} href={`/orders`} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 active:bg-gray-50 -mx-4 px-4">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold", typeColors[o.orderType])}>
                {typeLabels[o.orderType]?.substring(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-900">{typeLabels[o.orderType] || o.orderType}</span><span className="text-[10px] text-gray-300">{new Date(o.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span></div>
                <div className="flex items-center justify-between mt-0.5"><span className="text-[11px] text-gray-400">{o.customer.name}</span><span className="text-[10px] font-medium text-gray-500" dir="ltr">{Number(o.totalToman).toLocaleString("en-US")} تومان</span></div>
              </div>
            </Link>
          ))}</div>
        )}
      </section>
    </div>
  );
}
