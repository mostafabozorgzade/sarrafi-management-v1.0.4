"use client";

import { useState, useEffect } from "react";
import {
  ArrowDownToLine,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  ChevronLeft,
  Send,
  Pencil,
  Trash2,
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
  customerId: string;
  currencyId: string;
  orderType: string;
  status: string;
  amount: bigint;
  totalToman: bigint;
  fee: bigint;
  transferCost: bigint;
  calculatedPkr: bigint | null;
  buyMarketProfitAmount: bigint;
  sellMarketProfitAmount: bigint;
  spreadProfitAmount: bigint;
  feeAmount: bigint;
  totalProfitAmount: bigint;
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
interface Rate { id: string; currencyId: string; buyRate: string; sellRate: string; marketRate: string; currency: { code: string } }

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
  const [buyRate, setBuyRate] = useState("");
  const [sellRate, setSellRate] = useState("");
  const [marketRate, setMarketRate] = useState("");
  const [fee, setFee] = useState("");
  const [transferCost, setTransferCost] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientAccount, setRecipientAccount] = useState("");
  const [recipientMethod, setRecipientMethod] = useState("EASYPAISA");
  const [destinationCard, setDestinationCard] = useState("");
  const [destinationSheba, setDestinationSheba] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [currentRates, setCurrentRates] = useState<{ buyRate: number; sellRate: number; marketRate: number } | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (selectedOrder && detailSheetOpen) {
      const updated = orders.find((o) => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  }, [orders, detailSheetOpen]);

  const onlyDigits = (v: string) => v.replace(/[^0-9]/g, "");
  const formatNum = (v: string) => {
    const d = onlyDigits(v);
    if (!d) return "";
    return Number(d).toLocaleString("en-US");
  };
  const parseFormatted = (v: string) => Number(onlyDigits(v) || "0");

  useEffect(() => {
    const params = filter === "all" ? "" : `?status=${filter}`;
    api.get(`/api/orders${params}`).then((data) => { setOrders(data); setLoading(false); }).catch(() => setLoading(false));
  }, [filter]);

  const loadFormData = () => {
    setFormLoading(true);
    Promise.all([api.get("/api/customers"), api.get("/api/currencies"), api.get("/api/rates")]).then(([c, cur, rates]) => {
      setCustomers(c);
      if (c.length > 0) setCustomerId(c[0].id);
      const pkrCurrency = cur.find((x: { code: string; id: string }) => x.code === "PKR");
      if (pkrCurrency) setCurrencyId(pkrCurrency.id);
      const pkrRate = rates.find((r: Rate) => r.currency?.code === "PKR");
      if (pkrRate) {
        setCurrentRates({
          buyRate: Number(pkrRate.buyRate),
          sellRate: Number(pkrRate.sellRate),
          marketRate: Number(pkrRate.marketRate),
        });
        setBuyRate(Number(pkrRate.buyRate).toLocaleString("en-US"));
        setSellRate(Number(pkrRate.sellRate).toLocaleString("en-US"));
        setMarketRate(Number(pkrRate.marketRate).toLocaleString("en-US"));
      }
    }).catch(() => {}).finally(() => setFormLoading(false));
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
    setAmount(""); setBuyRate(""); setSellRate(""); setMarketRate(""); setFee(""); setTransferCost(""); setRecipientName(""); setRecipientAccount("");
    setDestinationCard(""); setDestinationSheba(""); setDescription(""); setError(null);
    setSelectedType(null); setCurrentRates(null);
  };

  const isTomanAmount = selectedType ? isTomanAmountType(selectedType) : false;
  const isHawala = selectedType ? isHawalaType(selectedType) : false;
  const amountNum = parseFormatted(amount);
  const buyRateNum = parseFormatted(buyRate);
  const sellRateNum = parseFormatted(sellRate);
  const marketRateNum = parseFormatted(marketRate);
  const rateNum = (selectedType === "SELL_PKR" || selectedType === "IR_TO_PK") ? sellRateNum : buyRateNum;
  const feeNum = parseFormatted(fee);
  let totalToman = 0;
  let calculatedPkr = 0;
  if (isTomanAmount) {
    totalToman = amountNum;
    calculatedPkr = rateNum > 0 ? Math.round(amountNum / rateNum) : 0;
  } else {
    totalToman = amountNum * rateNum;
    calculatedPkr = amountNum;
  }

  const pkrAmount = isTomanAmount ? calculatedPkr : amountNum;
  const transferCostNum = parseFormatted(transferCost);

  let previewMainProfit = 0;
  let previewTotalProfit = 0;
  let mainProfitLabel = "";
  let mainProfitFormula = "";

  if (pkrAmount > 0) {
    if (selectedType === "BUY_PKR") {
      previewMainProfit = (marketRateNum - rateNum) * pkrAmount;
      mainProfitLabel = "سود خرید روپیه نسبت به بازار";
      mainProfitFormula = `(بازار ${marketRateNum.toLocaleString("en-US")} - خرید ${rateNum.toLocaleString("en-US")}) × ${pkrAmount.toLocaleString("en-US")}`;
    } else if (selectedType === "SELL_PKR") {
      previewMainProfit = (rateNum - marketRateNum) * pkrAmount;
      mainProfitLabel = "سود فروش روپیه نسبت به بازار";
      mainProfitFormula = `(فروش ${rateNum.toLocaleString("en-US")} - بازار ${marketRateNum.toLocaleString("en-US")}) × ${pkrAmount.toLocaleString("en-US")}`;
    } else if (selectedType === "IR_TO_PK") {
      previewMainProfit = (rateNum - marketRateNum) * pkrAmount;
      mainProfitLabel = "سود حواله ایران به پاکستان";
      mainProfitFormula = `(فروش ${rateNum.toLocaleString("en-US")} - بازار ${marketRateNum.toLocaleString("en-US")}) × ${pkrAmount.toLocaleString("en-US")}`;
    } else if (selectedType === "PK_TO_IR") {
      previewMainProfit = (marketRateNum - rateNum) * pkrAmount;
      mainProfitLabel = "سود دریافت روپیه";
      mainProfitFormula = `(بازار ${marketRateNum.toLocaleString("en-US")} - خرید ${rateNum.toLocaleString("en-US")}) × ${pkrAmount.toLocaleString("en-US")}`;
    }

    previewTotalProfit = previewMainProfit + feeNum - transferCostNum;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!customerId || !currencyId || !amount) { setError("فیلدهای الزامی را پر کنید"); return; }
    if (isHawala && !recipientName) { setError("نام دریافت‌کننده الزامی است"); return; }
    setSubmitting(true);
    try {
      const newOrder = await api.post("/api/orders", {
        customerId, currencyId, orderType: selectedType, amount, buyRate, sellRate, marketRate, fee, transferCost,
        recipientName, recipientAccount, recipientMethod,
        destinationCard, destinationSheba, description,
      });
      setFormSheetOpen(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);
      setOrders((prev) => [newOrder, ...prev]);
      resetForm();
      setSelectedDirection(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطا در ایجاد سفارش";
      setError(msg);
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 4000);
    }
    setSubmitting(false);
  };

  const openDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailSheetOpen(true);
  };

  const openEdit = (order: Order) => {
    setEditingOrder(order);
    setSelectedType(order.orderType as OrderTypeEnum);
    setCustomerId(order.customerId);
    setCurrencyId(order.currencyId);
    setAmount(String(Number(order.amount)));
    setBuyRate(Number(order.buyRateAtTime || 0) > 0 ? Number(order.buyRateAtTime).toLocaleString("en-US") : "");
    setSellRate(Number(order.sellRateAtTime || 0) > 0 ? Number(order.sellRateAtTime).toLocaleString("en-US") : "");
    const storedMarket = Number(order.marketRateAtTime || 0);
    setMarketRate(storedMarket > 0 ? storedMarket.toLocaleString("en-US") : "");
    setFee(String(Number(order.fee)));
    setTransferCost(String(Number(order.transferCost)));
    setRecipientName(order.recipientName || "");
    setRecipientAccount(order.recipientAccount || "");
    setRecipientMethod(order.recipientMethod || "EASYPAISA");
    setDestinationCard(order.destinationCard || "");
    setDestinationSheba(order.destinationSheba || "");
    setDescription(order.description || "");
    setError(null);
    setDetailSheetOpen(false);
    loadFormData();
    setTimeout(() => setEditSheetOpen(true), 100);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setError(null);
    if (!customerId || !currencyId || !amount) { setError("فیلدهای الزامی را پر کنید"); return; }
    const isHawalaEdit = isHawalaType(editingOrder.orderType);
    if (isHawalaEdit && !recipientName) { setError("نام دریافت‌کننده الزامی است"); return; }
    setSubmitting(true);
    try {
      const updated = await api.put(`/api/orders/${editingOrder.id}`, {
        customerId, currencyId, amount, marketRate, fee, transferCost,
        recipientName, recipientAccount, recipientMethod,
        destinationCard, destinationSheba, description,
      });
      setEditSheetOpen(false);
      setOrders((prev) => prev.map((o) => o.id === editingOrder.id ? updated : o));
      setEditingOrder(null);
      resetForm();
      setSelectedDirection(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطا در ویرایش سفارش";
      setError(msg);
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 4000);
    }
    setSubmitting(false);
  };

  const openDeleteConfirm = (order: Order) => {
    setDeletingOrder(order);
    setDetailSheetOpen(false);
    setTimeout(() => setDeleteConfirmOpen(true), 100);
  };

  const handleDelete = async () => {
    if (!deletingOrder) return;
    try {
      await api.delete(`/api/orders/${deletingOrder.id}`);
      setOrders((prev) => prev.filter((o) => o.id !== deletingOrder.id));
      setDeleteConfirmOpen(false);
      setDeletingOrder(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطا در حذف سفارش";
      setErrorToast(msg);
      setTimeout(() => setErrorToast(null), 4000);
      setDeleteConfirmOpen(false);
    }
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
                    <span className="text-[10px] text-gray-400" dir="ltr">{Number(o.totalToman).toLocaleString("en-US")} تومان</span>
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

      {/* Error Toast */}
      {errorToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 shadow-lg animate-slide-up max-w-[90vw]">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <span className="text-sm font-medium text-red-700">{errorToast}</span>
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
        {formLoading ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-gray-50 p-3 space-y-2">
              <Skeleton className="h-3 w-24" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
            <Skeleton className="h-12 rounded-xl" />
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorAlert message={error} />}

          {/* Rate Display Card */}
          {currentRates && (
            <div className="rounded-xl bg-gray-50 p-3 space-y-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase">نرخ لحظه معامله</p>
              <div className="grid grid-cols-3 gap-2">
                {currentRates.marketRate > 0 && (
                  <div className="rounded-lg bg-white p-2 text-center border border-gray-100">
                    <span className="text-[8px] text-gray-400">بازار</span>
                    <p className="text-[11px] font-bold text-gray-700" dir="ltr">{currentRates.marketRate.toLocaleString("en-US")}</p>
                  </div>
                )}
                <div className="rounded-lg bg-blue-50 p-2 text-center">
                  <span className="text-[8px] text-blue-500">خرید</span>
                  <p className="text-[11px] font-bold text-blue-700" dir="ltr">{currentRates.buyRate.toLocaleString("en-US")}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-2 text-center">
                  <span className="text-[8px] text-emerald-500">فروش</span>
                  <p className="text-[11px] font-bold text-emerald-700" dir="ltr">{currentRates.sellRate.toLocaleString("en-US")}</p>
                </div>
              </div>
            </div>
          )}

          {/* Profit Formula Info */}
          {selectedType && (
            <div className="rounded-xl bg-amber-50 p-3 space-y-2">
              <p className="text-[10px] font-semibold text-amber-600 uppercase">نحوه محاسبه سود</p>
              {selectedType === "BUY_PKR" && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-amber-700 font-medium">خرید روپیه از مشتری</p>
                  <p className="text-[9px] text-amber-600 leading-relaxed">
                    روپیه از مشتری دریافت می‌شود و تومان پرداخت می‌شود. سود از اختلاف نرخ بازار و نرخ خرید محاسبه می‌شود.
                  </p>
                  <div className="rounded-lg bg-white p-2 border border-amber-100">
                    <p className="text-[9px] text-amber-700 font-medium mb-1">سود خرید:</p>
                    <p className="text-[9px] text-amber-600" dir="ltr">(نرخ بازار - نرخ خرید) × مقدار روپیه</p>
                  </div>
                </div>
              )}
              {selectedType === "SELL_PKR" && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-amber-700 font-medium">فروش روپیه به مشتری</p>
                  <p className="text-[9px] text-amber-600 leading-relaxed">
                    تومان از مشتری دریافت می‌شود و روپیه تحویل داده می‌شود. سود از اختلاف نرخ فروش و نرخ بازار محاسبه می‌شود.
                  </p>
                  <div className="rounded-lg bg-white p-2 border border-amber-100">
                    <p className="text-[9px] text-amber-700 font-medium mb-1">سود فروش:</p>
                    <p className="text-[9px] text-amber-600" dir="ltr">(نرخ فروش - نرخ بازار) × مقدار روپیه</p>
                  </div>
                </div>
              )}
              {selectedType === "IR_TO_PK" && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-amber-700 font-medium">حواله ایران به پاکستان</p>
                  <p className="text-[9px] text-amber-600 leading-relaxed">
                    تومان از مشتری دریافت می‌شود و روپیه به حساب مقصد در پاکستان واریز می‌شود. سود از اختلاف نرخ فروش و نرخ بازار محاسبه می‌شود.
                  </p>
                  <div className="rounded-lg bg-white p-2 border border-amber-100">
                    <p className="text-[9px] text-amber-700 font-medium mb-1">محاسبه روپیه:</p>
                    <p className="text-[9px] text-amber-600" dir="ltr">مبلغ تومان ÷ نرخ تبدیل = مقدار روپیه</p>
                  </div>
                  <div className="rounded-lg bg-white p-2 border border-amber-100">
                    <p className="text-[9px] text-amber-700 font-medium mb-1">سود حواله:</p>
                    <p className="text-[9px] text-amber-600" dir="ltr">(نرخ فروش - نرخ بازار) × مقدار روپیه</p>
                  </div>
                </div>
              )}
              {selectedType === "PK_TO_IR" && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-amber-700 font-medium">حواله پاکستان به ایران</p>
                  <p className="text-[9px] text-amber-600 leading-relaxed">
                    روپیه از مشتری دریافت می‌شود و تومان به حساب بانکی ایران واریز می‌شود. سود از اختلاف نرخ بازار و نرخ خرید محاسبه می‌شود.
                  </p>
                  <div className="rounded-lg bg-white p-2 border border-amber-100">
                    <p className="text-[9px] text-amber-700 font-medium mb-1">محاسبه تومان:</p>
                    <p className="text-[9px] text-amber-600" dir="ltr">مقدار روپیه × نرخ تبدیل = مبلغ تومان</p>
                  </div>
                  <div className="rounded-lg bg-white p-2 border border-amber-100">
                    <p className="text-[9px] text-amber-700 font-medium mb-1">سود دریافت:</p>
                    <p className="text-[9px] text-amber-600" dir="ltr">(نرخ بازار - نرخ خرید) × مقدار روپیه</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">مشتری</label>
            <div className="relative">
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="flex h-12 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                <option value="">انتخاب مشتری</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
              </select>
              <ChevronLeft className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" strokeWidth={1.5} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">{isTomanAmount ? "مبلغ پرداختی (تومان)" : "مبلغ پرداختی (روپیه)"}</label>
            <Input type="text" inputMode="numeric" value={amount} onChange={(e) => setAmount(formatNum(e.target.value))} placeholder="0" className="h-12 text-left rounded-xl" />
          </div>

          {currentRates && selectedType && (
            <div className="grid grid-cols-2 gap-2">
              {(selectedType === "BUY_PKR" || selectedType === "PK_TO_IR") && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">نرخ خرید روپیه</label>
                  <Input type="text" inputMode="numeric" value={buyRate} onChange={(e) => setBuyRate(formatNum(e.target.value))} placeholder="0" className="h-12 text-left rounded-xl" />
                </div>
              )}
              {(selectedType === "SELL_PKR" || selectedType === "IR_TO_PK") && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">نرخ فروش روپیه</label>
                  <Input type="text" inputMode="numeric" value={sellRate} onChange={(e) => setSellRate(formatNum(e.target.value))} placeholder="0" className="h-12 text-left rounded-xl" />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">نرخ بازار روپیه</label>
                <Input type="text" inputMode="numeric" value={marketRate} onChange={(e) => setMarketRate(formatNum(e.target.value))} placeholder="0" className="h-12 text-left rounded-xl" />
              </div>
            </div>
          )}

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

          {/* Profit Preview */}
          {amountNum > 0 && rateNum > 0 && currentRates && (
            <div className="rounded-xl bg-green-50 p-4 space-y-3">
              <p className="text-[10px] font-semibold text-green-600 uppercase">پیش‌نمایش سود</p>
              <div className="space-y-2">
                {previewMainProfit > 0 && (
                  <div className="rounded-lg bg-white p-2 border border-green-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-green-600">{mainProfitLabel}</span>
                      <span className="text-xs font-bold text-green-700" dir="ltr">{previewMainProfit.toLocaleString("en-US")} تومان</span>
                    </div>
                    <p className="text-[9px] text-green-500" dir="ltr">{mainProfitFormula}</p>
                  </div>
                )}
                {feeNum > 0 && (
                  <div className="rounded-lg bg-white p-2 border border-green-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-green-600">کارمزد (+)</span>
                      <span className="text-xs font-bold text-green-700" dir="ltr">{feeNum.toLocaleString("en-US")} تومان</span>
                    </div>
                  </div>
                )}
                {transferCostNum > 0 && (
                  <div className="rounded-lg bg-white p-2 border border-red-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-red-500">هزینه انتقال (-)</span>
                      <span className="text-xs font-bold text-red-600" dir="ltr">{transferCostNum.toLocaleString("en-US")} تومان</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-green-200 pt-2">
                <span className="text-xs font-medium text-green-600">سود کل</span>
                <span className="text-base font-bold text-green-800" dir="ltr">{previewTotalProfit.toLocaleString("en-US")} تومان</span>
              </div>
            </div>
          )}

          {isHawala && (

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

          <Button type="submit" isLoading={submitting} className="w-full h-12 rounded-xl">ثبت سفارش</Button>
        </form>
        )}
      </BottomSheet>

      {/* Detail BottomSheet */}
      <BottomSheet isOpen={detailSheetOpen} onClose={() => setDetailSheetOpen(false)} title="جزئیات سفارش" className="max-h-[85vh]">
        {selectedOrder && (
          <div className="space-y-3">
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

            {/* Customer */}
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-2.5">
              <User className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
              <span className="text-xs font-medium text-gray-700">{selectedOrder.customer.name}</span>
              <span className="text-[10px] text-gray-400" dir="ltr">{selectedOrder.customer.phone}</span>
              <span className="mr-auto text-[10px] text-gray-400">{selectedOrder.currency.code}</span>
            </div>

            {/* Amount & Rates */}
            {(() => {
              const ot = selectedOrder.orderType;
              const isTomanAmt = ot === "IR_TO_PK" || ot === "SELL_PKR";
              const orderRate = isTomanAmt ? Number(selectedOrder.sellRateAtTime || 0) : Number(selectedOrder.buyRateAtTime || 0);
              return (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-gray-100 p-2.5 text-center">
                      <p className="text-[9px] text-gray-400">{isTomanAmt ? "مبلغ (تومان)" : "مبلغ (روپیه)"}</p>
                      <p className="text-sm font-bold text-gray-900" dir="ltr">{Number(selectedOrder.amount).toLocaleString("en-US")}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 p-2.5 text-center">
                      <p className="text-[9px] text-gray-400">{isTomanAmt ? "نرخ فروش" : "نرخ خرید"}</p>
                      <p className="text-sm font-bold text-gray-900" dir="ltr">{orderRate.toLocaleString("en-US")} <span className="text-[9px] font-normal text-gray-400">تومان</span></p>
                    </div>
                  </div>
                  {isTomanAmt && Number(selectedOrder.calculatedPkr) > 0 && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-2.5 text-center">
                      <p className="text-[9px] text-blue-500">روپیه محاسبه شده</p>
                      <p className="text-sm font-bold text-blue-600" dir="ltr">{Number(selectedOrder.calculatedPkr).toLocaleString("en-US")} <span className="text-[9px] font-normal text-blue-400">روپیه</span></p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Profit Breakdown */}
            {(() => {
              const ot = selectedOrder.orderType;
              const mktRate = Number(selectedOrder.marketRateAtTime || 0);
              const mainProfit = (ot === "BUY_PKR" || ot === "PK_TO_IR") ? Number(selectedOrder.buyMarketProfitAmount) : Number(selectedOrder.sellMarketProfitAmount);
              const feeAmt = Number(selectedOrder.feeAmount || 0);
              const transferAmt = Number(selectedOrder.transferCost || 0);
              const totalProfit = Number(selectedOrder.totalProfitAmount || 0);
              if (!mainProfit && !feeAmt && !transferAmt && !totalProfit) return null;
              return (
                <div className="rounded-xl bg-green-50 p-3 space-y-1.5">
                  <p className="text-[10px] font-semibold text-green-600">تحلیل سود</p>
                  {mktRate > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-green-600">نرخ بازار</span>
                      <span className="text-[11px] font-bold text-green-700" dir="ltr">{mktRate.toLocaleString("en-US")} <span className="text-[9px] font-normal text-green-500">تومان</span></span>
                    </div>
                  )}
                  {mainProfit !== 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-green-600">{ot === "BUY_PKR" ? "سود خرید نسبت به بازار" : ot === "SELL_PKR" ? "سود فروش نسبت به بازار" : ot === "IR_TO_PK" ? "سود حواله" : "سود دریافت روپیه"}</span>
                      <span className="text-[11px] font-bold text-green-700" dir="ltr">{mainProfit.toLocaleString("en-US")} <span className="text-[9px] font-normal text-green-500">تومان</span></span>
                    </div>
                  )}
                  {feeAmt > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-green-600">(+ ) کارمزد</span>
                      <span className="text-[11px] font-bold text-green-700" dir="ltr">+{feeAmt.toLocaleString("en-US")} <span className="text-[9px] font-normal text-green-500">تومان</span></span>
                    </div>
                  )}
                  {transferAmt > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-red-500">(-) هزینه انتقال</span>
                      <span className="text-[11px] font-bold text-red-600" dir="ltr">-{transferAmt.toLocaleString("en-US")} <span className="text-[9px] font-normal text-red-400">تومان</span></span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-green-200 pt-1.5">
                    <span className="text-[11px] font-semibold text-green-600">سود نهایی</span>
                    <span className="text-sm font-bold text-green-800" dir="ltr">{totalProfit.toLocaleString("en-US")} <span className="text-[9px] font-normal text-green-600">تومان</span></span>
                  </div>
                </div>
              );
            })()}

            {/* Recipient / Destination */}
            {(selectedOrder.recipientName || selectedOrder.destinationCard) && (
              <div className="rounded-xl bg-gray-50 p-3 space-y-1.5">
                <p className="text-[10px] font-semibold text-gray-400">اطلاعات واریز</p>
                {selectedOrder.recipientName && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">دریافت‌کننده</span>
                    <span className="text-[11px] font-medium text-gray-900">{selectedOrder.recipientName}</span>
                  </div>
                )}
                {selectedOrder.recipientAccount && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">شماره حساب</span>
                    <span className="text-[11px] font-medium text-gray-900" dir="ltr">{selectedOrder.recipientAccount}</span>
                  </div>
                )}
                {selectedOrder.recipientMethod && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">نحوه واریز</span>
                    <span className="text-[11px] font-medium text-gray-900">{METHOD_LABELS[selectedOrder.recipientMethod] || selectedOrder.recipientMethod}</span>
                  </div>
                )}
                {selectedOrder.destinationCard && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">{selectedOrder.orderType === "BUY_PKR" ? "حساب پاکستانی" : "کارت مقصد"}</span>
                    <span className="text-[11px] font-medium text-gray-900" dir="ltr">{selectedOrder.destinationCard}</span>
                  </div>
                )}
                {selectedOrder.destinationSheba && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">شبا</span>
                    <span className="text-[11px] font-medium text-gray-900" dir="ltr">{selectedOrder.destinationSheba}</span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {selectedOrder.description && (
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-[10px] font-semibold text-gray-400 mb-1">توضیحات</p>
                <p className="text-[11px] text-gray-600 leading-relaxed">{selectedOrder.description}</p>
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-2.5">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
                <span className="text-[10px] text-gray-400">{new Date(selectedOrder.createdAt).toLocaleDateString("fa-IR")} {new Date(selectedOrder.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <span className="text-[10px] text-gray-400">{selectedOrder.user?.firstName} {selectedOrder.user?.lastName}</span>
            </div>

            {/* Action Buttons */}
            {selectedOrder.status !== "COMPLETED" && selectedOrder.status !== "CANCELLED" && (() => {
              const nextAction = getNextAction(selectedOrder.status, selectedOrder.orderType);
              return (
                <div className="space-y-2">
                  {nextAction && (
                    <button onClick={() => { handleStatus(selectedOrder.id, nextAction.next); setDetailSheetOpen(false); }} className="w-full rounded-xl bg-green-500 py-3 text-sm font-semibold text-white active:bg-green-600">{nextAction.label}</button>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(selectedOrder)} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-50 py-2.5 text-xs font-medium text-blue-600 active:bg-blue-100">
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} /> ویرایش
                    </button>
                    <button onClick={() => openDeleteConfirm(selectedOrder)} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-50 py-2.5 text-xs font-medium text-red-600 active:bg-red-100">
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} /> حذف
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </BottomSheet>

      {/* Edit BottomSheet */}
      <BottomSheet isOpen={editSheetOpen} onClose={() => { setEditSheetOpen(false); setEditingOrder(null); resetForm(); }} title="ویرایش سفارش" className="max-h-[85vh]">
        {formLoading ? (
          <div className="space-y-4">
            {editingOrder && (
              <div className="rounded-xl bg-blue-50 p-3 flex items-center justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            )}
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
            <Skeleton className="h-12 rounded-xl" />
          </div>
        ) : (
        <form onSubmit={handleEdit} className="space-y-4">
          {error && <ErrorAlert message={error} />}

          {editingOrder && (
            <div className="rounded-xl bg-blue-50 p-3 flex items-center justify-between">
              <span className="text-xs text-blue-600">نوع سفارش</span>
              <span className="text-xs font-bold text-blue-700">{ORDER_TYPE_LABELS[editingOrder.orderType]?.label}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">مشتری</label>
            <div className="relative">
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="flex h-12 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                <option value="">انتخاب مشتری</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
              </select>
              <ChevronLeft className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" strokeWidth={1.5} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">{editingOrder?.orderType === "IR_TO_PK" ? "مبلغ پرداختی (تومان)" : "مبلغ پرداختی (روپیه)"}</label>
            <Input type="text" inputMode="numeric" value={amount} onChange={(e) => setAmount(formatNum(e.target.value))} placeholder="0" className="h-12 text-left rounded-xl" />
          </div>

          {currentRates && editingOrder && (
            <div className="grid grid-cols-2 gap-2">
              {(editingOrder.orderType === "BUY_PKR" || editingOrder.orderType === "PK_TO_IR") && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">نرخ خرید روپیه</label>
                  <Input type="text" inputMode="numeric" value={buyRate} readOnly className="h-12 text-left rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed" />
                  <p className="text-[9px] text-gray-400">قفل شده - هنگام ایجاد سفارش ثبت شده</p>
                </div>
              )}
              {(editingOrder.orderType === "SELL_PKR" || editingOrder.orderType === "IR_TO_PK") && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">نرخ فروش روپیه</label>
                  <Input type="text" inputMode="numeric" value={sellRate} readOnly className="h-12 text-left rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed" />
                  <p className="text-[9px] text-gray-400">قفل شده - هنگام ایجاد سفارش ثبت شده</p>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">نرخ بازار روپیه</label>
                <Input type="text" inputMode="numeric" value={marketRate} onChange={(e) => setMarketRate(formatNum(e.target.value))} placeholder="0" className="h-12 text-left rounded-xl" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">کارمزد (تومان)</label>
            <Input type="text" inputMode="numeric" value={fee} onChange={(e) => setFee(formatNum(e.target.value))} placeholder="0" className="h-12 text-left rounded-xl" />
          </div>

          {editingOrder && isHawalaType(editingOrder.orderType) && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">هزینه انتقال (تومان)</label>
              <Input type="text" inputMode="numeric" value={transferCost} onChange={(e) => setTransferCost(formatNum(e.target.value))} placeholder="0" className="h-12 text-left rounded-xl" />
            </div>
          )}

          {editingOrder && isHawalaType(editingOrder.orderType) && (<>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">{editingOrder.orderType === "IR_TO_PK" ? "نام گیرنده" : "نام صاحب حساب"}</label>
              <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="نام کامل" className="h-12 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">{editingOrder.orderType === "IR_TO_PK" ? "نحوه واریز" : "شماره شبا"}</label>
              {editingOrder.orderType === "IR_TO_PK" ? (
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
            {editingOrder.orderType === "IR_TO_PK" ? (
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
              </>
            )}
          </>)}

          {editingOrder && !isHawalaType(editingOrder.orderType) && (<>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">{editingOrder.orderType === "BUY_PKR" ? "شماره حساب پاکستانی صراف" : "شماره کارت مقصد"}</label>
              <Input value={destinationCard} onChange={(e) => setDestinationCard(e.target.value)} placeholder={editingOrder.orderType === "BUY_PKR" ? "شماره حساب پاکستانی" : "شماره کارت"} className="h-12 rounded-xl" dir="ltr" />
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

          <Button type="submit" isLoading={submitting} className="w-full h-12 rounded-xl">ذخیره تغییرات</Button>
        </form>
        )}
      </BottomSheet>

      {/* Delete Confirmation */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                <Trash2 className="h-5 w-5 text-red-500" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">حذف سفارش</p>
                <p className="text-xs text-gray-500">آیا از حذف این سفارش مطمئن هستید؟</p>
              </div>
            </div>
            {deletingOrder && (
              <div className="rounded-xl bg-gray-50 p-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">نوع</span>
                  <span className="text-xs font-medium text-gray-900">{ORDER_TYPE_LABELS[deletingOrder.orderType]?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">مبلغ</span>
                  <span className="text-xs font-medium text-gray-900" dir="ltr">{Number(deletingOrder.totalToman).toLocaleString("en-US")} تومان</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">مشتری</span>
                  <span className="text-xs font-medium text-gray-900">{deletingOrder.customer.name}</span>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirmOpen(false)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 active:bg-gray-50">انصراف</button>
              <button onClick={handleDelete} className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white active:bg-red-600">حذف</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
