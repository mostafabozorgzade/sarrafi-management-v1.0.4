"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { cn } from "@/lib/utils";

interface Customer { id: string; name: string; phone: string; }
interface Rate { id: string; currencyId: string; buyRate: string; sellRate: string; currency: { code: string } }

const orderTypes = [
  { id: "IR_TO_PK", label: "حواله ایران → پاکستان", desc: "مشتری تومان می‌دهد، روپیه به پاکستان واریز می‌شود", color: "bg-blue-600", icon: "🇮🇷→🇵🇰", fields: "toman" },
  { id: "PK_TO_IR", label: "حواله پاکستان → ایران", desc: "روپیه از پاکستان دریافت، تومان به مشتری پرداخت", color: "bg-emerald-600", icon: "🇵🇰→🇮🇷", fields: "hawala" },
  { id: "BUY_PKR", label: "خرید روپیه از مشتری", desc: "روپیه از مشتری خرید، تومان پرداخت", color: "bg-violet-600", icon: "💰", fields: "card" },
  { id: "SELL_PKR", label: "فروش روپیه به مشتری", desc: "تومان دریافت، روپیه به مشتری فروخته می‌شود", color: "bg-amber-600", icon: "💎", fields: "card" },
] as const;

type OrderType = typeof orderTypes[number]["id"];

