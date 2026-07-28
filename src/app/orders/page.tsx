"use client";

import { useState, useEffect } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  Coins,
  Plus,
  Clock,
  CheckCircle2,
  CreditCard,
  User,
  FileText,
  ChevronLeft,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";

interface Order {
  id: string;
  orderType: string;
  status: string;
  amount: bigint;
  rate: bigint;
  totalToman: bigint;
  fee: bigint;
  calculatedPkr: bigint | null;
  profit: bigint | null;
  recipientName: string | null;
  recipientAccount: string | null;
  recipientMethod: string | null;
  destinationCard: string | null;
  destinationSheba: string | null;
  description: string | null;
  createdAt: string;
  customer: { name: string; phone: string };
  currency: { code: string; name: string };
  user: { firstName: string; lastName: string };
}

interface Customer { id: string; name: string; phone: string }
interface Rate { id: string; currencyId: string; buyRate: string; sellRate: string; currency: { code: string } }

const orderTypes = [
  { id: "IR_TO_PK", label: "حواله ایران → پاکستان", desc: "تومان دریافت، روپیه واریز", icon: ArrowDownToLine, color: "bg-blue-50 text-blue-600" },
  { id: "PK_TO_IR", label: "حواله پاکستان → ایران", desc: "روپیه دریافت، تومان پرداخت", icon: ArrowUpFromLine, color: "bg-emerald-50 text-emerald-600" },
  { id: "BUY_PKR", label: "خرید روپیه", desc: "خرید روپیه از مشتری", icon: Banknote, color: "bg-violet-50 text-violet-600" },
  { id: "SELL_PKR", label: "فروش روپیه", desc: "فروش روپیه به مشتری", icon: Coins, color: "bg-amber-50 text-amber-600" },
] as const;

type OrderType = typeof orderTypes[number]["id"];

