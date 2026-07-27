"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { cn } from "@/lib/utils";

interface Customer { id: string; name: string; phone: string; pakAccount: string | null; }
interface Currency { id: string; code: string; name: string; }

const orderTypes = [
  { id: "IR_TO_PK", label: "حواله ایران → پاکستان", desc: "مشتری تومان می‌دهد، روپیه به پاکستان واریز می‌شود", color: "bg-blue-600", icon: "🇮🇷→🇵🇰" },
  { id: "PK_TO_IR", label: "حواله پاکستان → ایران", desc: "روپیه از پاکستان دریافت، تومان به مشتری پرداخت", color: "bg-emerald-600", icon: "🇵🇰→🇮🇷" },
  { id: "BUY_PKR", label: "خرید روپیه از مشتری", desc: "روپیه از مشتری خرید، تومان پرداخت", color: "bg-violet-600", icon: "💰→" },
  { id: "SELL_PKR", label: "فروش روپیه به مشتری", desc: "تومان دریافت، روپیه به مشتری فروخته می‌شود", color: "bg-amber-600", icon: "→💰" },
] as const;

type OrderType = typeof orderTypes[number]["id"];

export default function NewOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState<"type" | "form">("type");
  const [orderType, setOrderType] = useState<OrderType | null>(null);
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
      const pkrCurrency = cur.find((x: Currency) => x.code === "PKR");
      if (pkrCurrency) setCurrencyId(pkrCurrency.id);
      const pkrRate = rates.find((r: { currency: { code: string }; buyRate: bigint; sellRate: bigint }) => r.currency?.code === "PKR");
      if (pkrRate) setRate(String(pkrRate.sellRate));
    }).catch(() => {});
  }, []);

  const amountNum = parseFloat(amount || "0");
  const rateNum = parseFloat(rate || "0");
  const feeNum = parseFloat(fee || "0");
  const totalToman = amountNum * rateNum;
  const calculatedPkr = rateNum > 0 ? Math.round(amountNum / rateNum * 100) : 0;

  const selectType = (type: OrderType) => {
    setOrderType(type);
    setStep("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!customerId || !currencyId || !amount || !rate) { setError("فیلدهای الزامی را پر کنید"); return; }
    if ((orderType === "IR_TO_PK" || orderType === "PK_TO_IR") && !recipientName) { setError("نام دریافت‌کننده الزامی است"); return; }
    setLoading(true);
    try {
      await api.post("/api/orders", {
        customerId, currencyId, orderType, amount, rate, fee,
        recipientName, recipientAccount, recipientMethod,
        destinationCard, destinationSheba, description,
      });
      setSuccess(true);
      setTimeout(() => router.push("/orders"), 1000);
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
    setLoading(false);
  };

  if (success) return <main className="min-h-dvh bg-white flex flex-col items-center justify-center gap-3"><CheckCircle2 className="h-12 w-12 text-green-500" /><p className="text-sm font-semibold">ثبت شد</p></main>;

  if (step === "type") {
    return (
      <main className="min-h-dvh bg-white">
        <div className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-gray-100 bg-white px-4">
          <h1 className="text-sm font-semibold text-gray-900">نوع سفارش را انتخاب کنید</h1>
        </div>
        <div className="p-4 space-y-3">
          {orderTypes.map((t) => (
            <button key={t.id} onClick={() => selectType(t.id)} className="w-full flex items-center gap-3 rounded-xl border border-gray-100 p-4 text-right active:bg-gray-50 transition-colors">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-white text-lg", t.color)}>{t.icon}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{t.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300" strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </main>
    );
  }

  const isHawala = orderType === "IR_TO_PK" || orderType === "PK_TO_IR";
  const isReceive = orderType === "IR_TO_PK" || orderType === "SELL_PKR";

  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-gray-100 bg-white px-4">
        <button onClick={() => setStep("type")} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-50"><ArrowRight className="h-4 w-4 text-gray-500" strokeWidth={1.5} /></button>
        <h1 className="text-sm font-semibold text-gray-900">{orderTypes.find((t) => t.id === orderType)?.label}</h1>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {error && <ErrorAlert message={error} />}

        <div className="space-y-1"><label className="text-xs font-medium text-gray-500">مشتری</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="flex h-12 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-blue-500">
            <option value="">انتخاب مشتری</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
          </select></div>

        <div className="space-y-1"><label className="text-xs font-medium text-gray-500">مبلغ {isReceive ? "تومان دریافتی" : "روپیه"}</label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="h-12 text-left" inputMode="numeric" /></div>

        <div className="space-y-1"><label className="text-xs font-medium text-gray-500">نرخ تبدیل (تومان)</label>
          <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0" className="h-12 text-left" inputMode="numeric" /></div>

        {isReceive && (
          <div className="rounded-lg bg-blue-50 p-3">
            <div className="flex items-center justify-between mb-1"><span className="text-[10px] text-blue-500">مبلغ دریافتی (تومان)</span><span className="text-sm font-bold text-blue-700" dir="ltr">{totalToman.toLocaleString("en-US")}</span></div>
            <div className="flex items-center justify-between"><span className="text-[10px] text-blue-500">مبلغ واریزی (روپیه)</span><span className="text-xs font-semibold text-blue-600" dir="ltr">{calculatedPkr.toLocaleString("en-US")}</span></div>
          </div>
        )}

        {!isReceive && (
          <div className="rounded-lg bg-emerald-50 p-3">
            <div className="flex items-center justify-between mb-1"><span className="text-[10px] text-emerald-500">مبلغ روپیه</span><span className="text-sm font-bold text-emerald-700" dir="ltr">{amountNum.toLocaleString("en-US")}</span></div>
            <div className="flex items-center justify-between"><span className="text-[10px] text-emerald-500">مبلغ تومان</span><span className="text-xs font-semibold text-emerald-600" dir="ltr">{totalToman.toLocaleString("en-US")}</span></div>
          </div>
        )}

        <div className="space-y-1"><label className="text-xs font-medium text-gray-500">کارمزد (تومان)</label>
          <Input type="number" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0" className="h-12 text-left" inputMode="numeric" /></div>

        {isHawala && (<>
          <div className="space-y-1"><label className="text-xs font-medium text-gray-500">نام دریافت‌کننده در {orderType === "IR_TO_PK" ? "پاکستان" : "ایران"}</label>
            <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="نام کامل" className="h-12" /></div>

          <div className="space-y-1"><label className="text-xs font-medium text-gray-500">نحوه واریز</label>
            <select value={recipientMethod} onChange={(e) => setRecipientMethod(e.target.value)} className="flex h-12 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-blue-500">
              <option value="EASYPAISA">Easypaisa</option><option value="JAZZCASH">JazzCash</option><option value="BANK_TRANSFER">حواله بانکی</option><option value="CASH">نقدی</option>
            </select></div>

          <div className="space-y-1"><label className="text-xs font-medium text-gray-500">شماره حساب / IBAN</label>
            <Input value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value)} placeholder="شماره حساب" className="h-12" dir="ltr" /></div>
        </>)}

        {!isHawala && (<>
          <div className="space-y-1"><label className="text-xs font-medium text-gray-500">شماره کارت مقصد</label>
            <Input value={destinationCard} onChange={(e) => setDestinationCard(e.target.value)} placeholder="شماره کارت" className="h-12" dir="ltr" /></div>
          <div className="space-y-1"><label className="text-xs font-medium text-gray-500">شماره شبا (اختیاری)</label>
            <Input value={destinationSheba} onChange={(e) => setDestinationSheba(e.target.value)} placeholder="IR..." className="h-12" dir="ltr" /></div>
        </>)}

        <div className="space-y-1"><label className="text-xs font-medium text-gray-500">توضیحات</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="اختیاری" rows={2} className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-300 focus:outline-none focus:border-blue-500" /></div>

        {feeNum > 0 && (
          <div className="rounded-lg bg-green-50 p-3 flex items-center justify-between">
            <span className="text-xs text-green-600">سود خالص</span>
            <span className="text-sm font-bold text-green-700" dir="ltr">{feeNum.toLocaleString("en-US")} تومان</span>
          </div>
        )}

        <Button type="submit" isLoading={loading} className="w-full h-12">ثبت سفارش</Button>
      </form>
    </main>
  );
}
