"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Loader2,
  Search,
  X,
  TrendingUp,
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

const FILTER_TABS = [
  { value: "all", label: "همه" },
  { value: "IN_PROGRESS", label: "در حال انجام" },
  { value: "COMPLETED", label: "تکمیل شده" },
  { value: "CANCELLED", label: "لغو شده" },
] as const;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<"all" | string>("all");
  const pageRef = useRef(1);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const filterRef = useRef("all");
  const PAGE_SIZE = 15;
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef("");

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
  const [editStatus, setEditStatus] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const hasHistoryRef = useRef(false);

  useEffect(() => {
    const handlePopState = () => {
      if (formSheetOpen) {
        setFormSheetOpen(false);
      } else if (subTypeSheetOpen) {
        setSubTypeSheetOpen(false);
      } else if (directionSheetOpen) {
        setDirectionSheetOpen(false);
      } else if (detailSheetOpen) {
        setDetailSheetOpen(false);
      } else if (editSheetOpen) {
        setEditSheetOpen(false);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [directionSheetOpen, subTypeSheetOpen, formSheetOpen, detailSheetOpen, editSheetOpen]);

  const anySheetOpen = directionSheetOpen || subTypeSheetOpen || formSheetOpen || detailSheetOpen || editSheetOpen;

  useEffect(() => {
    if (anySheetOpen && !hasHistoryRef.current) {
      hasHistoryRef.current = true;
      window.history.pushState({ sheet: true }, "");
    } else if (!anySheetOpen) {
      hasHistoryRef.current = false;
    }
  }, [anySheetOpen]);

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
    filterRef.current = filter;
    pageRef.current = 1;
    hasMoreRef.current = true;
    loadingMoreRef.current = false;
    setHasMore(true);
    setLoadingMore(false);
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (searchRef.current.trim()) params.set("search", searchRef.current.trim());
    params.set("page", "1");
    params.set("limit", String(PAGE_SIZE));
    api.get(`/api/orders?${params.toString()}`).then((data) => {
      setOrders(data.orders);
      const more = data.orders.length < data.total;
      hasMoreRef.current = more;
      setHasMore(more);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [filter]);

  const loadFormData = () => {
    setFormLoading(true);
    Promise.all([api.get("/api/customers"), api.get("/api/currencies"), api.get("/api/rates")]).then(([c, cur, rates]) => {
      setCustomers(c.customers || []);
      if (c.customers && c.customers.length > 0) setCustomerId(c.customers[0].id);
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

  const loadEditFormData = () => {
    setFormLoading(true);
    api.get("/api/customers").then((c) => {
      setCustomers(c.customers || []);
    }).catch(() => {}).finally(() => setFormLoading(false));
  };

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    const params = new URLSearchParams();
    if (filterRef.current !== "all") params.set("status", filterRef.current);
    if (searchRef.current.trim()) params.set("search", searchRef.current.trim());
    params.set("page", String(nextPage));
    params.set("limit", String(PAGE_SIZE));
    api.get(`/api/orders?${params.toString()}`).then((data) => {
      setOrders((prev) => [...prev, ...data.orders]);
      pageRef.current = nextPage;
      const more = data.orders.length >= PAGE_SIZE && (pageRef.current * PAGE_SIZE) < data.total;
      hasMoreRef.current = more;
      setHasMore(more);
    }).catch(() => {}).finally(() => {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    });
  }, []);

  useEffect(() => {
    const scrollContainer = document.querySelector("[data-scroll-container]");
    if (!scrollContainer) return;

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      if (scrollHeight - scrollTop - clientHeight < 200) {
        loadMore();
      }
    };

    scrollContainer.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => scrollContainer.removeEventListener("scroll", onScroll);
  }, [loadMore]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      searchRef.current = value;
      pageRef.current = 1;
      hasMoreRef.current = true;
      loadingMoreRef.current = false;
      setHasMore(true);
      setLoadingMore(false);
      setLoading(true);
      const params = new URLSearchParams();
      if (filterRef.current !== "all") params.set("status", filterRef.current);
      if (value.trim()) params.set("search", value.trim());
      params.set("page", "1");
      params.set("limit", String(PAGE_SIZE));
      api.get(`/api/orders?${params.toString()}`).then((data) => {
        setOrders(data.orders);
        const more = data.orders.length < data.total;
        hasMoreRef.current = more;
        setHasMore(more);
        setLoading(false);
      }).catch(() => setLoading(false));
    }, 350);
  };

  const clearSearch = () => {
    setSearchQuery("");
    searchRef.current = "";
    pageRef.current = 1;
    hasMoreRef.current = true;
    loadingMoreRef.current = false;
    setHasMore(true);
    setLoadingMore(false);
    setLoading(true);
    const params = new URLSearchParams();
    if (filterRef.current !== "all") params.set("status", filterRef.current);
    params.set("page", "1");
    params.set("limit", String(PAGE_SIZE));
    api.get(`/api/orders?${params.toString()}`).then((data) => {
      setOrders(data.orders);
      const more = data.orders.length < data.total;
      hasMoreRef.current = more;
      setHasMore(more);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const handleStatus = async (id: string, status: string, onSuccess?: () => void) => {
    setStatusLoading(id);
    try {
      await api.patch("/api/orders", { id, status });
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
      if (onSuccess) onSuccess();
    } catch {}
    setStatusLoading(null);
  };

  const getNextAction = (status: string) => {
    if (status === "IN_PROGRESS") return { label: "تکمیل شده", next: "COMPLETED" };
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
      setTimeout(() => setSuccess(false), 2000);
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
    setEditStatus(order.status);
    setCurrentRates({
      buyRate: Number(order.buyRateAtTime || 0),
      sellRate: Number(order.sellRateAtTime || 0),
      marketRate: Number(order.marketRateAtTime || 0),
    });
    setError(null);
    setDetailSheetOpen(false);
    loadEditFormData();
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
        customerId, currencyId, amount, buyRate, sellRate, marketRate, fee, transferCost,
        recipientName, recipientAccount, recipientMethod,
        destinationCard, destinationSheba, description, status: editStatus,
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
    setDeleting(true);
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
    setDeleting(false);
  };

  const typeInfo = selectedType ? ORDER_TYPE_LABELS[selectedType] : null;
  const subTypes = selectedDirection ? SUB_TYPES[selectedDirection.id] || [] : [];

  return (
    <main className="min-h-dvh bg-[#fafafa]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100/80">
        {/* Title */}
        <div className="flex h-14 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[17px] font-bold tracking-tight text-gray-900">سفارشات</h1>
            {!loading && orders.length > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-100 px-1.5 text-[10px] font-bold text-gray-500 tabular-nums">
                {orders.length}
              </span>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative group">
            <Search className="absolute right-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-gray-300 group-focus-within:text-gray-500 transition-colors" strokeWidth={1.5} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="جستجو بر اساس نام مشتری..."
              className="h-10 w-full rounded-[5px] border border-gray-100 bg-gray-50/80 pr-10 pl-9 text-[13px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-gray-200 focus:bg-white focus:shadow-sm transition-all"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="absolute left-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200/60 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
                <X className="h-3 w-3" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 pb-3">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {FILTER_TABS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  "rounded-[5px] px-4 py-1.5 text-[11px] font-semibold transition-all duration-200 whitespace-nowrap",
                  filter === value
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-gray-100/70 text-gray-400 hover:text-gray-600"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-28">
        {loading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-[5px] bg-white border border-gray-200/80 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="h-9 w-9 rounded-[5px]" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-2.5 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-14 rounded-[3px]" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-2.5 w-32" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-[5px] bg-gray-50 mb-4">
              {searchQuery ? (
                <Search className="h-7 w-7 text-gray-300" strokeWidth={1.5} />
              ) : (
                <ArrowDownToLine className="h-7 w-7 text-gray-300" strokeWidth={1.5} />
              )}
            </div>
            <p className="text-sm font-medium text-gray-400">
              {searchQuery ? "نتیجه‌ای یافت نشد" : "سفارشی ثبت نشده"}
            </p>
            <p className="text-xs text-gray-300 mt-1">
              {searchQuery ? `برای «${searchQuery}» سفارشی وجود ندارد` : "برای شروع، دکمه + را بزنید"}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {orders.map((o) => {
              const typeInfo = ORDER_TYPE_LABELS[o.orderType] || { label: o.orderType, short: o.orderType, color: "text-gray-600", bg: "bg-gray-50 text-gray-600" };
              const Icon = ICON_MAP[o.orderType] || ArrowDownToLine;
              const nextAction = getNextAction(o.status);
              const isTomanAmt = o.orderType === "IR_TO_PK" || o.orderType === "SELL_PKR";
              const orderRate = isTomanAmt ? Number(o.sellRateAtTime || 0) : Number(o.buyRateAtTime || 0);
              const pkrValue = isTomanAmt && Number(o.calculatedPkr) > 0 ? Number(o.calculatedPkr) : Number(o.amount);
              const isLoadingThis = statusLoading === o.id;
              return (
                <div
                  key={o.id}
                  className="rounded-[5px] bg-white border border-gray-200/80 p-4 active:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => openDetail(o)}
                >
                  {/* Top row: icon + type + status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-gray-50">
                        <Icon className={cn("h-[18px] w-[18px]", typeInfo.color)} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900 leading-tight">{typeInfo.label}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{o.customer.name}</p>
                      </div>
                    </div>
                    <span className={cn("rounded-[3px] px-2 py-0.5 text-[10px] font-semibold", STATUS_COLORS[o.status])}>
                      {STATUS_LABELS[o.status]}
                    </span>
                  </div>

                  {/* Middle row: rate + PKR amount */}
                  <div className="flex items-center gap-3 mb-2.5">
                    {orderRate > 0 && (
                      <div className="flex items-center gap-1 rounded-[3px] bg-gray-50 px-2 py-1">
                        <span className="text-[10px] text-gray-400">{isTomanAmt ? "نرخ فروش" : "نرخ خرید"}</span>
                        <span className="text-[11px] font-semibold text-gray-700 tabular-nums" dir="ltr">{orderRate.toLocaleString("en-US")}</span>
                      </div>
                    )}
                    {pkrValue > 0 && (
                      <div className="flex items-center gap-1 rounded-[3px] bg-gray-50 px-2 py-1">
                        <span className="text-[10px] text-gray-400">روپیه</span>
                        <span className="text-[11px] font-semibold text-gray-700 tabular-nums" dir="ltr">{pkrValue.toLocaleString("en-US")}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom row: date + profit + amount */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">{new Date(o.createdAt).toLocaleDateString("fa-IR")}</span>
                    <div className="flex items-center gap-3">
                      {Number(o.totalProfitAmount) > 0 && (
                        <div className="flex items-center gap-1 rounded-[3px] bg-emerald-50 px-2 py-1">
                          <TrendingUp className="h-3 w-3 text-emerald-600" strokeWidth={2} />
                          <span className="text-[11px] font-semibold text-emerald-700 tabular-nums" dir="ltr">{Number(o.totalProfitAmount).toLocaleString("en-US")}</span>
                          <span className="text-[9px] text-emerald-500">سود</span>
                        </div>
                      )}
                      <span className="text-sm font-bold text-gray-900 tabular-nums" dir="ltr">
                        {Number(o.totalToman).toLocaleString("en-US")} <span className="text-[10px] font-normal text-gray-400">تومان</span>
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
            {hasMore && <div className="h-1" />}
            {loadingMore && (
              <div className="space-y-2.5">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={`shimmer-${i}`} className="rounded-[5px] bg-white border border-gray-200/80 p-4 animate-pulse">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-[5px]" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3 w-28" />
                          <Skeleton className="h-2.5 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-14 rounded-[3px]" />
                    </div>
                    <div className="flex gap-2 mb-2.5">
                      <Skeleton className="h-6 w-20 rounded-[3px]" />
                      <Skeleton className="h-6 w-24 rounded-[3px]" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-2.5 w-20" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setDirectionSheetOpen(true)}
        className="fixed bottom-24 left-4 z-30 flex h-12 items-center gap-2 rounded-[5px] bg-gray-900 pl-4 pr-3 text-white shadow-lg shadow-gray-900/20 transition-all active:scale-95 hover:bg-gray-800"
      >
        <span className="text-[13px] font-semibold">ثبت سفارش</span>
        <Plus className="h-5 w-5" strokeWidth={2} />
      </button>

      {/* Success Toast */}
      {success && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-[5px] bg-white border border-gray-100 px-4 py-3 shadow-lg shadow-black/5 animate-slide-up">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
          <span className="text-[13px] font-medium text-gray-700">سفارش ثبت شد</span>
        </div>
      )}

      {/* Error Toast */}
      {errorToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-[5px] bg-white border border-gray-100 px-4 py-3 shadow-lg shadow-black/5 animate-slide-up max-w-[90vw]">
          <AlertCircle className="h-4.5 w-4.5 text-red-500 flex-shrink-0" />
          <span className="text-[13px] font-medium text-gray-700">{errorToast}</span>
        </div>
      )}

      {/* Direction Selection BottomSheet */}
      <BottomSheet isOpen={directionSheetOpen} onClose={() => setDirectionSheetOpen(false)} title="نوع تبدیل">
        <div className="space-y-2.5">
          {DIRECTIONS.map((d) => {
            const Icon = d.icon;
            return (
              <button
                key={d.id}
                onClick={() => selectDirection(d)}
                className="w-full flex items-center gap-4 rounded-[5px] border border-gray-100 p-4 text-right transition-all active:bg-gray-50 hover:border-gray-200"
              >
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-[5px]", d.color)}>
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-gray-900">{d.label}</p>
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
        <div className="space-y-2.5">
          {subTypes.map((st) => (
            <button
              key={st.id}
              onClick={() => selectSubType(st.id)}
              className="w-full flex items-center gap-4 rounded-[5px] border border-gray-100 p-4 text-right transition-all active:bg-gray-50 hover:border-gray-200"
            >
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-[5px] text-white", st.color)}>
                {st.id === "IR_TO_PK" || st.id === "SELL_PKR" ? <Send className="h-5 w-5" strokeWidth={1.5} /> : <ArrowDownToLine className="h-5 w-5" strokeWidth={1.5} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-gray-900">{st.label}</p>
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
            <div className="rounded-[5px] bg-gray-50 p-4 space-y-3">
              <Skeleton className="h-3 w-24" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-14 rounded-[5px]" />
                <Skeleton className="h-14 rounded-[5px]" />
                <Skeleton className="h-14 rounded-[5px]" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-12 rounded-[5px]" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-12 rounded-[5px]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-12 rounded-[5px]" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-12 rounded-[5px]" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-12 rounded-[5px]" />
            </div>
            <Skeleton className="h-12 rounded-[5px]" />
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorAlert message={error} />}

          {/* Rate Display Card */}
          {currentRates && (
            <div className="rounded-[5px] bg-gray-50 p-4 space-y-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">نرخ لحظه معامله</p>
              <div className="grid grid-cols-3 gap-2">
                {currentRates.marketRate > 0 && (
                  <div className="rounded-[5px] bg-white p-2.5 text-center border border-gray-100/80">
                    <span className="text-[9px] text-gray-400">بازار</span>
                    <p className="text-[12px] font-bold text-gray-700 mt-0.5" dir="ltr">{currentRates.marketRate.toLocaleString("en-US")}</p>
                  </div>
                )}
                <div className="rounded-[5px] bg-blue-50 p-2.5 text-center">
                  <span className="text-[9px] text-blue-500">خرید</span>
                  <p className="text-[12px] font-bold text-blue-700 mt-0.5" dir="ltr">{currentRates.buyRate.toLocaleString("en-US")}</p>
                </div>
                <div className="rounded-[5px] bg-emerald-50 p-2.5 text-center">
                  <span className="text-[9px] text-emerald-500">فروش</span>
                  <p className="text-[12px] font-bold text-emerald-700 mt-0.5" dir="ltr">{currentRates.sellRate.toLocaleString("en-US")}</p>
                </div>
              </div>
            </div>
          )}

          {/* Profit Formula Info */}
          {selectedType && (
            <div className="rounded-[5px] bg-amber-50 p-4 space-y-2.5">
              <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">نحوه محاسبه سود</p>
              {selectedType === "BUY_PKR" && (
                <div className="space-y-2">
                  <p className="text-[11px] text-amber-700 font-medium">خرید روپیه از مشتری</p>
                  <p className="text-[10px] text-amber-600 leading-relaxed">
                    روپیه از مشتری دریافت می‌شود و تومان پرداخت می‌شود. سود از اختلاف نرخ بازار و نرخ خرید محاسبه می‌شود.
                  </p>
                  <div className="rounded-[5px] bg-white p-2.5 border border-amber-100/80">
                    <p className="text-[10px] text-amber-700 font-medium mb-1">سود خرید:</p>
                    <p className="text-[9px] text-amber-600" dir="ltr">(نرخ بازار - نرخ خرید) × مقدار روپیه</p>
                  </div>
                </div>
              )}
              {selectedType === "SELL_PKR" && (
                <div className="space-y-2">
                  <p className="text-[11px] text-amber-700 font-medium">فروش روپیه به مشتری</p>
                  <p className="text-[10px] text-amber-600 leading-relaxed">
                    تومان از مشتری دریافت می‌شود و روپیه تحویل داده می‌شود. سود از اختلاف نرخ فروش و نرخ بازار محاسبه می‌شود.
                  </p>
                  <div className="rounded-[5px] bg-white p-2.5 border border-amber-100/80">
                    <p className="text-[10px] text-amber-700 font-medium mb-1">سود فروش:</p>
                    <p className="text-[9px] text-amber-600" dir="ltr">(نرخ فروش - نرخ بازار) × مقدار روپیه</p>
                  </div>
                </div>
              )}
              {selectedType === "IR_TO_PK" && (
                <div className="space-y-2">
                  <p className="text-[11px] text-amber-700 font-medium">حواله ایران به پاکستان</p>
                  <p className="text-[10px] text-amber-600 leading-relaxed">
                    تومان از مشتری دریافت می‌شود و روپیه به حساب مقصد در پاکستان واریز می‌شود. سود از اختلاف نرخ فروش و نرخ بازار محاسبه می‌شود.
                  </p>
                  <div className="rounded-[5px] bg-white p-2.5 border border-amber-100/80">
                    <p className="text-[10px] text-amber-700 font-medium mb-1">محاسبه روپیه:</p>
                    <p className="text-[9px] text-amber-600" dir="ltr">مبلغ تومان ÷ نرخ تبدیل = مقدار روپیه</p>
                  </div>
                  <div className="rounded-[5px] bg-white p-2.5 border border-amber-100/80">
                    <p className="text-[10px] text-amber-700 font-medium mb-1">سود حواله:</p>
                    <p className="text-[9px] text-amber-600" dir="ltr">(نرخ فروش - نرخ بازار) × مقدار روپیه</p>
                  </div>
                </div>
              )}
              {selectedType === "PK_TO_IR" && (
                <div className="space-y-2">
                  <p className="text-[11px] text-amber-700 font-medium">حواله پاکستان به ایران</p>
                  <p className="text-[10px] text-amber-600 leading-relaxed">
                    روپیه از مشتری دریافت می‌شود و تومان به حساب بانکی ایران واریز می‌شود. سود از اختلاف نرخ بازار و نرخ خرید محاسبه می‌شود.
                  </p>
                  <div className="rounded-[5px] bg-white p-2.5 border border-amber-100/80">
                    <p className="text-[10px] text-amber-700 font-medium mb-1">محاسبه تومان:</p>
                    <p className="text-[9px] text-amber-600" dir="ltr">مقدار روپیه × نرخ تبدیل = مبلغ تومان</p>
                  </div>
                  <div className="rounded-[5px] bg-white p-2.5 border border-amber-100/80">
                    <p className="text-[10px] text-amber-700 font-medium mb-1">سود دریافت:</p>
                    <p className="text-[9px] text-amber-600" dir="ltr">(نرخ بازار - نرخ خرید) × مقدار روپیه</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">مشتری</label>
            <div className="relative">
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="flex h-12 w-full appearance-none rounded-[5px] border border-gray-200 bg-white px-4 pr-10 text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/10 transition-colors">
                <option value="">انتخاب مشتری</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
              </select>
              <ChevronLeft className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" strokeWidth={1.5} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">{isTomanAmount ? "مبلغ پرداختی (تومان)" : "مبلغ پرداختی (روپیه)"}</label>
            <Input type="text" inputMode="numeric" value={amount} onChange={(e) => setAmount(formatNum(e.target.value))} placeholder="0" className="h-12 text-left rounded-[5px]" />
          </div>

          {currentRates && selectedType && (
            <div className="grid grid-cols-2 gap-2">
              {(selectedType === "BUY_PKR" || selectedType === "PK_TO_IR") && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">نرخ خرید روپیه</label>
                  <Input type="text" inputMode="numeric" value={buyRate} onChange={(e) => setBuyRate(formatNum(e.target.value))} placeholder="0" className="h-12 text-left rounded-[5px]" />
                </div>
              )}
              {(selectedType === "SELL_PKR" || selectedType === "IR_TO_PK") && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">نرخ فروش روپیه</label>
                  <Input type="text" inputMode="numeric" value={sellRate} onChange={(e) => setSellRate(formatNum(e.target.value))} placeholder="0" className="h-12 text-left rounded-[5px]" />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">نرخ بازار روپیه</label>
                <Input type="text" inputMode="numeric" value={marketRate} onChange={(e) => setMarketRate(formatNum(e.target.value))} placeholder="0" className="h-12 text-left rounded-[5px]" />
              </div>
            </div>
          )}

          {amountNum > 0 && rateNum > 0 && (
            <div className={cn("rounded-[5px] p-4", isTomanAmount ? "bg-emerald-50" : "bg-blue-50")}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn("text-[11px]", isTomanAmount ? "text-emerald-500" : "text-blue-500")}>{isTomanAmount ? "مبلغ پرداختی (تومان)" : "مبلغ پرداختی (روپیه)"}</span>
                <span className={cn("text-[15px] font-bold tabular-nums", isTomanAmount ? "text-emerald-700" : "text-blue-700")} dir="ltr">{isTomanAmount ? totalToman.toLocaleString("en-US") : calculatedPkr.toLocaleString("en-US")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={cn("text-[11px]", isTomanAmount ? "text-emerald-500" : "text-blue-500")}>{isTomanAmount ? "مبلغ دریافتی (روپیه)" : "مبلغ دریافتی (تومان)"}</span>
                <span className={cn("text-[13px] font-semibold tabular-nums", isTomanAmount ? "text-emerald-600" : "text-blue-600")} dir="ltr">{isTomanAmount ? calculatedPkr.toLocaleString("en-US") : totalToman.toLocaleString("en-US")}</span>
              </div>
            </div>
          )}

          {/* Profit Preview */}
          {amountNum > 0 && rateNum > 0 && currentRates && (
            <div className="rounded-[5px] bg-emerald-50 p-4 space-y-3">
              <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">پیش‌نمایش سود</p>
              <div className="space-y-2">
                {previewMainProfit > 0 && (
                  <div className="rounded-[5px] bg-white p-2.5 border border-emerald-100/80">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-emerald-600">{mainProfitLabel}</span>
                      <span className="text-[13px] font-bold text-emerald-700 tabular-nums" dir="ltr">{previewMainProfit.toLocaleString("en-US")} <span className="text-[9px] font-normal text-emerald-500">تومان</span></span>
                    </div>
                    <p className="text-[9px] text-emerald-500" dir="ltr">{mainProfitFormula}</p>
                  </div>
                )}
                {feeNum > 0 && (
                  <div className="rounded-[5px] bg-white p-2.5 border border-emerald-100/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-emerald-600">کارمزد (+)</span>
                      <span className="text-[13px] font-bold text-emerald-700 tabular-nums" dir="ltr">{feeNum.toLocaleString("en-US")} <span className="text-[9px] font-normal text-emerald-500">تومان</span></span>
                    </div>
                  </div>
                )}
                {transferCostNum > 0 && (
                  <div className="rounded-[5px] bg-white p-2.5 border border-red-100/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-red-500">هزینه انتقال (-)</span>
                      <span className="text-[13px] font-bold text-red-600 tabular-nums" dir="ltr">{transferCostNum.toLocaleString("en-US")} <span className="text-[9px] font-normal text-red-400">تومان</span></span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-emerald-200/60 pt-2.5">
                <span className="text-[12px] font-medium text-emerald-600">سود کل</span>
                <span className="text-[15px] font-bold text-emerald-800 tabular-nums" dir="ltr">{previewTotalProfit.toLocaleString("en-US")} <span className="text-[9px] font-normal text-emerald-600">تومان</span></span>
              </div>
            </div>
          )}

          {isHawala && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">هزینه انتقال (تومان)</label>
              <Input type="text" inputMode="numeric" value={transferCost} onChange={(e) => setTransferCost(formatNum(e.target.value))} placeholder="0" className="h-12 text-left rounded-[5px]" />
            </div>
          )}

          {/* Hawala fields */}
          {isHawala && (<>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">{selectedType === "IR_TO_PK" ? "نام گیرنده" : "نام صاحب حساب"}</label>
              <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="نام کامل" className="h-12 rounded-[5px]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">{selectedType === "IR_TO_PK" ? "نحوه واریز" : "شماره شبا"}</label>
              {selectedType === "IR_TO_PK" ? (
                <select value={recipientMethod} onChange={(e) => setRecipientMethod(e.target.value)} className="flex h-12 w-full rounded-[5px] border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/10 transition-colors">
                  <option value="EASYPAISA">Easypaisa</option>
                  <option value="JAZZCASH">JazzCash</option>
                  <option value="BANK_TRANSFER">حواله بانکی</option>
                  <option value="CASH">نقدی</option>
                </select>
              ) : (
                <Input value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value)} placeholder="IR..." className="h-12 rounded-[5px]" dir="ltr" />
              )}
            </div>
            {selectedType === "IR_TO_PK" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">شماره حساب / IBAN</label>
                <Input value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value)} placeholder="شماره حساب" className="h-12 rounded-[5px]" dir="ltr" />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">شماره کارت</label>
                  <Input value={destinationCard} onChange={(e) => setDestinationCard(e.target.value)} placeholder="شماره کارت" className="h-12 rounded-[5px]" dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">بانک</label>
                  <Input value={recipientMethod} onChange={(e) => setRecipientMethod(e.target.value)} placeholder="نام بانک" className="h-12 rounded-[5px]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">شماره موبایل</label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="اختیاری" className="h-12 rounded-[5px]" dir="ltr" />
                </div>
              </>
            )}
          </>)}

          {/* Card fields */}
          {!isHawala && (<>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">{selectedType === "BUY_PKR" ? "شماره حساب پاکستانی صراف" : "شماره کارت مقصد"}</label>
              <Input value={destinationCard} onChange={(e) => setDestinationCard(e.target.value)} placeholder={selectedType === "BUY_PKR" ? "شماره حساب پاکستانی" : "شماره کارت"} className="h-12 rounded-[5px]" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">شماره شبا (اختیاری)</label>
              <Input value={destinationSheba} onChange={(e) => setDestinationSheba(e.target.value)} placeholder="IR..." className="h-12 rounded-[5px]" dir="ltr" />
            </div>
          </>)}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">توضیحات</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="اختیاری" rows={2} className="flex w-full rounded-[5px] border border-gray-200 bg-white px-3 py-2.5 text-sm placeholder:text-gray-300 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/10 transition-colors" />
          </div>

          <Button type="submit" isLoading={submitting} className="w-full h-12 rounded-[5px] bg-gray-900 hover:bg-gray-800">ثبت سفارش</Button>
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
                <div className="flex h-12 w-12 items-center justify-center rounded-[5px] bg-gray-50">
                  <Icon className={cn("h-5 w-5", ti?.color)} strokeWidth={1.5} />
                </div>
              ); })()}
              <div className="flex-1">
                <p className="text-[13px] font-bold text-gray-900">{ORDER_TYPE_LABELS[selectedOrder.orderType]?.label || selectedOrder.orderType}</p>
                <span className={cn("inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", STATUS_COLORS[selectedOrder.status])}>{STATUS_LABELS[selectedOrder.status]}</span>
              </div>
            </div>

            {/* Customer */}
            <div className="flex items-center gap-2.5 rounded-[5px] bg-gray-50 p-3">
              <User className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
              <span className="text-[13px] font-medium text-gray-700">{selectedOrder.customer.name}</span>
              <span className="text-[11px] text-gray-400" dir="ltr">{selectedOrder.customer.phone}</span>
              <span className="mr-auto text-[11px] text-gray-400">{selectedOrder.currency.code}</span>
            </div>

            {/* Amount & Rates */}
            {(() => {
              const ot = selectedOrder.orderType;
              const isTomanAmt = ot === "IR_TO_PK" || ot === "SELL_PKR";
              const orderRate = isTomanAmt ? Number(selectedOrder.sellRateAtTime || 0) : Number(selectedOrder.buyRateAtTime || 0);
              return (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-[5px] border border-gray-100/80 p-3 text-center">
                      <p className="text-[10px] text-gray-400">{isTomanAmt ? "مبلغ (تومان)" : "مبلغ (روپیه)"}</p>
                      <p className="text-[15px] font-bold text-gray-900 mt-1 tabular-nums" dir="ltr">{Number(selectedOrder.amount).toLocaleString("en-US")}</p>
                    </div>
                    <div className="rounded-[5px] border border-gray-100/80 p-3 text-center">
                      <p className="text-[10px] text-gray-400">{isTomanAmt ? "نرخ فروش" : "نرخ خرید"}</p>
                      <p className="text-[15px] font-bold text-gray-900 mt-1 tabular-nums" dir="ltr">{orderRate.toLocaleString("en-US")} <span className="text-[9px] font-normal text-gray-400">تومان</span></p>
                    </div>
                  </div>
                  {isTomanAmt && Number(selectedOrder.calculatedPkr) > 0 && (
                    <div className="rounded-[5px] border border-blue-100/80 bg-blue-50 p-3 text-center">
                      <p className="text-[10px] text-blue-500">روپیه محاسبه شده</p>
                      <p className="text-[15px] font-bold text-blue-600 mt-1 tabular-nums" dir="ltr">{Number(selectedOrder.calculatedPkr).toLocaleString("en-US")} <span className="text-[9px] font-normal text-blue-400">روپیه</span></p>
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
                <div className="rounded-[5px] bg-emerald-50 p-4 space-y-2.5">
                  <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">تحلیل سود</p>
                  {mktRate > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-emerald-600">نرخ بازار</span>
                      <span className="text-[12px] font-bold text-emerald-700 tabular-nums" dir="ltr">{mktRate.toLocaleString("en-US")} <span className="text-[9px] font-normal text-emerald-500">تومان</span></span>
                    </div>
                  )}
                  {mainProfit !== 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-emerald-600">{ot === "BUY_PKR" ? "سود خرید نسبت به بازار" : ot === "SELL_PKR" ? "سود فروش نسبت به بازار" : ot === "IR_TO_PK" ? "سود حواله" : "سود دریافت روپیه"}</span>
                      <span className="text-[12px] font-bold text-emerald-700 tabular-nums" dir="ltr">{mainProfit.toLocaleString("en-US")} <span className="text-[9px] font-normal text-emerald-500">تومان</span></span>
                    </div>
                  )}
                  {feeAmt > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-emerald-600">(+ ) کارمزد</span>
                      <span className="text-[12px] font-bold text-emerald-700 tabular-nums" dir="ltr">+{feeAmt.toLocaleString("en-US")} <span className="text-[9px] font-normal text-emerald-500">تومان</span></span>
                    </div>
                  )}
                  {transferAmt > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-red-500">(-) هزینه انتقال</span>
                      <span className="text-[12px] font-bold text-red-600 tabular-nums" dir="ltr">-{transferAmt.toLocaleString("en-US")} <span className="text-[9px] font-normal text-red-400">تومان</span></span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-emerald-200/60 pt-2.5">
                    <span className="text-[12px] font-semibold text-emerald-600">سود نهایی</span>
                    <span className="text-[15px] font-bold text-emerald-800 tabular-nums" dir="ltr">{totalProfit.toLocaleString("en-US")} <span className="text-[9px] font-normal text-emerald-600">تومان</span></span>
                  </div>
                </div>
              );
            })()}

            {/* Recipient / Destination */}
            {(selectedOrder.recipientName || selectedOrder.destinationCard) && (
              <div className="rounded-[5px] bg-gray-50 p-3.5 space-y-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">اطلاعات واریز</p>
                {selectedOrder.recipientName && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">دریافت‌کننده</span>
                    <span className="text-[12px] font-medium text-gray-900">{selectedOrder.recipientName}</span>
                  </div>
                )}
                {selectedOrder.recipientAccount && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">شماره حساب</span>
                    <span className="text-[12px] font-medium text-gray-900 tabular-nums" dir="ltr">{selectedOrder.recipientAccount}</span>
                  </div>
                )}
                {selectedOrder.recipientMethod && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">نحوه واریز</span>
                    <span className="text-[12px] font-medium text-gray-900">{METHOD_LABELS[selectedOrder.recipientMethod] || selectedOrder.recipientMethod}</span>
                  </div>
                )}
                {selectedOrder.destinationCard && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">{selectedOrder.orderType === "BUY_PKR" ? "حساب پاکستانی" : "کارت مقصد"}</span>
                    <span className="text-[12px] font-medium text-gray-900 tabular-nums" dir="ltr">{selectedOrder.destinationCard}</span>
                  </div>
                )}
                {selectedOrder.destinationSheba && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">شبا</span>
                    <span className="text-[12px] font-medium text-gray-900 tabular-nums" dir="ltr">{selectedOrder.destinationSheba}</span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {selectedOrder.description && (
              <div className="rounded-[5px] bg-gray-50 p-3.5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">توضیحات</p>
                <p className="text-[12px] text-gray-600 leading-relaxed">{selectedOrder.description}</p>
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center justify-between rounded-[5px] bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
                <span className="text-[11px] text-gray-400">{new Date(selectedOrder.createdAt).toLocaleDateString("fa-IR")} {new Date(selectedOrder.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <span className="text-[11px] text-gray-400">{selectedOrder.user?.firstName} {selectedOrder.user?.lastName}</span>
            </div>

            {/* Action Buttons */}
            {(() => {
              const nextAction = getNextAction(selectedOrder.status);
              const isLoadingDetail = statusLoading === selectedOrder.id;
              const isEditable = selectedOrder.status === "IN_PROGRESS";
              return (
                <div className="space-y-2">
                  {isLoadingDetail && (
                    <div className="flex items-center justify-center gap-2 py-2 text-[12px] text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      <span>در حال پردازش...</span>
                    </div>
                  )}
                  {isEditable && nextAction && (
                    <button onClick={() => handleStatus(selectedOrder.id, nextAction.next, () => setDetailSheetOpen(false))} disabled={isLoadingDetail} className="w-full flex items-center justify-center gap-1.5 rounded-[5px] bg-gray-900 py-3 text-[13px] font-semibold text-white active:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                      {isLoadingDetail ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {isLoadingDetail ? "در حال تکمیل..." : nextAction.label}
                    </button>
                  )}
                  <div className="flex gap-2">
                    {isEditable && (
                      <button onClick={() => handleStatus(selectedOrder.id, "CANCELLED", () => setDetailSheetOpen(false))} disabled={isLoadingDetail} className="flex-1 flex items-center justify-center gap-1.5 rounded-[5px] border border-red-200 bg-red-50 py-2.5 text-[12px] font-medium text-red-600 active:bg-red-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoadingDetail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        {isLoadingDetail ? "در حال لغو..." : "لغو"}
                      </button>
                    )}
                    <button onClick={() => openEdit(selectedOrder)} disabled={isLoadingDetail} className={cn("flex-1 flex items-center justify-center gap-1.5 rounded-[5px] border border-gray-200 py-2.5 text-[12px] font-medium text-gray-600 active:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed", !isEditable && "w-full")}>
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} /> ویرایش
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
              <div className="rounded-[5px] bg-blue-50 p-3 flex items-center justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            )}
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-12 rounded-[5px]" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-12 rounded-[5px]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-12 rounded-[5px]" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-12 rounded-[5px]" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-12 rounded-[5px]" />
            </div>
            <Skeleton className="h-12 rounded-[5px]" />
          </div>
        ) : (
        <form onSubmit={handleEdit} className="space-y-4">
          {error && <ErrorAlert message={error} />}

          {editingOrder && (
            <div className="rounded-[5px] bg-blue-50 p-3 flex items-center justify-between">
              <span className="text-[12px] text-blue-600">نوع سفارش</span>
              <span className="text-[12px] font-bold text-blue-700">{ORDER_TYPE_LABELS[editingOrder.orderType]?.label}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">مشتری</label>
            <div className="relative">
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="flex h-12 w-full appearance-none rounded-[5px] border border-gray-200 bg-white px-4 pr-10 text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/10 transition-colors">
                <option value="">انتخاب مشتری</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
              </select>
              <ChevronLeft className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" strokeWidth={1.5} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">{editingOrder?.orderType === "IR_TO_PK" ? "مبلغ پرداختی (تومان)" : "مبلغ پرداختی (روپیه)"}</label>
            <Input type="text" inputMode="numeric" value={amount} onChange={(e) => setAmount(formatNum(e.target.value))} placeholder="0" className="h-12 text-left rounded-[5px]" />
          </div>

          {currentRates && editingOrder && (
            <div className="grid grid-cols-2 gap-2">
              {(editingOrder.orderType === "BUY_PKR" || editingOrder.orderType === "PK_TO_IR") && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">نرخ خرید روپیه</label>
                  <Input type="text" inputMode="numeric" value={buyRate} onChange={(e) => setBuyRate(formatNum(e.target.value))} placeholder="0" className="h-12 text-left rounded-[5px]" />
                </div>
              )}
              {(editingOrder.orderType === "SELL_PKR" || editingOrder.orderType === "IR_TO_PK") && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">نرخ فروش روپیه</label>
                  <Input type="text" inputMode="numeric" value={sellRate} onChange={(e) => setSellRate(formatNum(e.target.value))} placeholder="0" className="h-12 text-left rounded-[5px]" />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">نرخ بازار روپیه</label>
                <Input type="text" inputMode="numeric" value={marketRate} onChange={(e) => setMarketRate(formatNum(e.target.value))} placeholder="0" className="h-12 text-left rounded-[5px]" />
              </div>
            </div>
          )}

          {/* Profit Preview in Edit */}
          {editingOrder && amountNum > 0 && rateNum > 0 && (
            <div className="rounded-[5px] bg-emerald-50 p-4 space-y-3">
              <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">پیش‌نمایش سود</p>
              <div className="space-y-2">
                {previewMainProfit > 0 && (
                  <div className="rounded-[5px] bg-white p-2.5 border border-emerald-100/80">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-emerald-600">{mainProfitLabel}</span>
                      <span className="text-[13px] font-bold text-emerald-700 tabular-nums" dir="ltr">{previewMainProfit.toLocaleString("en-US")} <span className="text-[9px] font-normal text-emerald-500">تومان</span></span>
                    </div>
                    <p className="text-[9px] text-emerald-500" dir="ltr">{mainProfitFormula}</p>
                  </div>
                )}
                {feeNum > 0 && (
                  <div className="rounded-[5px] bg-white p-2.5 border border-emerald-100/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-emerald-600">کارمزد (+)</span>
                      <span className="text-[13px] font-bold text-emerald-700 tabular-nums" dir="ltr">{feeNum.toLocaleString("en-US")} <span className="text-[9px] font-normal text-emerald-500">تومان</span></span>
                    </div>
                  </div>
                )}
                {transferCostNum > 0 && (
                  <div className="rounded-[5px] bg-white p-2.5 border border-red-100/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-red-500">هزینه انتقال (-)</span>
                      <span className="text-[13px] font-bold text-red-600 tabular-nums" dir="ltr">{transferCostNum.toLocaleString("en-US")} <span className="text-[9px] font-normal text-red-400">تومان</span></span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-emerald-200/60 pt-2.5">
                <span className="text-[12px] font-medium text-emerald-600">سود کل</span>
                <span className="text-[15px] font-bold text-emerald-800 tabular-nums" dir="ltr">{previewTotalProfit.toLocaleString("en-US")} <span className="text-[9px] font-normal text-emerald-600">تومان</span></span>
              </div>
            </div>
          )}

          {/* Status Selector in Edit */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">وضعیت سفارش</label>
            <div className="flex gap-2">
              {(["IN_PROGRESS", "COMPLETED", "CANCELLED"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setEditStatus(s)}
                  className={cn(
                    "flex-1 rounded-[5px] py-2.5 text-[12px] font-semibold transition-all border",
                    editStatus === s
                      ? s === "IN_PROGRESS" ? "bg-yellow-50 border-yellow-300 text-yellow-700"
                        : s === "COMPLETED" ? "bg-green-50 border-green-300 text-green-700"
                        : "bg-red-50 border-red-300 text-red-700"
                      : "bg-white border-gray-200 text-gray-400"
                  )}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {editingOrder && isHawalaType(editingOrder.orderType) && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">هزینه انتقال (تومان)</label>
              <Input type="text" inputMode="numeric" value={transferCost} onChange={(e) => setTransferCost(formatNum(e.target.value))} placeholder="0" className="h-12 text-left rounded-[5px]" />
            </div>
          )}

          {editingOrder && isHawalaType(editingOrder.orderType) && (<>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">{editingOrder.orderType === "IR_TO_PK" ? "نام گیرنده" : "نام صاحب حساب"}</label>
              <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="نام کامل" className="h-12 rounded-[5px]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">{editingOrder.orderType === "IR_TO_PK" ? "نحوه واریز" : "شماره شبا"}</label>
              {editingOrder.orderType === "IR_TO_PK" ? (
                <select value={recipientMethod} onChange={(e) => setRecipientMethod(e.target.value)} className="flex h-12 w-full rounded-[5px] border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/10 transition-colors">
                  <option value="EASYPAISA">Easypaisa</option>
                  <option value="JAZZCASH">JazzCash</option>
                  <option value="BANK_TRANSFER">حواله بانکی</option>
                  <option value="CASH">نقدی</option>
                </select>
              ) : (
                <Input value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value)} placeholder="IR..." className="h-12 rounded-[5px]" dir="ltr" />
              )}
            </div>
            {editingOrder.orderType === "IR_TO_PK" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">شماره حساب / IBAN</label>
                <Input value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value)} placeholder="شماره حساب" className="h-12 rounded-[5px]" dir="ltr" />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">شماره کارت</label>
                  <Input value={destinationCard} onChange={(e) => setDestinationCard(e.target.value)} placeholder="شماره کارت" className="h-12 rounded-[5px]" dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">بانک</label>
                  <Input value={recipientMethod} onChange={(e) => setRecipientMethod(e.target.value)} placeholder="نام بانک" className="h-12 rounded-[5px]" />
                </div>
              </>
            )}
          </>)}

          {editingOrder && !isHawalaType(editingOrder.orderType) && (<>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">{editingOrder.orderType === "BUY_PKR" ? "شماره حساب پاکستانی صراف" : "شماره کارت مقصد"}</label>
              <Input value={destinationCard} onChange={(e) => setDestinationCard(e.target.value)} placeholder={editingOrder.orderType === "BUY_PKR" ? "شماره حساب پاکستانی" : "شماره کارت"} className="h-12 rounded-[5px]" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">شماره شبا (اختیاری)</label>
              <Input value={destinationSheba} onChange={(e) => setDestinationSheba(e.target.value)} placeholder="IR..." className="h-12 rounded-[5px]" dir="ltr" />
            </div>
          </>)}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">توضیحات</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="اختیاری" rows={2} className="flex w-full rounded-[5px] border border-gray-200 bg-white px-3 py-2.5 text-sm placeholder:text-gray-300 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/10 transition-colors" />
          </div>

          <Button type="submit" isLoading={submitting} className="w-full h-12 rounded-[5px] bg-gray-900 hover:bg-gray-800">ذخیره تغییرات</Button>
        </form>
        )}
      </BottomSheet>

      {/* Delete Confirmation */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="mx-4 w-full max-w-sm rounded-3xl bg-white p-5 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[5px] bg-red-50">
                <Trash2 className="h-5 w-5 text-red-500" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-gray-900">حذف سفارش</p>
                <p className="text-[12px] text-gray-500 mt-0.5">آیا از حذف این سفارش مطمئن هستید؟</p>
              </div>
            </div>
            {deletingOrder && (
              <div className="rounded-[5px] bg-gray-50 p-3.5 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[12px] text-gray-500">نوع</span>
                  <span className="text-[12px] font-medium text-gray-900">{ORDER_TYPE_LABELS[deletingOrder.orderType]?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[12px] text-gray-500">مبلغ</span>
                  <span className="text-[12px] font-medium text-gray-900 tabular-nums" dir="ltr">{Number(deletingOrder.totalToman).toLocaleString("en-US")} تومان</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[12px] text-gray-500">مشتری</span>
                  <span className="text-[12px] font-medium text-gray-900">{deletingOrder.customer.name}</span>
                </div>
              </div>
            )}
            <div className="flex gap-2.5">
              <button onClick={() => setDeleteConfirmOpen(false)} disabled={deleting} className="flex-1 rounded-[5px] border border-gray-200 py-2.5 text-[13px] font-medium text-gray-600 active:bg-gray-50 transition-colors disabled:opacity-50">انصراف</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 flex items-center justify-center gap-1.5 rounded-[5px] bg-red-500 py-2.5 text-[13px] font-semibold text-white active:bg-red-600 transition-colors disabled:opacity-50">
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {deleting ? "در حال حذف..." : "حذف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
