"use client";

import { useState, useEffect } from "react";
import {
  ArrowDownToLine,
  Plus,
  Clock,
  CheckCircle2,
  CreditCard,
  User,
  FileText,
  ChevronLeft,
  Send,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import {
  DIRECTIONS,
  SUB_TYPES,
  ORDER_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  METHOD_LABELS,
  ICON_MAP,
  isHawalaType,
  isTomanAmountType,
  type OrderTypeEnum,
  type Direction,
} from "@/lib/order-types";

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
  marketRateAtTime: bigint | null;
  buyRateAtTime: bigint | null;
  sellRateAtTime: bigint | null;
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | string>("all");

  const [directionSheetOpen, setDirectionSheetOpen] = useState(false);
  const [subTypeSheetOpen, setSubTypeSheetOpen] = useState(false);
  const [formSheetOpen, setFormSheetOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedDirection, setSelectedDirection] = useState<Direction | null>(null);
  const [selectedType, setSelectedType] = useState<OrderTypeEnum | null>(null);
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

  const selectDirection = (direction: Direction) => {
    setSelectedDirection(direction);
    setDirectionSheetOpen(false);
    resetForm();
    setTimeout(() => setSubTypeSheetOpen(true), 100);
  };

  const selectSubType = (type: OrderTypeEnum) => {
    setSelectedType(type);
    setSubTypeSheetOpen(false);
    loadFormData();
    setTimeout(() => setFormSheetOpen(true), 100);
  };

  const resetForm = () => {
    setAmount(""); setFee(""); setRecipientName(""); setRecipientAccount("");
    setDestinationCard(""); setDestinationSheba(""); setDescription(""); setError(null);
    setSelectedType(null);
  };

  const isTomanAmount = selectedType ? isTomanAmountType(selectedType) : false;
  const isHawala = selectedType ? isHawalaType(selectedType) : false;
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
      setSelectedDirection(null);
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
    setSubmitting(false);
  };

  const openDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailSheetOpen(true);
  };

  const typeInfo = selectedType ? ORDER_TYPE_LABELS[selectedType] : null;
  const subTypes = selectedDirection ? SUB_TYPES[selectedDirection.id] || [] : [];

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
              const typeInfo = ORDER_TYPE_LABELS[o.orderType] || { label: o.orderType, short: o.orderType, color: "text-gray-600", bg: "bg-gray-50 text-gray-600" };
              const Icon = ICON_MAP[o.orderType] || ArrowDownToLine;
              const nextAction = getNextAction(o.status, o.orderType);
              return (
                <div key={o.id} className="rounded-xl border border-gray-100 p-3 active:bg-gray-50" onClick={() => openDetail(o)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", typeInfo.color)} strokeWidth={1.5} />
                      <span className="text-xs font-medium text-gray-900">{typeInfo.label}</span>
                    </div>
                    <span className={cn("rounded-md px-1.5 py-0.5 text-[9px] font-medium", STATUS_COLORS[o.status])}>{STATUS_LABELS[o.status]}</span>
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
        onClick={() => setDirectionSheetOpen(true)}
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

      {/* Direction Selection BottomSheet */}
      <BottomSheet isOpen={directionSheetOpen} onClose={() => setDirectionSheetOpen(false)} title="نوع تبدیل">
        <div className="space-y-3">
          {DIRECTIONS.map((d) => {
            const Icon = d.icon;
            return (
              <button
                key={d.id}
                onClick={() => selectDirection(d)}
                className="w-full flex items-center gap-4 rounded-xl border border-gray-100 p-4 text-right transition-all active:bg-gray-50 hover:border-gray-200"
              >
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", d.color)}>
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{d.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{d.sub}</p>
                </div>
                <ChevronLeft className="h-5 w-5 flex-shrink-0 text-gray-300" strokeWidth={1.5} />
              </button>
            );
          })}
        </div>
      </BottomSheet>

      {/* Sub-Type Selection BottomSheet */}
      <BottomSheet isOpen={subTypeSheetOpen} onClose={() => setSubTypeSheetOpen(false)} title={selectedDirection?.label}>
        <div className="space-y-3">
          {subTypes.map((st) => (
            <button
              key={st.id}
              onClick={() => selectSubType(st.id)}
              className="w-full flex items-center gap-4 rounded-xl border border-gray-100 p-4 text-right transition-all active:bg-gray-50 hover:border-gray-200"
            >
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-white", st.color)}>
                {st.id === "IR_TO_PK" || st.id === "SELL_PKR" ? <Send className="h-5 w-5" strokeWidth={1.5} /> : <ArrowDownToLine className="h-5 w-5" strokeWidth={1.5} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{st.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{st.desc}</p>
              </div>
              <ChevronLeft className="h-5 w-5 flex-shrink-0 text-gray-300" strokeWidth={1.5} />
            </button>
          ))}
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
            <label className="text-xs font-medium text-gray-500">{isTomanAmount ? "مبلغ پرداختی (تومان)" : "مبلغ پرداختی (روپیه)"}</label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="h-12 text-left rounded-xl" inputMode="decimal" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">نرخ تبدیل (تومان)</label>
            <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="مثلاً 2950" className="h-12 text-left rounded-xl" inputMode="decimal" />
          </div>

          {amountNum > 0 && rateNum > 0 && (
            <div className={cn("rounded-xl p-4", isTomanAmount ? "bg-green-50" : "bg-blue-50")}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn("text-xs", isTomanAmount ? "text-green-500" : "text-blue-500")}>{isTomanAmount ? "مبلغ پرداختی (تومان)" : "مبلغ پرداختی (روپیه)"}</span>
                <span className={cn("text-base font-bold", isTomanAmount ? "text-green-700" : "text-blue-700")} dir="ltr">{isTomanAmount ? totalToman.toLocaleString("en-US") : calculatedPkr.toLocaleString("en-US")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={cn("text-xs", isTomanAmount ? "text-green-500" : "text-blue-500")}>{isTomanAmount ? "مبلغ دریافتی (روپیه)" : "مبلغ دریافتی (تومان)"}</span>
                <span className={cn("text-sm font-semibold", isTomanAmount ? "text-green-600" : "text-blue-600")} dir="ltr">{isTomanAmount ? calculatedPkr.toLocaleString("en-US") : totalToman.toLocaleString("en-US")}</span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">کارمزد (تومان)</label>
            <Input type="number" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0" className="h-12 text-left rounded-xl" inputMode="decimal" />
          </div>

          {/* Hawala fields: IR_TO_PK and PK_TO_IR */}
          {isHawala && (<>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">{selectedType === "IR_TO_PK" ? "نام گیرنده" : "نام صاحب حساب"}</label>
              <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="نام کامل" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">{selectedType === "IR_TO_PK" ? "نحوه واریز" : "شماره شبا"}</label>
              {selectedType === "IR_TO_PK" ? (
                <select value={recipientMethod} onChange={(e) => setRecipientMethod(e.target.value)} className="flex h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option value="EASYPAISA">Easypaisa</option>
                  <option value="JAZZCASH">JazzCash</option>
                  <option value="BANK_TRANSFER">حواله بانکی</option>
                  <option value="CASH">نقدی</option>
                </select>
              ) : (
                <Input value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value)} placeholder="IR..." className="h-12 rounded-xl" dir="ltr" />
              )}
            </div>
            {selectedType === "IR_TO_PK" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">شماره حساب / IBAN</label>
                <Input value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value)} placeholder="شماره حساب" className="h-12 rounded-xl" dir="ltr" />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">شماره کارت</label>
                  <Input value={destinationCard} onChange={(e) => setDestinationCard(e.target.value)} placeholder="شماره کارت" className="h-12 rounded-xl" dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">بانک</label>
                  <Input value={recipientMethod} onChange={(e) => setRecipientMethod(e.target.value)} placeholder="نام بانک" className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">شماره موبایل</label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="اختیاری" className="h-12 rounded-xl" dir="ltr" />
                </div>
              </>
            )}
          </>)}

          {/* Card fields: BUY_PKR and SELL_PKR */}
          {!isHawala && (<>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">{selectedType === "BUY_PKR" ? "شماره حساب پاکستانی صراف" : "شماره کارت مقصد"}</label>
              <Input value={destinationCard} onChange={(e) => setDestinationCard(e.target.value)} placeholder={selectedType === "BUY_PKR" ? "شماره حساب پاکستانی" : "شماره کارت"} className="h-12 rounded-xl" dir="ltr" />
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
              {(() => { const ti = ORDER_TYPE_LABELS[selectedOrder.orderType]; const Icon = ICON_MAP[selectedOrder.orderType] || ArrowDownToLine; return (
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", selectedOrder.orderType === "IR_TO_PK" ? "bg-green-50" : selectedOrder.orderType === "PK_TO_IR" ? "bg-blue-50" : selectedOrder.orderType === "BUY_PKR" ? "bg-violet-50" : "bg-amber-50")}>
                  <Icon className={cn("h-5 w-5", ti?.color)} strokeWidth={1.5} />
                </div>
              ); })()}
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{ORDER_TYPE_LABELS[selectedOrder.orderType]?.label || selectedOrder.orderType}</p>
                <span className={cn("inline-block mt-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-medium", STATUS_COLORS[selectedOrder.status])}>{STATUS_LABELS[selectedOrder.status]}</span>
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

            {/* Financial Details */}
            {(selectedOrder.marketRateAtTime || selectedOrder.buyRateAtTime || selectedOrder.sellRateAtTime) && (
              <div className="rounded-xl bg-green-50 p-3 space-y-2">
                <p className="text-[10px] font-semibold text-green-600 uppercase">جزئیات مالی سفارش</p>
                {selectedOrder.marketRateAtTime && Number(selectedOrder.marketRateAtTime) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-600">نرخ بازار هنگام ثبت</span>
                    <span className="text-xs font-bold text-green-700" dir="ltr">{Number(selectedOrder.marketRateAtTime).toLocaleString("en-US")} تومان</span>
                  </div>
                )}
                {selectedOrder.buyRateAtTime && Number(selectedOrder.buyRateAtTime) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-600">نرخ خرید هنگام ثبت</span>
                    <span className="text-xs font-bold text-green-700" dir="ltr">{Number(selectedOrder.buyRateAtTime).toLocaleString("en-US")} تومان</span>
                  </div>
                )}
                {selectedOrder.sellRateAtTime && Number(selectedOrder.sellRateAtTime) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-600">نرخ فروش هنگام ثبت</span>
                    <span className="text-xs font-bold text-green-700" dir="ltr">{Number(selectedOrder.sellRateAtTime).toLocaleString("en-US")} تومان</span>
                  </div>
                )}
                {selectedOrder.calculatedPkr && Number(selectedOrder.calculatedPkr) > 0 && selectedOrder.buyRateAtTime && Number(selectedOrder.buyRateAtTime) > 0 && (
                  <div className="flex items-center justify-between border-t border-green-200 pt-2 mt-1">
                    <span className="text-xs text-green-600">هزینه تامین</span>
                    <span className="text-xs font-bold text-green-700" dir="ltr">{(Number(selectedOrder.calculatedPkr) * Number(selectedOrder.buyRateAtTime)).toLocaleString("en-US")} تومان</span>
                  </div>
                )}
                {selectedOrder.profit && Number(selectedOrder.profit) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-600">سود خالص</span>
                    <span className="text-sm font-bold text-green-800" dir="ltr">{Number(selectedOrder.profit).toLocaleString("en-US")} تومان</span>
                  </div>
                )}
              </div>
            )}

            {/* Recipient / Destination */}
            {(selectedOrder.recipientName || selectedOrder.destinationCard) && (
              <div className="rounded-xl bg-gray-50 p-3 space-y-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase">اطلاعات واریز</p>
                {selectedOrder.recipientName && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{selectedOrder.orderType === "IR_TO_PK" ? "دریافت‌کننده" : "صاحب حساب"}</span>
                    <span className="text-xs font-medium text-gray-900">{selectedOrder.recipientName}</span>
                  </div>
                )}
                {selectedOrder.recipientAccount && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{selectedOrder.orderType === "IR_TO_PK" ? "شماره حساب" : "شماره شبا"}</span>
                    <span className="text-xs font-medium text-gray-900" dir="ltr">{selectedOrder.recipientAccount}</span>
                  </div>
                )}
                {selectedOrder.recipientMethod && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{selectedOrder.orderType === "IR_TO_PK" ? "نحوه واریز" : "بانک"}</span>
                    <span className="text-xs font-medium text-gray-900">{METHOD_LABELS[selectedOrder.recipientMethod] || selectedOrder.recipientMethod}</span>
                  </div>
                )}
                {selectedOrder.destinationCard && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{selectedOrder.orderType === "BUY_PKR" ? "حساب پاکستانی" : "کارت مقصد"}</span>
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
