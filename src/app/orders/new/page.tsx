"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, ChevronLeft, Send, ArrowDownToLine } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  DIRECTIONS,
  SUB_TYPES,
  ORDER_TYPE_LABELS,
  isHawalaType,
  isTomanAmountType,
  type OrderTypeEnum,
  type Direction,
} from "@/lib/order-types";

interface Customer { id: string; name: string; phone: string; }
interface Rate { id: string; currencyId: string; buyRate: string; sellRate: string; marketRate: string; currency: { code: string } }

export default function NewOrderPage() {
  const router = useRouter();
  const [subTypeSheetOpen, setSubTypeSheetOpen] = useState(false);
  const [formSheetOpen, setFormSheetOpen] = useState(false);
  const [selectedDirection, setSelectedDirection] = useState<Direction | null>(null);
  const [selectedType, setSelectedType] = useState<OrderTypeEnum | null>(null);
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
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentRates, setCurrentRates] = useState<{ buyRate: number; sellRate: number; marketRate: number } | null>(null);
  const [formLoading, setFormLoading] = useState(true);

  const onlyDigits = (v: string) => v.replace(/[^0-9]/g, "");
  const formatNum = (v: string) => {
    const d = onlyDigits(v);
    if (!d) return "";
    return Number(d).toLocaleString("en-US");
  };
  const parseFormatted = (v: string) => Number(onlyDigits(v) || "0");

  useEffect(() => {
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
  }, []);

  const amountNum = parseFormatted(amount);
  const buyRateNum = parseFormatted(buyRate);
  const sellRateNum = parseFormatted(sellRate);
  const marketRateNum = parseFormatted(marketRate);
  const rateNum = (selectedType === "SELL_PKR" || selectedType === "IR_TO_PK") ? sellRateNum : buyRateNum;
  const feeNum = parseFormatted(fee);
  const transferCostNum = parseFormatted(transferCost);
  const isTomanAmount = selectedType ? isTomanAmountType(selectedType) : false;
  const isHawala = selectedType ? isHawalaType(selectedType) : false;

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

  const selectDirection = (direction: Direction) => {
    setSelectedDirection(direction);
    resetForm();
    setTimeout(() => setSubTypeSheetOpen(true), 100);
  };

  const selectSubType = (type: OrderTypeEnum) => {
    setSelectedType(type);
    setSubTypeSheetOpen(false);
    setTimeout(() => setFormSheetOpen(true), 100);
  };

  const resetForm = () => {
    setAmount("");
    setBuyRate("");
    setSellRate("");
    setMarketRate("");
    setFee("");
    setTransferCost("");
    setRecipientName("");
    setRecipientAccount("");
    setDestinationCard("");
    setDestinationSheba("");
    setDescription("");
    setSelectedType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!customerId || !currencyId || !amount) { setError("فیلدهای الزامی را پر کنید"); return; }
    if (isHawala && !recipientName) { setError("نام دریافت‌کننده الزامی است"); return; }
    setLoading(true);
    try {
      await api.post("/api/orders", {
        customerId, currencyId, orderType: selectedType, amount, buyRate, sellRate, marketRate, fee, transferCost,
        recipientName, recipientAccount, recipientMethod,
        destinationCard, destinationSheba, description,
      });
      setFormSheetOpen(false);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); router.push("/orders"); }, 1500);
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
    setLoading(false);
  };

  const typeInfo = selectedType ? ORDER_TYPE_LABELS[selectedType] : null;
  const subTypes = selectedDirection ? SUB_TYPES[selectedDirection.id] || [] : [];

  return (
    <main className="min-h-dvh bg-white">
      <div className="flex h-12 items-center justify-center border-b border-gray-100 bg-white px-4">
        <h1 className="text-sm font-semibold text-gray-900">ثبت سفارش جدید</h1>
      </div>

      {/* Direction Selection Cards */}
      <div className="px-4 py-6 space-y-3">
        <p className="text-xs font-medium text-gray-400 px-1">نوع تبدیل را انتخاب کنید</p>
        {DIRECTIONS.map((d) => {
          const Icon = d.icon;
          return (
            <button
              key={d.id}
              onClick={() => selectDirection(d)}
              className="w-full flex items-center gap-4 rounded-2xl border border-gray-100 p-5 text-right transition-all active:bg-gray-50 hover:border-gray-200 shadow-sm"
            >
              <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", d.color)}>
                <Icon className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-gray-900">{d.label}</p>
                <p className="text-xs text-gray-400 mt-1">{d.sub}</p>
              </div>
              <ChevronLeft className="h-5 w-5 flex-shrink-0 text-gray-300" strokeWidth={1.5} />
            </button>
          );
        })}
      </div>

      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <p className="text-base font-semibold text-gray-900">سفارش ثبت شد</p>
          </div>
        </div>
      )}

      {/* Sub-Type Selection BottomSheet */}
      <BottomSheet isOpen={subTypeSheetOpen} onClose={() => setSubTypeSheetOpen(false)} title={selectedDirection?.label}>
        <div className="space-y-3">
          {subTypes.map((st) => (
            <button
              key={st.id}
              onClick={() => selectSubType(st.id)}
              className="w-full flex items-center gap-4 rounded-xl border border-gray-100 p-4 text-right transition-all active:bg-gray-50 hover:border-gray-200"
            >
              <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl text-white", st.color)}>
                {st.id === "IR_TO_PK" || st.id === "SELL_PKR" ? <Send className="h-6 w-6" strokeWidth={1.5} /> : <ArrowDownToLine className="h-6 w-6" strokeWidth={1.5} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{st.label}</p>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{st.desc}</p>
              </div>
              <ArrowRight className="h-5 w-5 flex-shrink-0 text-gray-300" strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Form BottomSheet */}
      <BottomSheet
        isOpen={formSheetOpen}
        onClose={() => setFormSheetOpen(false)}
        title={typeInfo?.label}
        className="max-h-[85vh]"
      >
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
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="flex h-12 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">انتخاب مشتری</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
              </select>
              <ChevronLeft className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" strokeWidth={1.5} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">
              {isTomanAmount ? "مبلغ پرداختی (تومان)" : "مبلغ پرداختی (روپیه)"}
            </label>
            <Input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(formatNum(e.target.value))}
              placeholder="0"
              className="h-12 text-left rounded-xl"
            />
          </div>

          {currentRates && selectedType && (
            <div className="grid grid-cols-2 gap-2">
              {(selectedType === "BUY_PKR" || selectedType === "PK_TO_IR") && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">نرخ خرید روپیه</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={buyRate}
                    onChange={(e) => setBuyRate(formatNum(e.target.value))}
                    placeholder="0"
                    className="h-12 text-left rounded-xl"
                  />
                </div>
              )}
              {(selectedType === "SELL_PKR" || selectedType === "IR_TO_PK") && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">نرخ فروش روپیه</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={sellRate}
                    onChange={(e) => setSellRate(formatNum(e.target.value))}
                    placeholder="0"
                    className="h-12 text-left rounded-xl"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">نرخ بازار روپیه</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={marketRate}
                  onChange={(e) => setMarketRate(formatNum(e.target.value))}
                  placeholder="0"
                  className="h-12 text-left rounded-xl"
                />
              </div>
            </div>
          )}

          {amountNum > 0 && rateNum > 0 && (
            <div className={cn("rounded-xl p-4", isTomanAmount ? "bg-green-50" : "bg-blue-50")}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn("text-xs", isTomanAmount ? "text-green-500" : "text-blue-500")}>
                  {isTomanAmount ? "مبلغ پرداختی (تومان)" : "مبلغ پرداختی (روپیه)"}
                </span>
                <span className={cn("text-base font-bold", isTomanAmount ? "text-green-700" : "text-blue-700")} dir="ltr">
                  {isTomanAmount ? totalToman.toLocaleString("en-US") : calculatedPkr.toLocaleString("en-US")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={cn("text-xs", isTomanAmount ? "text-green-500" : "text-blue-500")}>
                  {isTomanAmount ? "مبلغ دریافتی (روپیه)" : "مبلغ دریافتی (تومان)"}
                </span>
                <span className={cn("text-sm font-semibold", isTomanAmount ? "text-green-600" : "text-blue-600")} dir="ltr">
                  {isTomanAmount ? calculatedPkr.toLocaleString("en-US") : totalToman.toLocaleString("en-US")}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">کارمزد (تومان)</label>
            <Input
              type="text"
              inputMode="numeric"
              value={fee}
              onChange={(e) => setFee(formatNum(e.target.value))}
              placeholder="0"
              className="h-12 text-left rounded-xl"
            />
          </div>

          {isHawala && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">هزینه انتقال (تومان)</label>
              <Input
                type="text"
                inputMode="numeric"
                value={transferCost}
                onChange={(e) => setTransferCost(formatNum(e.target.value))}
                placeholder="0"
                className="h-12 text-left rounded-xl"
              />
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

          {/* Hawala fields: IR_TO_PK and PK_TO_IR */}
          {isHawala && (<>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">{selectedType === "IR_TO_PK" ? "نام گیرنده" : "نام صاحب حساب"}</label>
              <Input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="نام کامل"
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">{selectedType === "IR_TO_PK" ? "نحوه واریز" : "شماره شبا"}</label>
              {selectedType === "IR_TO_PK" ? (
                <select
                  value={recipientMethod}
                  onChange={(e) => setRecipientMethod(e.target.value)}
                  className="flex h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="EASYPAISA">Easypaisa</option>
                  <option value="JAZZCASH">JazzCash</option>
                  <option value="BANK_TRANSFER">حواله بانکی</option>
                  <option value="CASH">نقدی</option>
                </select>
              ) : (
                <Input
                  value={recipientAccount}
                  onChange={(e) => setRecipientAccount(e.target.value)}
                  placeholder="IR..."
                  className="h-12 rounded-xl"
                  dir="ltr"
                />
              )}
            </div>

            {selectedType === "IR_TO_PK" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">شماره حساب / IBAN</label>
                <Input
                  value={recipientAccount}
                  onChange={(e) => setRecipientAccount(e.target.value)}
                  placeholder="شماره حساب"
                  className="h-12 rounded-xl"
                  dir="ltr"
                />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">شماره کارت</label>
                  <Input
                    value={destinationCard}
                    onChange={(e) => setDestinationCard(e.target.value)}
                    placeholder="شماره کارت"
                    className="h-12 rounded-xl"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">بانک</label>
                  <Input
                    value={recipientMethod}
                    onChange={(e) => setRecipientMethod(e.target.value)}
                    placeholder="نام بانک"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">شماره موبایل</label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="اختیاری"
                    className="h-12 rounded-xl"
                    dir="ltr"
                  />
                </div>
              </>
            )}
          </>)}

          {/* Card fields: BUY_PKR and SELL_PKR */}
          {!isHawala && (<>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">{selectedType === "BUY_PKR" ? "شماره حساب پاکستانی صراف" : "شماره کارت مقصد"}</label>
              <Input
                value={destinationCard}
                onChange={(e) => setDestinationCard(e.target.value)}
                placeholder={selectedType === "BUY_PKR" ? "شماره حساب پاکستانی" : "شماره کارت"}
                className="h-12 rounded-xl"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">شماره شبا (اختیاری)</label>
              <Input
                value={destinationSheba}
                onChange={(e) => setDestinationSheba(e.target.value)}
                placeholder="IR..."
                className="h-12 rounded-xl"
                dir="ltr"
              />
            </div>
          </>)}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">توضیحات</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اختیاری"
              rows={2}
              className="flex w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm placeholder:text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <Button type="submit" isLoading={loading} className="w-full h-12 rounded-xl">ثبت سفارش</Button>
        </form>
        )}
      </BottomSheet>
    </main>
  );
}
