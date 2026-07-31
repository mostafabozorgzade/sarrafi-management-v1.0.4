"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  BarChart3,
  ClipboardList,
  ArrowDownToLine,
  Clock,
  Target,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_LABELS, STATUS_COLORS, ICON_MAP } from "@/lib/order-types";
import { useAuth } from "@/lib/auth-context";

interface DashboardData {
  stats: {
    todayBuyProfit: bigint;
    todaySellProfit: bigint;
    activeOrders: number;
  };
  rates: { id: string; currency: { code: string; name: string }; buyRate: bigint; sellRate: bigint; marketRate: bigint }[];
  recentOrders: {
    id: string; orderType: string; status: string; amount: bigint; totalToman: bigint;
    createdAt: string; customer: { name: string }; currency: { code: string };
  }[];
}

const QUICK_ACTIONS = [
  { label: "ثبت سفارش", icon: ClipboardList, bg: "bg-gray-900", href: "/orders" },
  { label: "نرخ ارز", icon: TrendingUp, bg: "bg-blue-600", href: "/rates" },
  { label: "مشتریان", icon: ArrowDownToLine, bg: "bg-violet-600", href: "/customers" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const showProfit = user?.role !== "CASHIER";

  useEffect(() => {
    api.get("/api/dashboard")
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const fmt = (v: bigint | number) => Number(v).toLocaleString("en-US");

  if (loading) return (
    <main className="min-h-dvh bg-[#fafafa]">
      <div className="bg-white border-b border-gray-100/80">
        <div className="flex h-14 items-center px-5">
          <Skeleton className="h-5 w-20 rounded-[5px]" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-[5px] bg-white border border-gray-200/80 p-4">
              <Skeleton className="h-8 w-8 rounded-[5px] mb-2.5" />
              <Skeleton className="h-3 w-20 mb-1.5" />
              <Skeleton className="h-6 w-28" />
            </div>
          ))}
        </div>
        <div className="rounded-[5px] bg-emerald-50 border border-emerald-200/60 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-[5px]" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 rounded-[5px] bg-white border border-gray-200/80 p-3">
              <Skeleton className="h-10 w-10 rounded-[5px]" />
              <Skeleton className="h-2 w-12" />
            </div>
          ))}
        </div>
        <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
          <Skeleton className="h-3 w-20 mb-3" />
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="min-w-[140px] rounded-[5px] bg-gray-50 p-3">
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
          <Skeleton className="h-3 w-24 mb-3" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
              <Skeleton className="h-9 w-9 rounded-[5px]" />
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-2.5 w-16" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );

  if (!data) return (
    <main className="min-h-dvh bg-[#fafafa] flex items-center justify-center">
      <p className="text-[13px] text-gray-400">خطا در بارگذاری</p>
    </main>
  );

  return (
    <main className="min-h-dvh bg-[#fafafa]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100/80">
        <div className="flex h-14 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[17px] font-bold tracking-tight text-gray-900">داشبورد</h1>
            {data.stats.activeOrders > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-600 tabular-nums">
                {data.stats.activeOrders}
              </span>
            )}
          </div>
          <BarChart3 className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
        </div>
      </div>

      <div className="p-4 pb-24 space-y-3">
        {/* Buy & Sell Profit Today - hidden for CASHIER */}
        {showProfit && (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-green-50">
                <TrendingUp className="h-4 w-4 text-green-500" strokeWidth={1.5} />
              </div>
              <span className="text-[11px] font-medium text-gray-500">سود خرید</span>
            </div>
            <p className="text-[18px] font-bold text-green-700 tabular-nums" dir="ltr">{fmt(data.stats.todayBuyProfit)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">تومان · امروز</p>
          </div>
          <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-emerald-50">
                <TrendingUp className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
              </div>
              <span className="text-[11px] font-medium text-gray-500">سود فروش</span>
            </div>
            <p className="text-[18px] font-bold text-emerald-700 tabular-nums" dir="ltr">{fmt(data.stats.todaySellProfit)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">تومان · امروز</p>
          </div>
        </div>
        )}

        {/* Final Profit Today - hidden for CASHIER */}
        {showProfit && (() => {
          const todayFinal = Number(data.stats.todayBuyProfit) + Number(data.stats.todaySellProfit);
          return (
            <div className="rounded-[5px] bg-emerald-50 border border-emerald-200/60 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-emerald-100">
                  <Target className="h-4 w-4 text-emerald-600" strokeWidth={1.5} />
                </div>
                <span className="text-[13px] font-semibold text-emerald-700">سود نهایی امروز</span>
              </div>
              <span className="text-[16px] font-bold text-emerald-800 tabular-nums" dir="ltr">{fmt(todayFinal)} <span className="text-[10px] font-normal text-emerald-600">تومان</span></span>
            </div>
          );
        })()}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.href} href={a.href} className="flex flex-col items-center gap-2 rounded-[5px] bg-white border border-gray-200/80 p-3 active:bg-gray-50 transition-colors">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-[5px]", a.bg)}>
                <a.icon className="h-4 w-4 text-white" strokeWidth={1.5} />
              </div>
              <span className="text-[10px] font-medium text-gray-500">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* Exchange Rates */}
        {data.rates.length > 0 && (
          <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-violet-50">
                <TrendingUp className="h-4 w-4 text-violet-500" strokeWidth={1.5} />
              </div>
              <p className="text-[12px] font-semibold text-gray-900">نرخ ارز</p>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {data.rates.map((r) => (
                <div key={r.id} className="min-w-[140px] rounded-[5px] bg-gray-50 p-3">
                  <p className="text-[11px] font-semibold text-gray-700">{r.currency.name}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400">بازار</span>
                    <span className="text-[11px] font-bold text-gray-700 tabular-nums" dir="ltr">{fmt(r.marketRate)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[10px] text-blue-500">خرید</span>
                    <span className="text-[11px] font-bold text-blue-700 tabular-nums" dir="ltr">{fmt(r.buyRate)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[10px] text-emerald-500">فروش</span>
                    <span className="text-[11px] font-bold text-emerald-700 tabular-nums" dir="ltr">{fmt(r.sellRate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-gray-50">
              <Clock className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
            </div>
            <p className="text-[12px] font-semibold text-gray-900">آخرین سفارشات</p>
            <span className="mr-auto text-[10px] text-gray-400">{data.recentOrders.length} سفارش</span>
          </div>
          {data.recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-[5px] bg-gray-50 mb-3">
                <ClipboardList className="h-5 w-5 text-gray-300" strokeWidth={1.5} />
              </div>
              <p className="text-[13px] font-medium text-gray-400">سفارشی ثبت نشده</p>
            </div>
          ) : (
            <div className="space-y-0">
              {data.recentOrders.map((o) => {
                const Icon = ICON_MAP[o.orderType] || ArrowDownToLine;
                return (
                  <Link key={o.id} href="/orders" className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 active:bg-gray-50 -mx-4 px-4 transition-colors">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-gray-50">
                      <Icon className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold text-gray-900">{o.customer.name}</span>
                          <span className={cn("rounded-[3px] px-1.5 py-0.5 text-[9px] font-semibold", STATUS_COLORS[o.status] || "bg-gray-50 text-gray-600")}>
                            {STATUS_LABELS[o.status] || o.status}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-gray-900 tabular-nums" dir="ltr">
                          {fmt(o.totalToman)} <span className="text-[9px] font-normal text-gray-400">تومان</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-gray-400">
                          {new Date(o.createdAt).toLocaleDateString("fa-IR")} · {new Date(o.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
