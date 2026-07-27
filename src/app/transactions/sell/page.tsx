"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpFromLine, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";

interface Customer { id: string; name: string; }

export default function SellPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("320");
  const [destinationAccount, setDestinationAccount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { api.get("/api/customers").then(setCustomers).catch(() => {}); }, []);

  const total = (parseFloat(amount || "0") * parseFloat(rate || "0")) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!customerId || !amount || !rate) { setError("فیلدهای الزامی را پر کنید"); return; }
    setLoading(true);
    try {
      await api.post("/api/transactions", { type: "sell", customerId, currency: "PKR", amount, rate, destinationAccount, description });
      setSuccess(true);
      setTimeout(() => router.push("/transactions"), 1000);
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
    setLoading(false);
  };

  if (success) return <main className="min-h-dvh bg-white flex flex-col items-center justify-center gap-3"><CheckCircle2 className="h-12 w-12 text-green-500" /><p className="text-sm font-semibold">ثبت شد</p></main>;

  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-gray-100 bg-white px-4">
        <ArrowUpFromLine className="h-4 w-4 text-emerald-600" strokeWidth={1.5} />
        <h1 className="text-sm font-semibold text-gray-900">ثبت فروش ارز</h1>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {error && <ErrorAlert message={error} />}
        <div className="space-y-1"><label className="text-xs font-medium text-gray-500">مشتری</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="flex h-12 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-blue-500">
            <option value="">انتخاب مشتری</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></div>
        <div className="space-y-1"><label className="text-xs font-medium text-gray-500">مقدار روپیه</label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="h-12 text-left" inputMode="numeric" /></div>
        <div className="space-y-1"><label className="text-xs font-medium text-gray-500">نرخ فروش (تومان)</label><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0" className="h-12 text-left" inputMode="numeric" /></div>
        <div className="rounded-lg bg-gray-50 p-3 flex items-center justify-between"><span className="text-xs text-gray-500">مبلغ دریافتی</span><span className="text-sm font-bold text-gray-900" dir="ltr">{total.toLocaleString("en-US")} تومان</span></div>
        <div className="space-y-1"><label className="text-xs font-medium text-gray-500">شماره حساب مقصد</label><Input value={destinationAccount} onChange={(e) => setDestinationAccount(e.target.value)} placeholder="شماره حساب" className="h-12" dir="ltr" /></div>
        <div className="space-y-1"><label className="text-xs font-medium text-gray-500">توضیحات</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="اختیاری" rows={2} className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-300 focus:outline-none focus:border-blue-500" /></div>
        <Button type="submit" isLoading={loading} className="w-full h-12"><ArrowUpFromLine className="h-4 w-4" strokeWidth={1.5} />ثبت فروش</Button>
      </form>
    </main>
  );
}
