"use client";

import { useState, useEffect } from "react";
import { BarChart3, Users, ArrowUpRight, TrendingUp, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Tab = "summary" | "byEmployee" | "byTransaction";

interface Transaction {
  id: string;
  type: string;
  currency: string;
  amount: bigint;
  totalToman: bigint;
  profit: bigint;
  createdAt: string;
  customer: { name: string };
  user: { firstName: string; lastName: string };
}

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("summary");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get("/api/transactions").then((data) => { setTransactions(data); setLoading(false); }).catch(() => setLoading(false)); }, []);

  if (loading) return <main className="min-h-dvh bg-white flex items-center justify-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" /></main>;

  const totalProfit = transactions.reduce((s, t) => s + Number(t.profit), 0);
  const totalVolume = transactions.reduce((s, t) => s + Number(t.totalToman), 0);

  const employeeMap = new Map<string, { profit: number; count: number }>();
  transactions.forEach((t) => {
    const name = `${t.user.firstName} ${t.user.lastName}`;
    const existing = employeeMap.get(name) || { profit: 0, count: 0 };
    existing.profit += Number(t.profit);
    existing.count += 1;
    employeeMap.set(name, existing);
  });
  const profitByEmployee = Array.from(employeeMap.entries()).map(([name, data]) => ({ name, ...data }));
  const maxProfit = Math.max(...profitByEmployee.map((e) => e.profit), 1);

  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white">
        <div className="flex h-12 items-center px-4">
          <h1 className="text-sm font-semibold text-gray-900">سود و زیان</h1>
        </div>
        <div className="flex gap-1 px-4 pb-2">
          {([["summary", "خلاصه", BarChart3], ["byEmployee", "کارمند", Users], ["byTransaction", "معامله", ArrowUpRight]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className={cn("flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium transition-colors", tab === id ? "bg-gray-900 text-white" : "text-gray-400")}>
              <Icon className="h-3 w-3" strokeWidth={1.5} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {tab === "summary" && (
          <>
            <div className="bg-green-600 rounded-xl p-4 text-white">
              <div className="flex items-center gap-1.5 mb-0.5">
                <TrendingUp className="h-4 w-4 opacity-70" strokeWidth={1.5} />
                <span className="text-xs opacity-70">سود کل</span>
              </div>
              <p className="text-2xl font-bold" dir="ltr">{totalProfit.toLocaleString("en-US")}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center gap-1 mb-1">
                  <Calendar className="h-3 w-3 text-gray-300" strokeWidth={1.5} />
                  <span className="text-[10px] text-gray-300">حجم</span>
                </div>
                <p className="text-sm font-bold text-gray-800" dir="ltr">{(totalVolume / 1000000).toFixed(0)}M</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center gap-1 mb-1">
                  <BarChart3 className="h-3 w-3 text-gray-300" strokeWidth={1.5} />
                  <span className="text-[10px] text-gray-300">تعداد</span>
                </div>
                <p className="text-sm font-bold text-gray-800">{transactions.length}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider mb-2 px-1">سود هر معامله</p>
              <div className="space-y-0">
                {transactions.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 -mx-4 px-4">
                    <div>
                      <span className="text-xs text-gray-900">{t.customer.name}</span>
                      <span className="text-[10px] text-gray-300 mr-1.5">{t.type === "buy" ? "خرید" : "فروش"}</span>
                    </div>
                    <span className="text-xs font-semibold text-green-600" dir="ltr">+{Number(t.profit).toLocaleString("en-US")}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "byEmployee" && (
          <div className="space-y-3">
            {profitByEmployee.length === 0 ? <p className="text-center text-xs text-gray-300 py-4">داده‌ای موجود نیست</p> : profitByEmployee.map((emp) => (
              <div key={emp.name} className="rounded-xl border border-gray-100 p-3">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-xs font-bold text-violet-600">{emp.name.charAt(0)}</div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900">{emp.name}</p>
                    <p className="text-[10px] text-gray-300">{emp.count} معامله</p>
                  </div>
                  <span className="text-sm font-bold text-green-600" dir="ltr">+{emp.profit.toLocaleString("en-US")}</span>
                </div>
                <div className="h-1 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-green-400" style={{ width: `${Math.max(8, (emp.profit / maxProfit) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "byTransaction" && (
          <div className="space-y-0">
            {transactions.length === 0 ? <p className="text-center text-xs text-gray-300 py-4">داده‌ای موجود نیست</p> : transactions.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 -mx-4 px-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-900">{t.customer.name}</span>
                    <span className="text-[10px] text-gray-300">{new Date(t.createdAt).toLocaleDateString("fa-IR")}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[10px] text-gray-400">{t.type === "buy" ? "خرید" : "فروش"} · {t.user.firstName} {t.user.lastName}</span>
                    <span className="text-xs font-semibold text-green-600" dir="ltr">+{Number(t.profit).toLocaleString("en-US")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
