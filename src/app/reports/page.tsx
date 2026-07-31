"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Receipt,
  BarChart3,
  ShoppingCart,
  Target,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";

interface Summary {
  buyMarketProfit: bigint;
  sellMarketProfit: bigint;
  spreadProfit: bigint;
  feeProfit: bigint;
  transferCost: bigint;
  totalProfit: bigint;
  totalToman: bigint;
  totalPkr: bigint;
  orderCount: number;
}

interface StatusCounts {
  IN_PROGRESS: number;
  COMPLETED: number;
  CANCELLED: number;
  total: number;
}

interface ReportData {
  summary: {
    today: Summary;
    thisWeek: Summary;
    thisMonth: Summary;
    allTime: Summary;
  };
  statusCounts: StatusCounts;
  expenses: {
    totalExpenses: number;
    totalIncome: number;
    netExpense: number;
  };
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("month");
  const showProfit = user?.role !== "CASHIER";

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    const now = new Date();
    if (period === "today") {
      params.set("from", now.toISOString().split("T")[0]);
      params.set("to", now.toISOString().split("T")[0]);
    } else if (period === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      params.set("from", start.toISOString().split("T")[0]);
      params.set("to", now.toISOString().split("T")[0]);
    } else if (period === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      params.set("from", start.toISOString().split("T")[0]);
      params.set("to", now.toISOString().split("T")[0]);
    }
    api.get(`/api/reports/profit?${params.toString()}`).then((d) => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [period]);

  const currentSummary = data?.summary ? (
    period === "today" ? data.summary.today :
    period === "week" ? data.summary.thisWeek :
    period === "month" ? data.summary.thisMonth :
    data.summary.allTime
  ) : null;

  const fmt = (v: bigint | number) => Number(v).toLocaleString("en-US");