const typeLabels: Record<string, { label: string; color: string; icon: typeof ArrowDownToLine }> = {
  IR_TO_PK: { label: "حواله ایران→پاکستان", color: "text-blue-600", icon: ArrowDownToLine },
  PK_TO_IR: { label: "حواله پاکستان→ایران", color: "text-emerald-600", icon: ArrowUpFromLine },
  BUY_PKR: { label: "خرید روپیه", color: "text-violet-600", icon: Banknote },
  SELL_PKR: { label: "فروش روپیه", color: "text-amber-600", icon: Coins },
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

const methodLabels: Record<string, string> = {
  EASYPAISA: "Easypaisa", JAZZCASH: "JazzCash", BANK_TRANSFER: "حواله بانکی", CASH: "نقدی", HAWALA: "حواله",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | string>("all");

  const [typeSheetOpen, setTypeSheetOpen] = useState(false);
  const [formSheetOpen, setFormSheetOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<OrderType | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [fee, setFee] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientAccount, setRecipientAccount] = useState("");
  const [recipientMethod, setRecipientMethod] = useState("EASYPAISA");
  const [destinationCard, setDestinationCard] = useState("");
  const [destinationSheba, setDestinationSheba] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = filter === "all" ? "" : `?status=${filter}`;
    api.get(`/api/orders${params}`).then((data) => { setOrders(data); setLoading(false); }).catch(() => setLoading(false));
  }, [filter]);

  const loadFormData = () => {
    Promise.all([api.get("/api/customers"), api.get("/api/currencies"), api.get("/api/rates")]).then(([c, cur, rates]) => {
      setCustomers(c);
      if (c.length > 0) setCustomerId(c[0].id);
      const pkrCurrency = cur.find((x: { code: string; id: string }) => x.code === "PKR");
      if (pkrCurrency) setCurrencyId(pkrCurrency.id);
      const pkrRate = rates.find((r: Rate) => r.currency?.code === "PKR");
      if (pkrRate) setRate(String(pkrRate.sellRate));
    }).catch(() => {});
  };

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

  const selectType = (type: OrderType) => {
    setSelectedType(type);
    setTypeSheetOpen(false);
    resetForm();
    loadFormData();
    setTimeout(() => setFormSheetOpen(true), 100);
  };

  const resetForm = () => {
    setAmount(""); setFee(""); setRecipientName(""); setRecipientAccount("");
    setDestinationCard(""); setDestinationSheba(""); setDescription(""); setError(null);
  };

  const isTomanAmount = selectedType === "IR_TO_PK";
  const isHawala = selectedType === "IR_TO_PK" || selectedType === "PK_TO_IR";
  const amountNum = parseFloat(amount || "0");
  const rateNum = parseFloat(rate || "0");
  const feeNum = parseFloat(fee || "0");
  let totalToman = 0;
  let calculatedPkr = 0;
  if (isTomanAmount) {
    totalToman = amountNum;
    calculatedPkr = rateNum > 0 ? Math.round(amountNum / rateNum) : 0;
  } else {
    totalToman = amountNum * rateNum;
    calculatedPkr = amountNum;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!customerId || !currencyId || !amount || !rate) { setError("فیلدهای الزامی را پر کنید"); return; }
    if (isHawala && !recipientName) { setError("نام دریافت‌کننده الزامی است"); return; }
    setSubmitting(true);
    try {
      const newOrder = await api.post("/api/orders", {
        customerId, currencyId, orderType: selectedType, amount, rate, fee,
        recipientName, recipientAccount, recipientMethod,
        destinationCard, destinationSheba, description,
      });
      setFormSheetOpen(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);
      setOrders((prev) => [newOrder, ...prev]);
      resetForm();
      setSelectedType(null);
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
    setSubmitting(false);
  };

  const openDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailSheetOpen(true);
  };

  const typeInfo = orderTypes.find((t) => t.id === selectedType);

  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white">
        <div className="flex h-12 items-center justify-center px-4">
          <h1 className="text-sm font-semibold text-gray-900">سفارشات</h1>
        </div>
        <div className="flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {([["all", "همه"], ["COMPLETED", "تکمیل"], ["REGISTERED", "ثبت شده"], ["TOMAN_RECEIVED", "دریافت"], ["IN_PROGRESS", "انجام"]] as const).map(([value, label]) => (
            <button key={value} onClick={() => setFilter(value)} className={cn("rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-colors whitespace-nowrap", filter === value ? "bg-gray-900 text-white" : "text-gray-400")}>{label}</button>
          ))}
        </div>
      </div>

      <div className="p-4 pb-28">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-100 p-3">
                <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Skeleton className="h-4 w-4" /><Skeleton className="h-3 w-28" /></div><Skeleton className="h-4 w-16 rounded-md" /></div>
                <div className="flex items-center justify-between mb-1"><Skeleton className="h-2.5 w-20" /><Skeleton className="h-2.5 w-28" /></div>
                <div className="flex items-center justify-between mb-2"><Skeleton className="h-2.5 w-16" /><Skeleton className="h-3 w-24" /></div>
                <div className="flex gap-1"><Skeleton className="h-7 flex-1 rounded-lg" /><Skeleton className="h-7 w-12 rounded-lg" /></div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-300">سفارشی ثبت نشده</div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const typeInfo = typeLabels[o.orderType] || { label: o.orderType, color: "text-gray-600", icon: ArrowDownToLine };
              const Icon = typeInfo.icon;
              const nextAction = getNextAction(o.status, o.orderType);
              return (
                <div key={o.id} className="rounded-xl border border-gray-100 p-3 active:bg-gray-50" onClick={() => openDetail(o)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", typeInfo.color)} strokeWidth={1.5} />
                      <span className="text-xs font-medium text-gray-900">{typeInfo.label}</span>
                    </div>
                    <span className={cn("rounded-md px-1.5 py-0.5 text-[9px] font-medium", statusColors[o.status])}>{statusLabels[o.status]}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-400">{o.customer.name}</span>
                    <span className="text-[10px] text-gray-400">{Number(o.amount).toLocaleString("en-US")} × {Number(o.rate).toLocaleString("en-US")}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-gray-400">{new Date(o.createdAt).toLocaleDateString("fa-IR")}</span>
                    <span className="text-xs font-bold text-gray-900" dir="ltr">{Number(o.totalToman).toLocaleString("en-US")} تومان</span>
                  </div>
                  {o.status !== "COMPLETED" && o.status !== "CANCELLED" && (
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {nextAction && <button onClick={() => handleStatus(o.id, nextAction.next)} className="flex-1 rounded-lg bg-green-50 py-1.5 text-[10px] font-medium text-green-600">{nextAction.label}</button>}
                      <button onClick={() => handleStatus(o.id, "CANCELLED")} className="rounded-lg bg-red-50 px-3 py-1.5 text-[10px] font-medium text-red-600">لغو</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setTypeSheetOpen(true)}
        className="fixed bottom-24 left-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg transition-all active:scale-95 hover:bg-gray-800"
      >
        <Plus className="h-6 w-6" strokeWidth={2} />
      </button>

      {/* Success Toast */}
      {success && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 shadow-lg animate-slide-up">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium text-green-700">سفارش ثبت شد</span>
        </div>
      )}

      {/* Type Selection BottomSheet */}
      <BottomSheet isOpen={typeSheetOpen} onClose={() => setTypeSheetOpen(false)} title="انتخاب نوع سفارش">
        <div className="space-y-3">
          {orderTypes.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => selectType(t.id as OrderType)}
                className="w-full flex items-center gap-4 rounded-xl border border-gray-100 p-4 text-right transition-all active:bg-gray-50 hover:border-gray-200"
              >
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", t.color)}>
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{t.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{t.desc}</p>
                </div>
                <ChevronLeft className="h-5 w-5 flex-shrink-0 text-gray-300" strokeWidth={1.5} />
              </button>
            );
          })}
        </div>
      </BottomSheet>

      {/* Form BottomSheet */}
      <BottomSheet isOpen={formSheetOpen} onClose={() => setFormSheetOpen(false)} title={typeInfo?.label} className="max-h-[85vh]">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorAlert message={error} />}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">مشتری</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="flex h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
              <option value="">انتخاب مشتری</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">{isTomanAmount ? "مبلغ تومان دریافتی" : "مبلغ روپیه"}</label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="h-12 text-left rounded-xl" inputMode="decimal" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">نرخ تبدیل (تومان)</label>
            <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="مثلاً 2950" className="h-12 text-left rounded-xl" inputMode="decimal" />
          </div>

          {amountNum > 0 && rateNum > 0 && (
            <div className={cn("rounded-xl p-4", isTomanAmount ? "bg-blue-50" : "bg-emerald-50")}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn("text-xs", isTomanAmount ? "text-blue-500" : "text-emerald-500")}>{isTomanAmount ? "مبلغ دریافتی (تومان)" : "مبلغ روپیه"}</span>
                <span className={cn("text-base font-bold", isTomanAmount ? "text-blue-700" : "text-emerald-700")} dir="ltr">{isTomanAmount ? totalToman.toLocaleString("en-US") : calculatedPkr.toLocaleString("en-US")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={cn("text-xs", isTomanAmount ? "text-blue-500" : "text-emerald-500")}>{isTomanAmount ? "مبلغ واریزی (روپیه)" : "مبلغ دریافتی (تومان)"}</span>
                <span className={cn("text-sm font-semibold", isTomanAmount ? "text-blue-600" : "text-emerald-600")} dir="ltr">{isTomanAmount ? calculatedPkr.toLocaleString("en-US") : totalToman.toLocaleString("en-US")}</span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">کارمزد (تومان)</label>
            <Input type="number" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0" className="h-12 text-left rounded-xl" inputMode="decimal" />
          </div>

          {isHawala && (<>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">نام دریافت‌کننده</label>
              <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="نام کامل" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">نحوه واریز</label>
              <select value={recipientMethod} onChange={(e) => setRecipientMethod(e.target.value)} className="flex h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                <option value="EASYPAISA">Easypaisa</option>
                <option value="JAZZCASH">JazzCash</option>
                <option value="BANK_TRANSFER">حواله بانکی</option>
                <option value="CASH">نقدی</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">شماره حساب / IBAN</label>
              <Input value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value)} placeholder="شماره حساب" className="h-12 rounded-xl" dir="ltr" />
            </div>
          </>)}

          {!isHawala && (<>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">شماره کارت مقصد</label>
              <Input value={destinationCard} onChange={(e) => setDestinationCard(e.target.value)} placeholder="شماره کارت" className="h-12 rounded-xl" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">شماره شبا (اختیاری)</label>
              <Input value={destinationSheba} onChange={(e) => setDestinationSheba(e.target.value)} placeholder="IR..." className="h-12 rounded-xl" dir="ltr" />
            </div>
          </>)}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">توضیحات</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="اختیاری" rows={2} className="flex w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm placeholder:text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>

          {feeNum > 0 && (
            <div className="rounded-xl bg-green-50 p-3 flex items-center justify-between">
              <span className="text-xs text-green-600">سود خالص</span>
              <span className="text-sm font-bold text-green-700" dir="ltr">{feeNum.toLocaleString("en-US")} تومان</span>
            </div>
          )}

          <Button type="submit" isLoading={submitting} className="w-full h-12 rounded-xl">ثبت سفارش</Button>
        </form>
      </BottomSheet>

      {/* Detail BottomSheet */}
      <BottomSheet isOpen={detailSheetOpen} onClose={() => setDetailSheetOpen(false)} title="جزئیات سفارش" className="max-h-[85vh]">
        {selectedOrder && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              {(() => { const ti = typeLabels[selectedOrder.orderType]; const Icon = ti?.icon || ArrowDownToLine; return (
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", selectedOrder.orderType === "IR_TO_PK" ? "bg-blue-50" : selectedOrder.orderType === "PK_TO_IR" ? "bg-emerald-50" : selectedOrder.orderType === "BUY_PKR" ? "bg-violet-50" : "bg-amber-50")}>
                  <Icon className={cn("h-5 w-5", ti?.color)} strokeWidth={1.5} />
                </div>
              ); })()}
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{typeLabels[selectedOrder.orderType]?.label || selectedOrder.orderType}</p>
                <span className={cn("inline-block mt-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-medium", statusColors[selectedOrder.status])}>{statusLabels[selectedOrder.status]}</span>
              </div>
            </div>

            {/* Customer & Currency */}
            <div className="rounded-xl bg-gray-50 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
                <span className="text-xs text-gray-600">{selectedOrder.customer.name}</span>
                <span className="text-[10px] text-gray-400" dir="ltr">{selectedOrder.customer.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
                <span className="text-xs text-gray-600">{selectedOrder.currency.name} ({selectedOrder.currency.code})</span>
              </div>
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-gray-100 p-3 text-center">
                <p className="text-[10px] text-gray-400">مبلغ</p>
                <p className="text-sm font-bold text-gray-900" dir="ltr">{Number(selectedOrder.amount).toLocaleString("en-US")}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3 text-center">
                <p className="text-[10px] text-gray-400">نرخ</p>
                <p className="text-sm font-bold text-gray-900" dir="ltr">{Number(selectedOrder.rate).toLocaleString("en-US")}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3 text-center">
                <p className="text-[10px] text-gray-400">جمع کل</p>
                <p className="text-sm font-bold text-blue-600" dir="ltr">{Number(selectedOrder.totalToman).toLocaleString("en-US")} تومان</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3 text-center">
                <p className="text-[10px] text-gray-400">کارمزد</p>
                <p className="text-sm font-bold text-gray-900" dir="ltr">{Number(selectedOrder.fee).toLocaleString("en-US")} تومان</p>
              </div>
              {selectedOrder.calculatedPkr && Number(selectedOrder.calculatedPkr) > 0 && (
                <div className="col-span-2 rounded-xl border border-gray-100 p-3 text-center">
                  <p className="text-[10px] text-gray-400">روپیه محاسبه شده</p>
                  <p className="text-sm font-bold text-emerald-600" dir="ltr">{Number(selectedOrder.calculatedPkr).toLocaleString("en-US")} روپیه</p>
                </div>
              )}
            </div>

            {/* Recipient / Destination */}
            {(selectedOrder.recipientName || selectedOrder.destinationCard) && (
              <div className="rounded-xl bg-gray-50 p-3 space-y-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase">اطلاعات واریز</p>
                {selectedOrder.recipientName && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">دریافت‌کننده</span>
                    <span className="text-xs font-medium text-gray-900">{selectedOrder.recipientName}</span>
                  </div>
                )}
                {selectedOrder.recipientAccount && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">شماره حساب</span>
                    <span className="text-xs font-medium text-gray-900" dir="ltr">{selectedOrder.recipientAccount}</span>
                  </div>
                )}
                {selectedOrder.recipientMethod && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">نحوه واریز</span>
                    <span className="text-xs font-medium text-gray-900">{methodLabels[selectedOrder.recipientMethod] || selectedOrder.recipientMethod}</span>
                  </div>
                )}
                {selectedOrder.destinationCard && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">کارت مقصد</span>
                    <span className="text-xs font-medium text-gray-900" dir="ltr">{selectedOrder.destinationCard}</span>
                  </div>
                )}
                {selectedOrder.destinationSheba && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">شبا</span>
                    <span className="text-xs font-medium text-gray-900" dir="ltr">{selectedOrder.destinationSheba}</span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {selectedOrder.description && (
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">توضیحات</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{selectedOrder.description}</p>
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
                <span className="text-[10px] text-gray-400">{new Date(selectedOrder.createdAt).toLocaleDateString("fa-IR")} {new Date(selectedOrder.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <span className="text-[10px] text-gray-400">{selectedOrder.user.firstName} {selectedOrder.user.lastName}</span>
            </div>

            {/* Action Buttons */}
            {selectedOrder.status !== "COMPLETED" && selectedOrder.status !== "CANCELLED" && (() => {
              const nextAction = getNextAction(selectedOrder.status, selectedOrder.orderType);
              return nextAction ? (
                <div className="flex gap-2">
                  <button onClick={() => { handleStatus(selectedOrder.id, nextAction.next); setDetailSheetOpen(false); }} className="flex-1 rounded-xl bg-green-500 py-3 text-sm font-semibold text-white active:bg-green-600">{nextAction.label}</button>
                  <button onClick={() => { handleStatus(selectedOrder.id, "CANCELLED"); setDetailSheetOpen(false); }} className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 active:bg-red-100">لغو</button>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </BottomSheet>
    </main>
  );
}
