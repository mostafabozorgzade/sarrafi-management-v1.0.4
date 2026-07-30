"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Wallet,
  Receipt,
  Send,
  User,
  BarChart3,
  ShoppingCart,
  Target,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ORDER_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS, ICON_MAP } from "@/lib/order-types";

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

interface ProfitByType {
  orderType: string;
  buyMarketProfit: bigint;
  sellMarketProfit: bigint;
  spreadProfit: bigint;
  feeProfit: bigint;
  transferCost: bigint;
  totalProfit: bigint;
  totalToman: bigint;
  totalPkr: bigint;
  count: number;
}

interface DailyProfit {
  date: string;
  orderCount: number;
  buyMarketProfit: bigint;
  sellMarketProfit: bigint;
  spreadProfit: bigint;
  feeProfit: bigint;
  transferCost: bigint;
  totalProfit: bigint;
  totalToman: bigint;
}

interface FilteredOrder {
  id: string;
  orderType: string;
  status: string;
  amount: bigint;
  totalToman: bigint;
  calculatedPkr: bigint | null;
  fee: bigint;
  transferCost: bigint;
  buyMarketProfitAmount: bigint;
  sellMarketProfitAmount: bigint;
  spreadProfitAmount: bigint;
  feeAmount: bigint;
  totalProfitAmount: bigint;
  createdAt: string;
  customer: { name: string };
}

interface TopCustomer {
  customerId: string;
  customerName: string;
  orderCount: number;
  totalToman: bigint;
  totalProfit: bigint;
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
  profitByType: ProfitByType[];
  dailyProfit: DailyProfit[];
  filteredOrders: FilteredOrder[];
  topCustomers: TopCustomer[];
  expenses: {
    totalExpenses: number;
    totalIncome: number;
    netExpense: number;
  };
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("month");
  const [filterType, setFilterType] = useState<string>("all");

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
    if (filterType !== "all") params.set("orderType", filterType);

    api.get(`/api/reports/profit?${params.toString()}`).then((d) => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [period, filterType]);

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
        {/* Main Summary Cards */}
        {currentSummary && (
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
            </div>

            {/* Spread Profit */}
            <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-blue-50">
                  <Receipt className="h-4 w-4 text-blue-500" strokeWidth={1.5} />
                </div>
                <span className="text-[11px] font-medium text-gray-500">سود Spread</span>
              </div>
              <p className="text-[18px] font-bold text-blue-700 tabular-nums" dir="ltr">{fmt(currentSummary.spreadProfit)}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">تومان</p>
            </div>

            {/* Fee */}
            <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-amber-50">
                  <Wallet className="h-4 w-4 text-amber-500" strokeWidth={1.5} />
                </div>
                <span className="text-[11px] font-medium text-gray-500">کارمزد</span>
              </div>
              <p className="text-[18px] font-bold text-amber-700 tabular-nums" dir="ltr">{fmt(currentSummary.feeProfit)}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">تومان</p>
            </div>
          </div>
        )}

