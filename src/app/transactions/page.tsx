"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpLeft, ArrowDownRight, Search, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string; type: string; currency: string; amount: bigint; rate: bigint;
  totalToman: bigint; profit: bigint; createdAt: string;
  customer: { name: string }; user: { firstName: string; lastName: string };
}

const currencyNames: Record<string, string> = { PKR: "روپیه", USD: "دلار", EUR: "یورو" };

export default function TransactionsPage() {
  const [typeFilter, setTypeFilter] = useState<"all" | "buy" | "sell">("all");
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (typeFilter !== "all") params.set("type", typeFilter);
    api.get(`/api/transactions?${params}`).then((data) => { setTransactions(data); setLoading(false); }).catch(() => setLoading(false));
  }, [typeFilter]);

  const filtered = transactions.filter((t) => !search || t.customer.name.includes(search));

  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white">
        <div className="flex h-12 items-center justify-between px-4">
          <h1 className="text-sm font-semibold text-gray-900">معاملات</h1>
          <div className="flex gap-1">
            <Link href="/transactions/buy" className="flex h-6 items-center gap-1 rounded-md bg-blue-600 px-2 text-[9px] font-medium text-white"><Plus className="h-2.5 w-2.5" strokeWidth={2} />خرید</Link>
            <Link href="/transactions/sell" className="flex h-6 items-center gap-1 rounded-md bg-emerald-600 px-2 text-[9px] font-medium text-white"><Plus className="h-2.5 w-2.5" strokeWidth={2} />فروش</Link>
          </div>
        </div>
        <div className="px-4 pb-2">
          <div className="relative"><Search className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300" strokeWidth={1.5} /><input type="text" placeholder="جستجو..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pr-8 pl-3 text-xs placeholder:text-gray-300 focus:outline-none focus:border-blue-500" /></div>
        </div>
        <div className="flex gap-1 px-4 pb-2">
          {(["all", "buy", "sell"] as const).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)} className={cn("rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors", typeFilter === t ? "bg-blue-600 text-white" : "text-gray-400")}>
              {t === "all" ? "همه" : t === "buy" ? "خرید" : "فروش"}
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 py-3">
        {loading ? <div className="py-8 text-center text-xs text-gray-300">بارگذاری...</div> : filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-300">معامله‌ای ثبت نشده</div>
        ) : <div className="space-y-0">{filtered.map((t) => (
          <Link key={t.id} href={`/transactions/${t.id}`} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 active:bg-gray-50 -mx-4 px-4">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", t.type === "buy" ? "bg-blue-50" : "bg-emerald-50")}>
              {t.type === "buy" ? <ArrowDownRight className="h-4 w-4 text-blue-600" strokeWidth={1.5} /> : <ArrowUpLeft className="h-4 w-4 text-emerald-600" strokeWidth={1.5} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-900">{t.type === "buy" ? "خرید" : "فروش"} {currencyNames[t.currency] || t.currency}</span><span className="text-[10px] text-gray-300">{t.id.slice(0, 8)}</span></div>
              <div className="flex items-center justify-between mt-0.5"><span className="text-[11px] text-gray-400">{t.customer.name}</span><span className="text-xs font-semibold text-gray-800" dir="ltr">{Number(t.totalToman).toLocaleString("en-US")}</span></div>
              <div className="flex items-center justify-between mt-0.5"><span className="text-[10px] text-gray-300">{new Date(t.createdAt).toLocaleDateString("fa-IR")}</span><span className="text-[10px] text-green-500 font-medium">سود: {Number(t.profit).toLocaleString("en-US")}</span></div>
            </div>
          </Link>
        ))}</div>}
      </div>
    </main>
  );
}
