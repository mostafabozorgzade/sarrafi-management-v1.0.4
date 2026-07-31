"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  History,
  ArrowRight,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Rate {
  id: string;
  currencyId: string;
  marketRate: bigint;
  buyRate: bigint;
  sellRate: bigint;
  createdAt: string;
  currency: { code: string; name: string };
  changedBy: { firstName: string; lastName: string };
}

interface RateHistoryEntry {
  id: string;
  marketRate: bigint;
  buyRate: bigint;
  sellRate: bigint;
  createdAt: string;
  currency: { code: string; name: string };
  changedBy: { firstName: string; lastName: string };
}

export default function RatesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"current" | "change" | "history">("current");
  const [rates, setRates] = useState<Rate[]>([]);
  const [history, setHistory] = useState<RateHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pkrRate, setPkrRate] = useState<Rate | null>(null);
  const [marketRate, setMarketRate] = useState("");
  const [buyRate, setBuyRate] = useState("");
  const [sellRate, setSellRate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  const formatNum = (v: string) => {
    const d = v.replace(/[^0-9]/g, "");
    if (!d) return "";
    return Number(d).toLocaleString("en-US");
  };

  const loadRates = () => {
    setLoading(true);
    api.get("/api/rates").then((data) => {
      setRates(data);
      const pkr = data.find((r: Rate) => r.currency.code === "PKR");
      setPkrRate(pkr || null);
      if (pkr) {
        setMarketRate(Number(pkr.marketRate).toLocaleString("en-US"));
        setBuyRate(Number(pkr.buyRate).toLocaleString("en-US"));
        setSellRate(Number(pkr.sellRate).toLocaleString("en-US"));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const loadHistory = () => {
    setHistoryLoading(true);
    api.get("/api/rates/history").then((h) => {
      setHistory(h);
      setHistoryLoading(false);
    }).catch(() => setHistoryLoading(false));
  };

  useEffect(() => {
    loadRates();
  }, []);

  const handleTabChange = (newTab: "current" | "change" | "history") => {
    setTab(newTab);
    if (newTab === "history") loadHistory();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkrRate) { showToast("error", "نرخ روپیه یافت نشد"); return; }
    if (!buyRate || !sellRate) { showToast("error", "نرخ خرید و فروش الزامی است"); return; }
    setSubmitting(true);
    try {
      await api.post("/api/rates", {
        currencyId: pkrRate.currencyId,
        marketRate: marketRate.replace(/[^0-9]/g, "") || "0",
        buyRate: buyRate.replace(/[^0-9]/g, ""),
        sellRate: sellRate.replace(/[^0-9]/g, ""),
      });
      await loadRates();
      showToast("success", "نرخ روپیه بروزرسانی شد");
      setTimeout(() => setTab("current"), 1200);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "خطا");
    }
    setSubmitting(false);
  };

  const margin = (parseFloat(sellRate.replace(/[^0-9]/g, "") || "0") - parseFloat(buyRate.replace(/[^0-9]/g, "") || "0"));

  return (
    <main className="min-h-dvh bg-[#fafafa]">
      {toast && toast.type === "success" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 rounded-[5px] bg-white border border-gray-100 px-4 py-3 shadow-lg shadow-black/5 animate-slide-up">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
          <span className="text-[13px] font-medium text-gray-700">{toast.message}</span>
        </div>
      )}
      {toast && toast.type === "error" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 rounded-[5px] bg-white border border-gray-100 px-4 py-3 shadow-lg shadow-black/5 animate-slide-up max-w-[90vw]">
          <AlertCircle className="h-4.5 w-4.5 text-red-500 flex-shrink-0" />
          <span className="text-[13px] font-medium text-gray-700">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100/80">
        <div className="flex h-14 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => router.back()}
              className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <h1 className="text-[17px] font-bold tracking-tight text-gray-900">نرخ ارز</h1>
          </div>
          <BarChart3 className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3">
          <div className="flex gap-1.5">
            {([["current", "نرخ فعلی"], ["change", "تغییر نرخ"], ["history", "تاریخچه"]] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => handleTabChange(value)}
                className={cn(
                  "rounded-[5px] px-4 py-1.5 text-[11px] font-semibold transition-all duration-200 whitespace-nowrap",
                  tab === value
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

      {/* Content */}
      <div className="p-4 pb-24">
        {/* Current Rates */}
        {tab === "current" && (
          loading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-[5px] bg-white border border-gray-200/80 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-16 rounded-[5px]" />
                    <Skeleton className="h-16 rounded-[5px]" />
                    <Skeleton className="h-16 rounded-[5px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : rates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-[5px] bg-gray-50 mb-4">
                <TrendingUp className="h-7 w-7 text-gray-300" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-gray-400">نرخی ثبت نشده</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {rates.map((r) => {
                const isPKR = r.currency.code === "PKR";
                return (
                  <div key={r.id} className={cn("rounded-[5px] bg-white border p-4", isPKR ? "border-blue-200/80" : "border-gray-200/80")}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-[5px]", isPKR ? "bg-blue-50" : "bg-gray-50")}>
                          <TrendingUp className={cn("h-[18px] w-[18px]", isPKR ? "text-blue-500" : "text-gray-500")} strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900">{r.currency.name}</p>
                          <p className="text-[10px] text-gray-400" dir="ltr">{r.currency.code}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-300">{r.changedBy.firstName} {r.changedBy.lastName}</span>
                    </div>

                    {Number(r.marketRate) > 0 && (
                      <div className="rounded-[5px] bg-gray-50 p-3 text-center mb-2">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <TrendingUp className="h-3 w-3 text-gray-500" strokeWidth={1.5} />
                          <span className="text-[10px] text-gray-500 font-medium">نرخ بازار</span>
                        </div>
                        <p className="text-[15px] font-bold text-gray-700" dir="ltr">{Number(r.marketRate).toLocaleString("en-US")}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-[5px] bg-blue-50 p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <TrendingDown className="h-3 w-3 text-blue-500" strokeWidth={1.5} />
                          <span className="text-[10px] text-blue-500 font-medium">خرید</span>
                        </div>
                        <p className="text-[15px] font-bold text-blue-700" dir="ltr">{Number(r.buyRate).toLocaleString("en-US")}</p>
                      </div>
                      <div className="rounded-[5px] bg-emerald-50 p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <TrendingUp className="h-3 w-3 text-emerald-500" strokeWidth={1.5} />
                          <span className="text-[10px] text-emerald-500 font-medium">فروش</span>
                        </div>
                        <p className="text-[15px] font-bold text-emerald-700" dir="ltr">{Number(r.sellRate).toLocaleString("en-US")}</p>
                      </div>
                    </div>

                    <div className="mt-2 rounded-[5px] bg-emerald-50 border border-emerald-200/60 p-2.5 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-600 font-medium">حاشیه سود</span>
                      <span className="text-[11px] font-bold text-emerald-700" dir="ltr">{(Number(r.sellRate) - Number(r.buyRate)).toLocaleString("en-US")} <span className="text-[9px] font-normal text-emerald-500">تومان</span></span>
                    </div>

                    <div className="mt-2 flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3 text-gray-300" strokeWidth={1.5} />
                      <span className="text-[9px] text-gray-300">{new Date(r.createdAt).toLocaleDateString("fa-IR")} {new Date(r.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Change Rate */}
        {tab === "change" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Currency Info */}
            <div className="rounded-[5px] bg-blue-50 border border-blue-200/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-blue-100">
                  <TrendingUp className="h-[18px] w-[18px] text-blue-600" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-blue-900">روپیه پاکستان</p>
                  <p className="text-[10px] text-blue-500" dir="ltr">PKR</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-gray-400">نرخ بازار (تومان)</label>
              <Input
                type="text"
                inputMode="numeric"
                value={marketRate}
                onChange={(e) => setMarketRate(formatNum(e.target.value))}
                placeholder="0"
                className="h-12 rounded-[5px] text-left"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-gray-400">نرخ خرید (تومان) <span className="text-red-400">*</span></label>
              <Input
                type="text"
                inputMode="numeric"
                value={buyRate}
                onChange={(e) => setBuyRate(formatNum(e.target.value))}
                placeholder="0"
                className="h-12 rounded-[5px] text-left"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-gray-400">نرخ فروش (تومان) <span className="text-red-400">*</span></label>
              <Input
                type="text"
                inputMode="numeric"
                value={sellRate}
                onChange={(e) => setSellRate(formatNum(e.target.value))}
                placeholder="0"
                className="h-12 rounded-[5px] text-left"
                dir="ltr"
              />
            </div>

            {(buyRate || sellRate) && (
              <div className="rounded-[5px] bg-gray-50 p-4 space-y-2.5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">تحلیل نرخ</p>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-gray-500">حاشیه سود</span>
                  <span className="text-[13px] font-bold text-emerald-600" dir="ltr">{margin.toLocaleString("en-US")} <span className="text-[9px] font-normal text-emerald-400">تومان</span></span>
                </div>
                {marketRate && buyRate && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">فاصله با بازار (خرید)</span>
                    <span className="text-[12px] font-medium text-gray-700" dir="ltr">{(parseFloat(marketRate.replace(/[^0-9]/g, "") || "0") - parseFloat(buyRate.replace(/[^0-9]/g, "") || "0")).toLocaleString("en-US")} <span className="text-[9px] font-normal text-gray-400">تومان</span></span>
                  </div>
                )}
                {marketRate && sellRate && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">فاصله با بازار (فروش)</span>
                    <span className="text-[12px] font-medium text-gray-700" dir="ltr">{(parseFloat(sellRate.replace(/[^0-9]/g, "") || "0") - parseFloat(marketRate.replace(/[^0-9]/g, "") || "0")).toLocaleString("en-US")} <span className="text-[9px] font-normal text-gray-400">تومان</span></span>
                  </div>
                )}
              </div>
            )}

            <Button type="submit" isLoading={submitting} className="w-full h-12 rounded-[5px] bg-gray-900 hover:bg-gray-800">
              ذخیره نرخ روپیه
            </Button>
          </form>
        )}

        {/* History */}
        {tab === "history" && (
          historyLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-[5px] bg-white border border-gray-200/80 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-12 rounded-[5px]" />
                    <Skeleton className="h-12 rounded-[5px]" />
                    <Skeleton className="h-12 rounded-[5px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-[5px] bg-gray-50 mb-4">
                <History className="h-7 w-7 text-gray-300" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-gray-400">تاریخچه‌ای ثبت نشده</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {history.map((h) => (
                <div key={h.id} className="rounded-[5px] bg-white border border-gray-200/80 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-gray-50">
                        <Clock className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
                      </div>
                      <p className="text-[12px] font-semibold text-gray-900">{h.currency.name}</p>
                    </div>
                    <span className="text-[10px] text-gray-300">{new Date(h.createdAt).toLocaleDateString("fa-IR")} {new Date(h.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {Number(h.marketRate) > 0 && (
                      <div className="rounded-[5px] bg-gray-50 p-2.5 text-center">
                        <span className="text-[9px] text-gray-400 font-medium">بازار</span>
                        <p className="text-[12px] font-bold text-gray-700 mt-0.5" dir="ltr">{Number(h.marketRate).toLocaleString("en-US")}</p>
                      </div>
                    )}
                    <div className="rounded-[5px] bg-blue-50 p-2.5 text-center">
                      <span className="text-[9px] text-blue-500 font-medium">خرید</span>
                      <p className="text-[12px] font-bold text-blue-700 mt-0.5" dir="ltr">{Number(h.buyRate).toLocaleString("en-US")}</p>
                    </div>
                    <div className="rounded-[5px] bg-emerald-50 p-2.5 text-center">
                      <span className="text-[9px] text-emerald-500 font-medium">فروش</span>
                      <p className="text-[12px] font-bold text-emerald-700 mt-0.5" dir="ltr">{Number(h.sellRate).toLocaleString("en-US")}</p>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-center">
                    <span className="text-[9px] text-gray-300">{h.changedBy.firstName} {h.changedBy.lastName}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </main>
  );
}
