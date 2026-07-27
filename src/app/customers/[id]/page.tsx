"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Phone, ArrowUpLeft, ArrowDownRight } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  phone: string;
  totalTransactions: number;
  totalBuy: bigint;
  totalSell: bigint;
  debt: bigint;
}

interface Transaction {
  id: string;
  type: string;
  currency: string;
  amount: bigint;
  rate: bigint;
  totalToman: bigint;
  profit: bigint;
  createdAt: string;
  customer: { id: string; name: string; };
  user: { id: string; firstName: string; lastName: string; };
}

const currencyNames: Record<string, string> = { PKR: "روپیه پاکستان", USD: "دلار آمریکا", EUR: "یورو" };

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get(`/api/customers?id=${id}`),
      api.get(`/api/transactions?customerId=${id}`)
    ]).then(([customers, txs]) => {
      const found = customers.find((c: Customer) => c.id === id);
      setCustomer(found || null);
      setTransactions(txs);
      setLoading(false);
    }).catch((err) => { setError(err.message); setLoading(false); });
  }, [id]);

  if (loading) return <main className="flex min-h-dvh items-center justify-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" /></main>;

  if (error || !customer) {
    return <main className="flex min-h-dvh items-center justify-center"><p className="text-sm text-gray-400">{error || "یافت نشد"}</p></main>;
  }

  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-gray-100 bg-white px-4">
        <button onClick={() => router.back()} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-50">
          <ChevronRight className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
        </button>
        <h1 className="text-sm font-semibold text-gray-900">جزئیات مشتری</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-lg font-bold">{customer.name.charAt(0)}</div>
            <div>
              <h2 className="text-sm font-bold">{customer.name}</h2>
              <div className="flex items-center gap-1 text-xs opacity-70">
                <Phone className="h-3 w-3" strokeWidth={1.5} />
                {customer.phone}
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-white/10 p-2.5 text-center">
              <p className="text-[10px] opacity-60">تعداد</p>
              <p className="text-base font-bold">{customer.totalTransactions}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-2.5 text-center">
              <p className="text-[10px] opacity-60">بدهی</p>
              <p className="text-base font-bold">{Number(customer.debt) > 0 ? Number(customer.debt).toLocaleString("en-US") : "تسویه"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-gray-100 p-3 text-center">
            <p className="text-[10px] text-gray-300">مجموع خرید</p>
            <p className="text-sm font-bold text-blue-600" dir="ltr">{(Number(customer.totalBuy) / 1000000).toFixed(0)}M</p>
          </div>
          <div className="rounded-lg border border-gray-100 p-3 text-center">
            <p className="text-[10px] text-gray-300">مجموع فروش</p>
            <p className="text-sm font-bold text-emerald-600" dir="ltr">{(Number(customer.totalSell) / 1000000).toFixed(0)}M</p>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider mb-2 px-1">تاریخچه</h3>
          {transactions.length === 0 ? (
            <p className="text-center text-xs text-gray-300 py-6">بدون معامله</p>
          ) : (
            <div className="space-y-0">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 -mx-4 px-4">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", t.type === "buy" ? "bg-blue-50" : "bg-emerald-50")}>
                    {t.type === "buy" ? <ArrowDownRight className="h-3.5 w-3.5 text-blue-600" strokeWidth={1.5} /> : <ArrowUpLeft className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.5} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-gray-900">{t.type === "buy" ? "خرید" : "فروش"} {currencyNames[t.currency]}</span>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-gray-300">{Number(t.amount).toLocaleString("en-US")}</span>
                      <span className="text-[10px] text-gray-300">{new Date(t.createdAt).toLocaleDateString("fa-IR")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
