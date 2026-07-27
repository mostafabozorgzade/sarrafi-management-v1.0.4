"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Transaction { id: string; type: string; currency: { code: string; name: string }; amount: bigint; rate: bigint; totalToman: bigint; profit: bigint; createdAt: string; customer: { name: string }; user: { firstName: string; lastName: string } }

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "buy" | "sell">("all");

  useEffect(() => { api.get(`/api/transactions?type=${filter}`).then((data) => { setTransactions(data); setLoading(false); }).catch(() => setLoading(false)); }, [filter]);

  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white">
        <div className="flex h-12 items-center px-4"><h1 className="text-sm font-semibold text-gray-900">معاملات</h1></div>
        <div className="flex gap-1 px-4 pb-2">
          {([["all", "همه"], ["buy", "خرید"], ["sell", "فروش"]] as const).map(([value, label]) => (
            <button key={value} onClick={() => setFilter(value)} className={cn("flex-1 rounded-md py-1.5 text-xs font-medium transition-colors", filter === value ? "bg-gray-900 text-white" : "text-gray-400")}>{label}</button>
          ))}
        </div>
      </div>
      <div className="p-4">
        {loading ? <div className="py-8 text-center text-xs text-gray-300">بارگذاری...</div> : transactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-300">معامله‌ای ثبت نشده</div>
        ) : (
          <div className="space-y-0">{transactions.map((t) => (
            <Link key={t.id} href={`/transactions/${t.id}`} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 active:bg-gray-50 -mx-4 px-4">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", t.type === "buy" ? "bg-blue-50" : "bg-emerald-50")}>
                {t.type === "buy" ? <ArrowDownToLine className="h-3.5 w-3.5 text-blue-600" strokeWidth={1.5} /> : <ArrowUpFromLine className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.5} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-900">{t.type === "buy" ? "خرید" : "فروش"} {t.currency.code}</span><span className="text-[10px] text-gray-300">{new Date(t.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span></div>
                <div className="flex items-center justify-between mt-0.5"><span className="text-[11px] text-gray-400">{t.customer.name} · {t.user.firstName}</span><span className="text-[10px] font-medium text-green-600" dir="ltr">+{Number(t.profit).toLocaleString("en-US")}</span></div>
              </div>
            </Link>
          ))}</div>
        )}
      </div>
    </main>
  );
}
