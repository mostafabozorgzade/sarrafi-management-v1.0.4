"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Calendar, Filter, Wallet, Receipt, ArrowDownToLine, Send, Banknote, Coins } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ORDER_TYPE_LABELS } from "@/lib/order-types";

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

interface ReportData {
  summary: {
    today: Summary;
    thisWeek: Summary;
    thisMonth: Summary;
    allTime: Summary;
  };
  profitByType: ProfitByType[];
  dailyProfit: DailyProfit[];
  filteredOrders: FilteredOrder[];
}

const typeIcons: Record<string, typeof Send> = {
  IR_TO_PK: Send,
  PK_TO_IR: ArrowDownToLine,
  BUY_PKR: Banknote,
  SELL_PKR: Coins,
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("month");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
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

  if (loading) return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white">
        <div className="flex h-12 items-center px-4"><h1 className="text-sm font-semibold text-gray-900">گزارشات</h1></div>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 p-3">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );

  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white">
        <div className="flex h-12 items-center px-4"><h1 className="text-sm font-semibold text-gray-900">گزارشات</h1></div>
        <div className="flex gap-1 px-4 pb-2">
          {([["today", "امروز"], ["week", "این هفته"], ["month", "این ماه"], ["all", "همه"]] as const).map(([value, label]) => (
            <button key={value} onClick={() => setPeriod(value)} className={cn("rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-colors whitespace-nowrap", period === value ? "bg-gray-900 text-white" : "text-gray-400")}>{label}</button>
          ))}
        </div>
      </div>

      <div className="p-4 pb-24 space-y-5">
        {/* Summary Cards */}
        {currentSummary && (
          <section className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-gray-100 bg-white p-3">
                <div className="flex items-center gap-1.5 mb-1"><TrendingUp className="h-3.5 w-3.5 text-green-500" strokeWidth={1.5} /><span className="text-[10px] text-gray-400">سود خرید نسبت به بازار</span></div>
                <p className="text-lg font-bold text-green-700" dir="ltr">{Number(currentSummary.buyMarketProfit).toLocaleString("en-US")}</p>
                <p className="text-[9px] text-gray-300 mt-0.5">تومان</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-3">
                <div className="flex items-center gap-1.5 mb-1"><TrendingUp className="h-3.5 w-3.5 text-emerald-500" strokeWidth={1.5} /><span className="text-[10px] text-gray-400">سود فروش نسبت به بازار</span></div>
                <p className="text-lg font-bold text-emerald-700" dir="ltr">{Number(currentSummary.sellMarketProfit).toLocaleString("en-US")}</p>
                <p className="text-[9px] text-gray-300 mt-0.5">تومان</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-3">
                <div className="flex items-center gap-1.5 mb-1"><Receipt className="h-3.5 w-3.5 text-blue-500" strokeWidth={1.5} /><span className="text-[10px] text-gray-400">سود Spread</span></div>
                <p className="text-lg font-bold text-blue-700" dir="ltr">{Number(currentSummary.spreadProfit).toLocaleString("en-US")}</p>
                <p className="text-[9px] text-gray-300 mt-0.5">تومان</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-3">
                <div className="flex items-center gap-1.5 mb-1"><Wallet className="h-3.5 w-3.5 text-amber-500" strokeWidth={1.5} /><span className="text-[10px] text-gray-400">کارمزد دریافتی</span></div>
                <p className="text-sm font-bold text-amber-700" dir="ltr">{Number(currentSummary.feeProfit).toLocaleString("en-US")}</p>
                <p className="text-[9px] text-gray-300 mt-0.5">تومان</p>
              </div>
            </div>
            {Number(currentSummary.transferCost) > 0 && (
              <div className="rounded-xl border border-red-100 bg-white p-3 flex items-center justify-between">
                <span className="text-xs text-red-500">هزینه انتقال</span>
                <span className="text-sm font-bold text-red-600" dir="ltr">-{Number(currentSummary.transferCost).toLocaleString("en-US")} تومان</span>
              </div>
            )}
            <div className="rounded-xl bg-green-50 p-3 flex items-center justify-between">
              <span className="text-xs text-green-600">سود نهایی</span>
              <span className="text-base font-bold text-green-800" dir="ltr">{Number(currentSummary.totalProfit).toLocaleString("en-US")} تومان</span>
            </div>
          </section>
        )}

        {/* Profit by Type */}
        {data?.profitByType && data.profitByType.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold text-gray-400 px-1 uppercase tracking-wider">سود بر اساس نوع</h2>
            <div className="space-y-2">
              {data.profitByType.map((p) => {
                const typeInfo = ORDER_TYPE_LABELS[p.orderType] || { label: p.orderType, color: "text-gray-600", bg: "bg-gray-50" };
                const Icon = typeIcons[p.orderType] || Send;
                return (
                  <div key={p.orderType} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", typeInfo.color)} strokeWidth={1.5} />
                        <span className="text-xs font-medium text-gray-900">{typeInfo.label}</span>
                      </div>
                      <span className="text-[10px] text-gray-300">{p.count} سفارش</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <p className="text-[9px] text-gray-400">سود خرید</p>
                        <p className="text-xs font-bold text-green-600" dir="ltr">{Number(p.buyMarketProfit).toLocaleString("en-US")}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-gray-400">سود فروش</p>
                        <p className="text-xs font-bold text-emerald-600" dir="ltr">{Number(p.sellMarketProfit).toLocaleString("en-US")}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-gray-400">Spread</p>
                        <p className="text-xs font-bold text-blue-600" dir="ltr">{Number(p.spreadProfit).toLocaleString("en-US")}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-gray-400">کارمزد</p>
                        <p className="text-xs font-bold text-amber-600" dir="ltr">{Number(p.feeProfit).toLocaleString("en-US")}</p>
                      </div>
                    </div>
                    {Number(p.transferCost) > 0 && (
                      <div className="mt-1 text-center">
                        <span className="text-[9px] text-red-500">هزینه انتقال: </span>
                        <span className="text-[9px] font-bold text-red-600" dir="ltr">-{Number(p.transferCost).toLocaleString("en-US")}</span>
                      </div>
                    )}
                    <div className="mt-2 rounded-lg bg-green-50 p-2 flex items-center justify-between">
                      <span className="text-[10px] text-green-600">سود نهایی</span>
                      <span className="text-xs font-bold text-green-700" dir="ltr">{Number(p.totalProfit).toLocaleString("en-US")} تومان</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Daily Profit Chart (Simple List) */}
        {data?.dailyProfit && data.dailyProfit.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold text-gray-400 px-1 uppercase tracking-wider">سود روزانه (۳۰ روز اخیر)</h2>
            <div className="space-y-1">
              {data.dailyProfit.map((d) => (
                <div key={d.date} className="flex items-center justify-between rounded-lg border border-gray-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-gray-300" strokeWidth={1.5} />
                    <span className="text-[10px] text-gray-500">{new Date(d.date).toLocaleDateString("fa-IR")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">{d.orderCount} سفارش</span>
                    <span className="text-[9px] text-green-500" dir="ltr">{Number(d.buyMarketProfit).toLocaleString("en-US")}</span>
                    <span className="text-[9px] text-emerald-500" dir="ltr">{Number(d.sellMarketProfit).toLocaleString("en-US")}</span>
                    <span className="text-[9px] text-blue-500" dir="ltr">{Number(d.spreadProfit).toLocaleString("en-US")}</span>
                    {Number(d.transferCost) > 0 && (
                      <span className="text-[9px] text-red-500" dir="ltr">-{Number(d.transferCost).toLocaleString("en-US")}</span>
                    )}
                    <span className="text-xs font-bold text-green-600" dir="ltr">{Number(d.totalProfit).toLocaleString("en-US")}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filtered Orders */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">لیست سفارشات</h2>
            <div className="flex items-center gap-1">
              <Filter className="h-3 w-3 text-gray-300" strokeWidth={1.5} />
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="text-[10px] text-gray-500 bg-transparent border-none focus:outline-none">
                <option value="all">همه</option>
                <option value="IR_TO_PK">ارسال به پاکستان</option>
                <option value="PK_TO_IR">ارسال به ایران</option>
                <option value="BUY_PKR">خرید روپیه</option>
                <option value="SELL_PKR">فروش روپیه</option>
              </select>
            </div>
          </div>
          {data?.filteredOrders && data.filteredOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-300">سفارشی یافت نشد</div>
          ) : (
            <div className="space-y-2">
              {data?.filteredOrders.map((o) => {
                const typeInfo = ORDER_TYPE_LABELS[o.orderType] || { label: o.orderType, color: "text-gray-600", bg: "bg-gray-50 text-gray-600" };
                const Icon = typeIcons[o.orderType] || Send;
                return (
                  <div key={o.id} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-3.5 w-3.5", typeInfo.color)} strokeWidth={1.5} />
                        <span className="text-[11px] font-medium text-gray-900">{typeInfo.label}</span>
                      </div>
                      <span className="text-[9px] text-gray-300">{new Date(o.createdAt).toLocaleDateString("fa-IR")}</span>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-400">{o.customer.name}</span>
                      <span className="text-[10px] text-gray-400" dir="ltr">{Number(o.totalToman).toLocaleString("en-US")} تومان</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400" dir="ltr">{Number(o.totalToman).toLocaleString("en-US")} تومان</span>
                      <div className="flex items-center gap-2">
                        {Number(o.buyMarketProfitAmount) > 0 && (
                          <span className="text-[9px] font-medium text-green-500" dir="ltr">{Number(o.buyMarketProfitAmount).toLocaleString("en-US")}</span>
                        )}
                        {Number(o.sellMarketProfitAmount) > 0 && (
                          <span className="text-[9px] font-medium text-emerald-500" dir="ltr">{Number(o.sellMarketProfitAmount).toLocaleString("en-US")}</span>
                        )}
                        {Number(o.spreadProfitAmount) > 0 && (
                          <span className="text-[9px] font-medium text-blue-500" dir="ltr">{Number(o.spreadProfitAmount).toLocaleString("en-US")}</span>
                        )}
                        {Number(o.transferCost) > 0 && (
                          <span className="text-[9px] font-medium text-red-500" dir="ltr">-{Number(o.transferCost).toLocaleString("en-US")}</span>
                        )}
                        <span className={cn("text-xs font-bold", o.totalProfitAmount && Number(o.totalProfitAmount) > 0 ? "text-green-600" : "text-red-500")} dir="ltr">
                          {o.totalProfitAmount ? Number(o.totalProfitAmount).toLocaleString("en-US") : "0"} تومان
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
