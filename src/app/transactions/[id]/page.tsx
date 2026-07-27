"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ArrowDownRight, ArrowUpLeft } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: string;
  currency: { code: string; name: string };
  amount: bigint;
  rate: bigint;
  totalToman: bigint;
  profit: bigint;
  description: string | null;
  createdAt: string;
  customer: { id: string; name: string };
  user: { id: string; firstName: string; lastName: string };
}

export default function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/api/transactions`).then((data: Transaction[]) => {
      setTx(data.find((t) => t.id === id) || null);
      setLoading(false);
    }).catch((err) => { setError(err.message); setLoading(false); });
  }, [id]);

  if (loading) return <main className="flex min-h-dvh items-center justify-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" /></main>;
  if (error || !tx) return <main className="flex min-h-dvh items-center justify-center"><p className="text-sm text-gray-400">{error || "یافت نشد"}</p></main>;

  const rows = [
    { label: "شماره", value: tx.id.slice(0, 8) },
    { label: "مشتری", value: tx.customer.name },
    { label: "نوع", value: tx.type === "buy" ? "خرید" : "فروش" },
    { label: "ارز", value: tx.currency.code },
    { label: "مقدار", value: `${Number(tx.amount).toLocaleString("en-US")} ${tx.currency.code}` },
    { label: "نرخ", value: `${Number(tx.rate).toLocaleString("en-US")} تومان` },
    { label: "مبلغ کل", value: `${Number(tx.totalToman).toLocaleString("en-US")} تومان` },
    { label: "سود", value: `${Number(tx.profit).toLocaleString("en-US")} تومان` },
    { label: "ثبت‌کننده", value: `${tx.user.firstName} ${tx.user.lastName}` },
    { label: "تاریخ", value: new Date(tx.createdAt).toLocaleDateString("fa-IR") },
    { label: "ساعت", value: new Date(tx.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }) },
  ];

  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-gray-100 bg-white px-4">
        <button onClick={() => router.back()} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-50">
          <ChevronRight className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
        </button>
        <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", tx.type === "buy" ? "bg-blue-50" : "bg-emerald-50")}>
          {tx.type === "buy" ? <ArrowDownRight className="h-3 w-3 text-blue-600" strokeWidth={1.5} /> : <ArrowUpLeft className="h-3 w-3 text-emerald-600" strokeWidth={1.5} />}
        </div>
        <h1 className="text-sm font-semibold text-gray-900">{tx.type === "buy" ? "خرید" : "فروش"} {tx.currency.code}</h1>
      </div>
      <div className="p-4 space-y-4">
        <div className={cn("rounded-xl p-4 text-white", tx.type === "buy" ? "bg-blue-600" : "bg-emerald-600")}>
          <p className="text-xs opacity-70">مبلغ کل</p>
          <p className="text-xl font-bold mt-0.5" dir="ltr">{Number(tx.totalToman).toLocaleString("en-US")} تومان</p>
          <p className="text-xs opacity-60 mt-1">{Number(tx.amount).toLocaleString("en-US")} × {Number(tx.rate).toLocaleString("en-US")}</p>
        </div>
        <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-gray-400">{row.label}</span>
              <span className="text-xs font-medium text-gray-900" dir="ltr">{row.value}</span>
            </div>
          ))}
        </div>
        {tx.description && (
          <div className="rounded-xl border border-gray-100 p-4">
            <p className="text-[10px] text-gray-300 mb-1">توضیحات</p>
            <p className="text-xs text-gray-600">{tx.description}</p>
          </div>
        )}
      </div>
    </main>
  );
}