  if (loading) return (
    <main className="min-h-dvh bg-[#fafafa]">
      <div className="bg-white border-b border-gray-100/80">
        <div className="flex h-14 items-center px-5">
          <h1 className="text-[17px] font-bold tracking-tight text-gray-900">گزارشات</h1>
        </div>
        <div className="px-4 pb-3">
          <div className="flex gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-16 rounded-[5px]" />
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-[5px] bg-white border border-gray-200/80 p-4">
              <Skeleton className="h-3 w-20 mb-2.5" />
              <Skeleton className="h-7 w-28" />
            </div>
          ))}
        </div>
        <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
          <Skeleton className="h-3 w-32 mb-3" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-3 w-14 mx-auto mb-1.5" />
                <Skeleton className="h-5 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-[5px] bg-white border border-gray-200/80 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-10 w-10 rounded-[5px]" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-10 rounded-[5px]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );

  return (
    <main className="min-h-dvh bg-[#fafafa]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100/80">
        <div className="flex h-14 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[17px] font-bold tracking-tight text-gray-900">گزارشات</h1>
            {currentSummary && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-100 px-1.5 text-[10px] font-bold text-gray-500 tabular-nums">
                {currentSummary.orderCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
          </div>
        </div>

        {/* Period Tabs */}
        <div className="px-4 pb-3">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {([["today", "امروز"], ["week", "این هفته"], ["month", "این ماه"], ["all", "همه"]] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className={cn(
                  "rounded-[5px] px-4 py-1.5 text-[11px] font-semibold transition-all duration-200 whitespace-nowrap",
                  period === value
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-gray-100/70 text-gray-400 hover:text-gray-600"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 pb-24 space-y-3">
        {/* Main Summary Cards - hidden for CASHIER */}
        {showProfit && currentSummary && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              {/* Buy Profit */}
              <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-green-50">
                    <TrendingUp className="h-4 w-4 text-green-500" strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-medium text-gray-500">سود خرید</span>
                </div>
                <p className="text-[18px] font-bold text-green-700 tabular-nums" dir="ltr">{fmt(currentSummary.buyMarketProfit)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">تومان</p>
                <p className="text-[9px] text-gray-400 mt-1.5 leading-relaxed">مجموع سود معاملات خرید</p>
              </div>

              {/* Sell Profit */}
              <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-emerald-50">
                    <TrendingUp className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-medium text-gray-500">سود فروش</span>
                </div>
                <p className="text-[18px] font-bold text-emerald-700 tabular-nums" dir="ltr">{fmt(currentSummary.sellMarketProfit)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">تومان</p>
                <p className="text-[9px] text-gray-400 mt-1.5 leading-relaxed">مجموع سود معاملات فروش</p>
              </div>
            </div>

            {/* Transfer Cost + Net Profit */}
            {Number(currentSummary.transferCost) > 0 && (
              <div className="rounded-[5px] bg-white border border-red-200/80 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-red-50">
                    <TrendingDown className="h-4 w-4 text-red-500" strokeWidth={1.5} />
                  </div>
                  <span className="text-[12px] font-medium text-red-600">هزینه انتقال</span>
                </div>
                <span className="text-[14px] font-bold text-red-600 tabular-nums" dir="ltr">-{fmt(currentSummary.transferCost)} <span className="text-[10px] font-normal text-red-400">تومان</span></span>
              </div>
            )}
            <div className="rounded-[5px] bg-emerald-50 border border-emerald-200/60 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-emerald-100">
                  <Target className="h-4 w-4 text-emerald-600" strokeWidth={1.5} />
                </div>
                <span className="text-[13px] font-semibold text-emerald-700">سود نهایی</span>
              </div>
              <span className="text-[16px] font-bold text-emerald-800 tabular-nums" dir="ltr">{fmt(currentSummary.totalProfit)} <span className="text-[10px] font-normal text-emerald-600">تومان</span></span>
            </div>
            <p className="text-[9px] text-gray-400 px-1 leading-relaxed">مجموع سود خرید و سود فروش</p>
          </div>
        )}

        {/* Order Status Breakdown */}
        {data?.statusCounts && (
          <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-gray-50">
                <ShoppingCart className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
              </div>
              <p className="text-[12px] font-semibold text-gray-900">وضعیت سفارشات</p>
              <span className="mr-auto text-[10px] text-gray-400">{data.statusCounts.total} سفارش</span>
            </div>
            <div className="space-y-3">
              {[
                { key: "COMPLETED" as const, label: "تکمیل شده", count: data.statusCounts.COMPLETED, color: "bg-green-500", bgColor: "bg-green-50", textColor: "text-green-600" },
                { key: "IN_PROGRESS" as const, label: "در حال انجام", count: data.statusCounts.IN_PROGRESS, color: "bg-yellow-500", bgColor: "bg-yellow-50", textColor: "text-yellow-600" },
                { key: "CANCELLED" as const, label: "لغو شده", count: data.statusCounts.CANCELLED, color: "bg-red-500", bgColor: "bg-red-50", textColor: "text-red-600" },
              ].map((s) => {
                const pct = data.statusCounts.total > 0 ? Math.round((s.count / data.statusCounts.total) * 100) : 0;
                return (
                  <div key={s.key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", s.color)} />
                        <span className={cn("text-[11px] font-medium", s.textColor)}>{s.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold tabular-nums text-gray-900">{s.count}</span>
                        <span className="text-[10px] text-gray-400 tabular-nums">({pct}%)</span>
                      </div>
                    </div>
                    <div className={cn("h-2 rounded-full overflow-hidden", s.bgColor)}>
                      <div className={cn("h-full rounded-full transition-all duration-500", s.color)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Expense Summary */}
        {data?.expenses && (data.expenses.totalExpenses > 0 || data.expenses.totalIncome > 0) && (
          <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-violet-50">
                <Receipt className="h-4 w-4 text-violet-500" strokeWidth={1.5} />
              </div>
              <p className="text-[12px] font-semibold text-gray-900">هزینه‌ها و درآمدها</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {data.expenses.totalExpenses > 0 && (
                <div className="rounded-[5px] bg-red-50 p-3 text-center">
                  <p className="text-[14px] font-bold text-red-600 tabular-nums" dir="ltr">{fmt(data.expenses.totalExpenses)}</p>
                  <p className="text-[10px] text-red-500 mt-0.5">هزینه‌ها</p>
                </div>
              )}
              {data.expenses.totalIncome > 0 && (
                <div className="rounded-[5px] bg-green-50 p-3 text-center">
                  <p className="text-[14px] font-bold text-green-600 tabular-nums" dir="ltr">{fmt(data.expenses.totalIncome)}</p>
                  <p className="text-[10px] text-green-500 mt-0.5">درآمدها</p>
                </div>
              )}
            </div>
            {data.expenses.netExpense > 0 && (
              <div className="mt-2 rounded-[5px] bg-gray-50 p-2.5 flex items-center justify-between">
                <span className="text-[11px] text-gray-500">خالص هزینه</span>
                <span className="text-[12px] font-bold text-gray-700 tabular-nums" dir="ltr">{fmt(data.expenses.netExpense)} تومان</span>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
