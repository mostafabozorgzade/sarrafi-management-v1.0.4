"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, CheckCircle2, Clock, History } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { cn } from "@/lib/utils";

interface Currency { id: string; code: string; name: string; }
interface Rate {
  id: string; currencyId: string; marketRate: bigint; buyRate: bigint; sellRate: bigint;
  createdAt: string; currency: { code: string; name: string };
  changedBy: { firstName: string; lastName: string };
}
interface RateHistoryEntry {
  id: string; marketRate: bigint; buyRate: bigint; sellRate: bigint;
  createdAt: string; currency: { code: string; name: string };
  changedBy: { firstName: string; lastName: string };
}

export default function RatesPage() {
  const [tab, setTab] = useState<"current" | "change" | "history">("current");
  const [rates, setRates] = useState<Rate[]>([]);
  const [history, setHistory] = useState<RateHistoryEntry[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [currencyId, setCurrencyId] = useState("");
  const [marketRate, setMarketRate] = useState("");
  const [buyRate, setBuyRate] = useState("");
  const [sellRate, setSellRate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/api/rates"), api.get("/api/currencies")]).then(([r, c]) => {
      setRates(r);
      setCurrencies(c);
      if (c.length > 0) setCurrencyId(c[0].id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const loadHistory = () => {
    api.get("/api/rates/history").then((h) => setHistory(h)).catch(() => {});
  };

  const handleTabChange = (newTab: "current" | "change" | "history") => {
    setTab(newTab);
    if (newTab === "history") loadHistory();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!currencyId || !buyRate || !sellRate) { setError("نرخ خرید و فروش الزامی است"); return; }
    try {
      await api.post("/api/rates", { currencyId, marketRate: marketRate || "0", buyRate, sellRate });
      setSuccess(true);
      const updated = await api.get("/api/rates");
      setRates(updated);
      setTimeout(() => { setSuccess(false); setTab("current"); }, 1500);
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
  };

  const margin = (parseFloat(sellRate || "0") - parseFloat(buyRate || "0"));

  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white">
        <div className="flex h-12 items-center px-4"><h1 className="text-sm font-semibold text-gray-900">نرخ ارز</h1></div>
        <div className="flex gap-1 px-4 pb-2">
          <button onClick={() => handleTabChange("current")} className={cn("flex-1 rounded-md py-1.5 text-xs font-medium transition-colors", tab === "current" ? "bg-gray-900 text-white" : "text-gray-400")}>نرخ فعلی</button>
          <button onClick={() => handleTabChange("change")} className={cn("flex-1 rounded-md py-1.5 text-xs font-medium transition-colors", tab === "change" ? "bg-gray-900 text-white" : "text-gray-400")}>تغییر نرخ</button>
          <button onClick={() => handleTabChange("history")} className={cn("flex-1 rounded-md py-1.5 text-xs font-medium transition-colors", tab === "history" ? "bg-gray-900 text-white" : "text-gray-400")}>تاریخچه</button>
        </div>
      </div>
      <div className="p-4">
        {tab === "current" && (loading ? <div className="py-8 text-center text-xs text-gray-300">بارگذاری...</div> : rates.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-300">نرخی ثبت نشده</div>
        ) : rates.map((r) => (
          <div key={r.id} className="rounded-xl border border-gray-100 p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-900">{r.currency.name}</h3>
              <span className="text-[10px] text-gray-300">{r.changedBy.firstName} {r.changedBy.lastName}</span>
            </div>
            {Number(r.marketRate) > 0 && (
              <div className="rounded-lg bg-gray-50 p-3 text-center mb-2">
                <div className="flex items-center justify-center gap-1 mb-0.5"><TrendingUp className="h-3 w-3 text-gray-500" strokeWidth={1.5} /><span className="text-[10px] text-gray-500">نرخ بازار</span></div>
                <p className="text-lg font-bold text-gray-700" dir="ltr">{Number(r.marketRate).toLocaleString("en-US")}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5"><TrendingDown className="h-3 w-3 text-blue-500" strokeWidth={1.5} /><span className="text-[10px] text-blue-500">خرید</span></div>
                <p className="text-lg font-bold text-blue-700" dir="ltr">{Number(r.buyRate).toLocaleString("en-US")}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5"><TrendingUp className="h-3 w-3 text-emerald-500" strokeWidth={1.5} /><span className="text-[10px] text-emerald-500">فروش</span></div>
                <p className="text-lg font-bold text-emerald-700" dir="ltr">{Number(r.sellRate).toLocaleString("en-US")}</p>
              </div>
            </div>
            <div className="mt-2 rounded-lg bg-green-50 p-2 flex items-center justify-between">
              <span className="text-[10px] text-green-600">حاشیه سود</span>
              <span className="text-xs font-semibold text-green-700">{(Number(r.sellRate) - Number(r.buyRate)).toLocaleString("en-US")} تومان</span>
            </div>
            <div className="mt-1.5 text-center">
              <span className="text-[9px] text-gray-300">{new Date(r.createdAt).toLocaleDateString("fa-IR")} {new Date(r.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>
        )))}

        {tab === "change" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorAlert message={error} />}
            {success && <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-600"><CheckCircle2 className="h-4 w-4" />نرخ بروزرسانی شد</div>}
            <div className="space-y-1"><label className="text-xs font-medium text-gray-500">ارز</label>
              <select value={currencyId} onChange={(e) => { setCurrencyId(e.target.value); const r = rates.find((x) => x.currencyId === e.target.value); setMarketRate(r ? String(r.marketRate) : ""); setBuyRate(r ? String(r.buyRate) : ""); setSellRate(r ? String(r.sellRate) : ""); }} className="flex h-12 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-blue-500">
                {currencies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
            <div className="space-y-1"><label className="text-xs font-medium text-gray-500">نرخ بازار (تومان)</label><Input type="number" value={marketRate} onChange={(e) => setMarketRate(e.target.value)} placeholder="0" className="h-12 text-left" inputMode="numeric" /></div>
            <div className="space-y-1"><label className="text-xs font-medium text-gray-500">نرخ خرید (تومان)</label><Input type="number" value={buyRate} onChange={(e) => setBuyRate(e.target.value)} placeholder="0" className="h-12 text-left" inputMode="numeric" /></div>
            <div className="space-y-1"><label className="text-xs font-medium text-gray-500">نرخ فروش (تومان)</label><Input type="number" value={sellRate} onChange={(e) => setSellRate(e.target.value)} placeholder="0" className="h-12 text-left" inputMode="numeric" /></div>
            {buyRate && sellRate && <div className="rounded-lg bg-gray-50 p-3 space-y-1">
              <div className="flex items-center justify-between"><span className="text-xs text-gray-500">حاشیه سود</span><span className="text-sm font-bold text-green-600">{margin.toLocaleString("en-US")} تومان</span></div>
              {marketRate && <div className="flex items-center justify-between"><span className="text-xs text-gray-500">فاصله با بازار (خرید)</span><span className="text-xs text-gray-600">{(parseFloat(marketRate) - parseFloat(buyRate)).toLocaleString("en-US")} تومان</span></div>}
              {marketRate && <div className="flex items-center justify-between"><span className="text-xs text-gray-500">فاصله با بازار (فروش)</span><span className="text-xs text-gray-600">{(parseFloat(sellRate) - parseFloat(marketRate)).toLocaleString("en-US")} تومان</span></div>}
            </div>}
            <Button type="submit" isLoading={false} className="w-full h-12">ثبت نرخ جدید</Button>
          </form>
        )}

        {tab === "history" && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
              <span className="text-xs font-medium text-gray-500">تاریخچه تغییرات نرخ</span>
            </div>
            {history.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-300">تاریخچه‌ای ثبت نشده</div>
            ) : (
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-medium text-gray-900">{h.currency.name}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-300" strokeWidth={1.5} />
                        <span className="text-[9px] text-gray-300">{new Date(h.createdAt).toLocaleDateString("fa-IR")} {new Date(h.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {Number(h.marketRate) > 0 && (
                        <div className="rounded-lg bg-gray-50 p-2 text-center">
                          <span className="text-[8px] text-gray-400">بازار</span>
                          <p className="text-[11px] font-bold text-gray-700" dir="ltr">{Number(h.marketRate).toLocaleString("en-US")}</p>
                        </div>
                      )}
                      <div className="rounded-lg bg-blue-50 p-2 text-center">
                        <span className="text-[8px] text-blue-500">خرید</span>
                        <p className="text-[11px] font-bold text-blue-700" dir="ltr">{Number(h.buyRate).toLocaleString("en-US")}</p>
                      </div>
                      <div className="rounded-lg bg-emerald-50 p-2 text-center">
                        <span className="text-[8px] text-emerald-500">فروش</span>
                        <p className="text-[11px] font-bold text-emerald-700" dir="ltr">{Number(h.sellRate).toLocaleString("en-US")}</p>
                      </div>
                    </div>
                    <div className="mt-1.5 text-center">
                      <span className="text-[9px] text-gray-300">{h.changedBy.firstName} {h.changedBy.lastName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