export default function NewOrderPage() {
  const router = useRouter();
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);
  const [formSheetOpen, setFormSheetOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<OrderType | null>(null);
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
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/api/customers"), api.get("/api/currencies"), api.get("/api/rates")]).then(([c, cur, rates]) => {
      setCustomers(c);
      if (c.length > 0) setCustomerId(c[0].id);
      const pkrCurrency = cur.find((x: { code: string; id: string }) => x.code === "PKR");
      if (pkrCurrency) setCurrencyId(pkrCurrency.id);
      const pkrRate = rates.find((r: Rate) => r.currency?.code === "PKR");
      if (pkrRate) setRate(String(pkrRate.sellRate));
    }).catch(() => {});
  }, []);

  const amountNum = parseFloat(amount || "0");
  const rateNum = parseFloat(rate || "0");
  const feeNum = parseFloat(fee || "0");
  const isTomanAmount = selectedType === "IR_TO_PK";
  const isHawala = selectedType === "IR_TO_PK" || selectedType === "PK_TO_IR";

  let totalToman = 0;
  let calculatedPkr = 0;
  if (isTomanAmount) {
    totalToman = amountNum;
    calculatedPkr = rateNum > 0 ? Math.round(amountNum / rateNum) : 0;
  } else {
    totalToman = amountNum * rateNum;
    calculatedPkr = amountNum;
  }

  const selectType = (type: OrderType) => {
    setSelectedType(type);
    setTypeSheetOpen(false);
    resetForm();
    setTimeout(() => setFormSheetOpen(true), 100);
  };

  const resetForm = () => {
    setAmount("");
    setFee("");
    setRecipientName("");
    setRecipientAccount("");
    setDestinationCard("");
    setDestinationSheba("");
    setDescription("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!customerId || !currencyId || !amount || !rate) { setError("فیلدهای الزامی را پر کنید"); return; }
    if (isHawala && !recipientName) { setError("نام دریافت‌کننده الزامی است"); return; }
    setLoading(true);
    try {
      await api.post("/api/orders", {
        customerId, currencyId, orderType: selectedType, amount, rate, fee,
        recipientName, recipientAccount, recipientMethod,
        destinationCard, destinationSheba, description,
      });
      setFormSheetOpen(false);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); router.push("/orders"); }, 1500);
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
    setLoading(false);
  };

  const typeInfo = orderTypes.find((t) => t.id === selectedType);

  return (
    <main className="min-h-dvh bg-white">
      <div className="flex h-12 items-center justify-center border-b border-gray-100 bg-white px-4">
        <h1 className="text-sm font-semibold text-gray-900">ثبت سفارش جدید</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-20 px-4">
        <button
          onClick={() => setTypeSheetOpen(true)}
          className="flex h-16 w-full max-w-sm items-center justify-center gap-3 rounded-2xl bg-gray-900 text-white shadow-lg transition-all active:scale-[0.98]"
        >
          <span className="text-lg">+</span>
          <span className="text-sm font-semibold">ثبت سفارش جدید</span>
        </button>
      </div>

      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <p className="text-base font-semibold text-gray-900">سفارش ثبت شد</p>
          </div>
        </div>
      )}

      <BottomSheet isOpen={typeSheetOpen} onClose={() => setTypeSheetOpen(false)} title="نوع سفارش">
        <div className="space-y-3">
          {orderTypes.map((t) => (
            <button
              key={t.id}
              onClick={() => selectType(t.id)}
              className="w-full flex items-center gap-4 rounded-xl border border-gray-100 p-4 text-right transition-all active:bg-gray-50 hover:border-gray-200"
            >
              <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl text-2xl", t.color)}>
                {t.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{t.label}</p>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{t.desc}</p>
              </div>
              <ArrowRight className="h-5 w-5 flex-shrink-0 text-gray-300" strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={formSheetOpen}
        onClose={() => setFormSheetOpen(false)}
        title={typeInfo?.label}
        className="max-h-[85vh]"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorAlert message={error} />}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">مشتری</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="flex h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">انتخاب مشتری</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">
              {isTomanAmount ? "مبلغ تومان دریافتی" : "مبلغ روپیه"}
            </label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="h-12 text-left rounded-xl"
              inputMode="decimal"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">نرخ تبدیل (تومان)</label>
            <Input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="مثلاً 2950"
              className="h-12 text-left rounded-xl"
              inputMode="decimal"
            />
          </div>

          {amountNum > 0 && rateNum > 0 && (
            <div className={cn("rounded-xl p-4", isTomanAmount ? "bg-blue-50" : "bg-emerald-50")}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn("text-xs", isTomanAmount ? "text-blue-500" : "text-emerald-500")}>
                  {isTomanAmount ? "مبلغ دریافتی (تومان)" : "مبلغ روپیه"}
                </span>
                <span className={cn("text-base font-bold", isTomanAmount ? "text-blue-700" : "text-emerald-700")} dir="ltr">
                  {isTomanAmount ? totalToman.toLocaleString("en-US") : calculatedPkr.toLocaleString("en-US")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={cn("text-xs", isTomanAmount ? "text-blue-500" : "text-emerald-500")}>
                  {isTomanAmount ? "مبلغ واریزی (روپیه)" : "مبلغ دریافتی (تومان)"}
                </span>
                <span className={cn("text-sm font-semibold", isTomanAmount ? "text-blue-600" : "text-emerald-600")} dir="ltr">
                  {isTomanAmount ? calculatedPkr.toLocaleString("en-US") : totalToman.toLocaleString("en-US")}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">کارمزد (تومان)</label>
            <Input
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="0"
              className="h-12 text-left rounded-xl"
              inputMode="decimal"
            />
          </div>

          {isHawala && (<>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">نام دریافت‌کننده</label>
              <Input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="نام کامل"
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">نحوه واریز</label>
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
            </div>

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
          </>)}

          {!isHawala && (<>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">شماره کارت مقصد</label>
              <Input
                value={destinationCard}
                onChange={(e) => setDestinationCard(e.target.value)}
                placeholder="شماره کارت"
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

          {feeNum > 0 && (
            <div className="rounded-xl bg-green-50 p-3 flex items-center justify-between">
              <span className="text-xs text-green-600">سود خالص</span>
              <span className="text-sm font-bold text-green-700" dir="ltr">{feeNum.toLocaleString("en-US")} تومان</span>
            </div>
          )}

          <Button type="submit" isLoading={loading} className="w-full h-12 rounded-xl">ثبت سفارش</Button>
        </form>
      </BottomSheet>
    </main>
  );
}