        {/* Transfer Cost + Net Profit */}
        {currentSummary && (
          <div className="space-y-2">
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
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center rounded-[5px] bg-yellow-50 p-3">
                <p className="text-[20px] font-bold text-yellow-600 tabular-nums">{data.statusCounts.IN_PROGRESS}</p>
                <p className="text-[10px] text-yellow-500 mt-0.5">در حال انجام</p>
              </div>
              <div className="text-center rounded-[5px] bg-green-50 p-3">
                <p className="text-[20px] font-bold text-green-600 tabular-nums">{data.statusCounts.COMPLETED}</p>
                <p className="text-[10px] text-green-500 mt-0.5">تکمیل شده</p>
              </div>
              <div className="text-center rounded-[5px] bg-red-50 p-3">
                <p className="text-[20px] font-bold text-red-600 tabular-nums">{data.statusCounts.CANCELLED}</p>
                <p className="text-[10px] text-red-500 mt-0.5">لغو شده</p>
              </div>
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

        {/* Top Customers */}
        {data?.topCustomers && data.topCustomers.length > 0 && (
          <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-cyan-50">
                <User className="h-4 w-4 text-cyan-500" strokeWidth={1.5} />
              </div>
              <p className="text-[12px] font-semibold text-gray-900">برترین مشتریان</p>
              <span className="mr-auto text-[10px] text-gray-400">بر اساس حجم</span>
            </div>
            <div className="space-y-2">
              {data.topCustomers.map((c, idx) => (
                <div key={c.customerId} className="flex items-center gap-3 rounded-[5px] bg-gray-50 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200/80">
                    <span className="text-[11px] font-bold text-gray-600">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-gray-900 truncate">{c.customerName}</p>
                    <p className="text-[10px] text-gray-400">{c.orderCount} سفارش</p>
                  </div>
                  <div className="text-left">
                    <p className="text-[12px] font-bold text-gray-900 tabular-nums" dir="ltr">{fmt(c.totalToman)}</p>
                    <p className="text-[9px] text-gray-400">تومان</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profit by Type */}
        {data?.profitByType && data.profitByType.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Zap className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
              <h2 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">سود بر اساس نوع</h2>
            </div>
            <div className="space-y-2.5">
              {data.profitByType.map((p) => {
                const typeInfo = ORDER_TYPE_LABELS[p.orderType] || { label: p.orderType, color: "text-gray-600", bg: "bg-gray-50 text-gray-600" };
                const Icon = ICON_MAP[p.orderType] || Send;
                return (
                  <div key={p.orderType} className="rounded-[5px] bg-white border border-gray-200/80 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-gray-50">
                          <Icon className={cn("h-[18px] w-[18px]", typeInfo.color)} strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900">{typeInfo.label}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{p.count} سفارش تکمیل شده</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-[14px] font-bold text-gray-900 tabular-nums" dir="ltr">{fmt(p.totalProfit)}</p>
                        <p className="text-[9px] text-gray-400">تومان سود</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-[5px] bg-green-50 p-2.5 text-center">
                        <p className="text-[9px] text-green-500">سود خرید</p>
                        <p className="text-[12px] font-bold text-green-700 tabular-nums" dir="ltr">{fmt(p.buyMarketProfit)}</p>
                      </div>
                      <div className="rounded-[5px] bg-emerald-50 p-2.5 text-center">
                        <p className="text-[9px] text-emerald-500">سود فروش</p>
                        <p className="text-[12px] font-bold text-emerald-700 tabular-nums" dir="ltr">{fmt(p.sellMarketProfit)}</p>
                      </div>
                      <div className="rounded-[5px] bg-blue-50 p-2.5 text-center">
                        <p className="text-[9px] text-blue-500">Spread</p>
                        <p className="text-[12px] font-bold text-blue-700 tabular-nums" dir="ltr">{fmt(p.spreadProfit)}</p>
                      </div>
                      <div className="rounded-[5px] bg-amber-50 p-2.5 text-center">
                        <p className="text-[9px] text-amber-500">کارمزد</p>
                        <p className="text-[12px] font-bold text-amber-700 tabular-nums" dir="ltr">{fmt(p.feeProfit)}</p>
                      </div>
                    </div>
                    {Number(p.transferCost) > 0 && (
                      <div className="mt-2 rounded-[5px] bg-red-50 p-2 flex items-center justify-between">
                        <span className="text-[10px] text-red-500">هزینه انتقال</span>
                        <span className="text-[11px] font-bold text-red-600 tabular-nums" dir="ltr">-{fmt(p.transferCost)}</span>
                      </div>
                    )}
                    <div className="mt-2 rounded-[5px] bg-emerald-50 p-2.5 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-emerald-600">سود نهایی</span>
                      <span className="text-[13px] font-bold text-emerald-700 tabular-nums" dir="ltr">{fmt(p.totalProfit)} <span className="text-[9px] font-normal text-emerald-500">تومان</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Daily Profit */}
        {data?.dailyProfit && data.dailyProfit.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Calendar className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
              <h2 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">سود روزانه (۳۰ روز اخیر)</h2>
            </div>
            <div className="space-y-1.5">
              {data.dailyProfit.map((d) => (
                <div key={d.date} className="rounded-[5px] bg-white border border-gray-200/80 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
                      <span className="text-[11px] font-medium text-gray-700">{new Date(d.date).toLocaleDateString("fa-IR")}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">{d.orderCount} سفارش</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {Number(d.buyMarketProfit) > 0 && (
                      <span className="rounded-[3px] bg-green-50 px-1.5 py-0.5 text-[9px] font-medium text-green-600 tabular-nums" dir="ltr">{fmt(d.buyMarketProfit)}</span>
                    )}
                    {Number(d.sellMarketProfit) > 0 && (
                      <span className="rounded-[3px] bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600 tabular-nums" dir="ltr">{fmt(d.sellMarketProfit)}</span>
                    )}
                    {Number(d.spreadProfit) > 0 && (
                      <span className="rounded-[3px] bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-600 tabular-nums" dir="ltr">{fmt(d.spreadProfit)}</span>
                    )}
                    {Number(d.feeProfit) > 0 && (
                      <span className="rounded-[3px] bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 tabular-nums" dir="ltr">{fmt(d.feeProfit)}</span>
                    )}
                    {Number(d.transferCost) > 0 && (
                      <span className="rounded-[3px] bg-red-50 px-1.5 py-0.5 text-[9px] font-medium text-red-500 tabular-nums" dir="ltr">-{fmt(d.transferCost)}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400">حجم تومان</span>
                    <span className="text-[11px] font-medium text-gray-600 tabular-nums" dir="ltr">{fmt(d.totalToman)} <span className="text-[9px] text-gray-400">تومان</span></span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">سود خالص</span>
                    <span className={cn("text-[12px] font-bold tabular-nums", Number(d.totalProfit) >= 0 ? "text-emerald-600" : "text-red-500")} dir="ltr">{fmt(d.totalProfit)} <span className="text-[9px] font-normal text-gray-400">تومان</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtered Orders */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
              <h2 className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">لیست سفارشات</h2>
            </div>
            <div className="flex items-center gap-1">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-[10px] text-gray-500 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value="all">همه</option>
                <option value="IR_TO_PK">ارسال به پاکستان</option>
                <option value="PK_TO_IR">ارسال به ایران</option>
                <option value="BUY_PKR">خرید روپیه</option>
                <option value="SELL_PKR">فروش روپیه</option>
              </select>
            </div>
          </div>
          {data?.filteredOrders && data.filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-[5px] bg-gray-50 mb-3">
                <Receipt className="h-6 w-6 text-gray-300" strokeWidth={1.5} />
              </div>
              <p className="text-[13px] font-medium text-gray-400">سفارشی یافت نشد</p>
              <p className="text-[11px] text-gray-300 mt-0.5">برای این بازه زمانی سفارشی وجود ندارد</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data?.filteredOrders.map((o) => {
                const typeInfo = ORDER_TYPE_LABELS[o.orderType] || { label: o.orderType, color: "text-gray-600", bg: "bg-gray-50 text-gray-600" };
                const Icon = ICON_MAP[o.orderType] || Send;
                return (
                  <div key={o.id} className="rounded-[5px] bg-white border border-gray-200/80 p-4">
                    {/* Top Row */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-gray-50">
                          <Icon className={cn("h-4 w-4", typeInfo.color)} strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-gray-900">{typeInfo.label}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{o.customer.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded-[3px] px-2 py-0.5 text-[9px] font-semibold", STATUS_COLORS[o.status] || "bg-gray-50 text-gray-600")}>
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                      </div>
                    </div>

                    {/* Amount + Date */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">{new Date(o.createdAt).toLocaleDateString("fa-IR")}</span>
                      </div>
                      <span className="text-[13px] font-bold text-gray-900 tabular-nums" dir="ltr">
                        {fmt(o.totalToman)} <span className="text-[9px] font-normal text-gray-400">تومان</span>
                      </span>
                    </div>

                    {/* Profit Row */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-gray-100">
                      {Number(o.buyMarketProfitAmount) > 0 && (
                        <span className="rounded-[3px] bg-green-50 px-1.5 py-0.5 text-[9px] font-medium text-green-600 tabular-nums" dir="ltr">+{fmt(o.buyMarketProfitAmount)}</span>
                      )}
                      {Number(o.sellMarketProfitAmount) > 0 && (
                        <span className="rounded-[3px] bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600 tabular-nums" dir="ltr">+{fmt(o.sellMarketProfitAmount)}</span>
                      )}
                      {Number(o.spreadProfitAmount) > 0 && (
                        <span className="rounded-[3px] bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-600 tabular-nums" dir="ltr">+{fmt(o.spreadProfitAmount)}</span>
                      )}
                      {Number(o.feeAmount) > 0 && (
                        <span className="rounded-[3px] bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 tabular-nums" dir="ltr">+{fmt(o.feeAmount)}</span>
                      )}
                      {Number(o.transferCost) > 0 && (
                        <span className="rounded-[3px] bg-red-50 px-1.5 py-0.5 text-[9px] font-medium text-red-500 tabular-nums" dir="ltr">-{fmt(o.transferCost)}</span>
                      )}
                      <span className="mr-auto" />
                      <span className={cn("text-[11px] font-bold tabular-nums", o.totalProfitAmount && Number(o.totalProfitAmount) >= 0 ? "text-emerald-600" : "text-red-500")} dir="ltr">
                        {o.totalProfitAmount ? fmt(o.totalProfitAmount) : "0"} <span className="text-[9px] font-normal text-gray-400">تومان</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
