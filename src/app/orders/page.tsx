"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Order {
  id: string; orderType: string; status: string; amount: bigint; rate: bigint; totalToman: bigint; fee: bigint;
  createdAt: string; customer: { name: string }; currency: { code: string }; user: { firstName: string; lastName: string };
}

const typeLabels: Record<string, { label: string; color: string; icon: typeof ArrowDownToLine }> = {
  IR_TO_PK: { label: "حواله ایران→پاکستان", color: "text-blue-600", icon: ArrowDownToLine },
  PK_TO_IR: { label: "حواله پاکستان→ایران", color: "text-emerald-600", icon: ArrowUpFromLine },
  BUY_PKR: { label: "خرید روپیه", color: "text-violet-600", icon: ArrowDownToLine },
  SELL_PKR: { label: "فروش روپیه", color: "text-amber-600", icon: ArrowUpFromLine },
};

const statusLabels: Record<string, string> = {
  DRAFT: "پیش‌نویس", REGISTERED: "ثبت شده", TOMAN_RECEIVED: "تومان دریافت",
  AWAITING_PKR_TRANSFER: "انتظار روپیه", PKR_TRANSFERRED: "روپیه واریز",
  IN_PROGRESS: "در حال انجام", COMPLETED: "تکمیل", CANCELLED: "لغو",
};
const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600", REGISTERED: "bg-blue-50 text-blue-600",
  TOMAN_RECEIVED: "bg-amber-50 text-amber-600", AWAITING_PKR_TRANSFER: "bg-violet-50 text-violet-600",
  PKR_TRANSFERRED: "bg-cyan-50 text-cyan-600", IN_PROGRESS: "bg-indigo-50 text-indigo-600",
  COMPLETED: "bg-green-50 text-green-600", CANCELLED: "bg-red-50 text-red-600",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | string>("all");

  useEffect(() => {
    const params = filter === "all" ? "" : `?status=${filter}`;
    api.get(`/api/orders${params}`).then((data) => { setOrders(data); setLoading(false); }).catch(() => setLoading(false));
  }, [filter]);

  const handleStatus = async (id: string, status: string) => {
    try {
      await api.patch("/api/orders", { id, status });
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    } catch {}
  };

  const getNextAction = (status: string, orderType: string) => {
    if (orderType === "IR_TO_PK") {
      if (status === "REGISTERED") return { label: "تومان دریافت شد", next: "TOMAN_RECEIVED" };
      if (status === "TOMAN_RECEIVED") return { label: "روپیه واریز شد", next: "PKR_TRANSFERRED" };
      if (status === "PKR_TRANSFERRED") return { label: "تکمیل", next: "COMPLETED" };
    }
    if (orderType === "PK_TO_IR") {
      if (status === "REGISTERED") return { label: "روپیه دریافت شد", next: "TOMAN_RECEIVED" };
      if (status === "TOMAN_RECEIVED") return { label: "تومان پرداخت شد", next: "PKR_TRANSFERRED" };
      if (status === "PKR_TRANSFERRED") return { label: "تکمیل", next: "COMPLETED" };
    }
    if (orderType === "BUY_PKR") {
      if (status === "REGISTERED") return { label: "روپیه دریافت شد", next: "TOMAN_RECEIVED" };
      if (status === "TOMAN_RECEIVED") return { label: "تومان پرداخت شد", next: "PKR_TRANSFERRED" };
      if (status === "PKR_TRANSFERRED") return { label: "تکمیل", next: "COMPLETED" };
    }
    if (orderType === "SELL_PKR") {
      if (status === "REGISTERED") return { label: "تومان دریافت شد", next: "TOMAN_RECEIVED" };
      if (status === "TOMAN_RECEIVED") return { label: "روپیه تحویل شد", next: "PKR_TRANSFERRED" };
      if (status === "PKR_TRANSFERRED") return { label: "تکمیل", next: "COMPLETED" };
    }
    return null;
  };

  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white">
        <div className="flex h-12 items-center justify-between px-4">
          <h1 className="text-sm font-semibold text-gray-900">سفارشات</h1>
          <Link href="/orders/new" className="flex h-7 items-center gap-1 rounded-lg bg-gray-900 px-2 text-[10px] text-white"><Plus className="h-3 w-3" strokeWidth={2} />جدید</Link>
        </div>
        <div className="flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {([["all", "همه"], ["COMPLETED", "تکمیل"], ["REGISTERED", "ثبت شده"], ["TOMAN_RECEIVED", "دریافت"], ["IN_PROGRESS", "انجام"]] as const).map(([value, label]) => (
            <button key={value} onClick={() => setFilter(value)} className={cn("rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-colors whitespace-nowrap", filter === value ? "bg-gray-900 text-white" : "text-gray-400")}>{label}</button>
          ))}
        </div>
      </div>
      <div className="p-4">
        {loading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="rounded-xl border border-gray-100 p-3"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Skeleton className="h-4 w-4" /><Skeleton className="h-3 w-28" /></div><Skeleton className="h-4 w-16 rounded-md" /></div><div className="flex items-center justify-between mb-1"><Skeleton className="h-2.5 w-20" /><Skeleton className="h-2.5 w-28" /></div><div className="flex items-center justify-between mb-2"><Skeleton className="h-2.5 w-16" /><Skeleton className="h-3 w-24" /></div><div className="flex gap-1"><Skeleton className="h-7 flex-1 rounded-lg" /><Skeleton className="h-7 w-12 rounded-lg" /></div></div>))}</div> : orders.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-300">سفارشی ثبت نشده</div>
        ) : (
          <div className="space-y-3">{orders.map((o) => {
            const typeInfo = typeLabels[o.orderType] || { label: o.orderType, color: "text-gray-600", icon: ArrowDownToLine };
            const Icon = typeInfo.icon;
            const nextAction = getNextAction(o.status, o.orderType);
            return (
              <div key={o.id} className="rounded-xl border border-gray-100 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", typeInfo.color)} strokeWidth={1.5} />
                    <span className="text-xs font-medium text-gray-900">{typeInfo.label}</span>
                  </div>
                  <span className={cn("rounded-md px-1.5 py-0.5 text-[9px] font-medium", statusColors[o.status])}>{statusLabels[o.status]}</span>
                </div>
                <div className="flex items-center justify-between mb-1"><span className="text-[10px] text-gray-400">{o.customer.name}</span><span className="text-[10px] text-gray-400">{Number(o.amount).toLocaleString("en-US")} × {Number(o.rate).toLocaleString("en-US")}</span></div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-gray-400">{new Date(o.createdAt).toLocaleDateString("fa-IR")}</span>
                  <span className="text-xs font-bold text-gray-900" dir="ltr">{Number(o.totalToman).toLocaleString("en-US")} تومان</span>
                </div>
                {o.status !== "COMPLETED" && o.status !== "CANCELLED" && (
                  <div className="flex gap-1">
                    {nextAction && <button onClick={() => handleStatus(o.id, nextAction.next)} className="flex-1 rounded-lg bg-green-50 py-1.5 text-[10px] font-medium text-green-600">{nextAction.label}</button>}
                    <button onClick={() => handleStatus(o.id, "CANCELLED")} className="rounded-lg bg-red-50 px-3 py-1.5 text-[10px] font-medium text-red-600">لغو</button>
                  </div>
                )}
              </div>
            );
          })}</div>
        )}
      </div>
    </main>
  );
}
