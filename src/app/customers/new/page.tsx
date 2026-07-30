"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";

export default function NewCustomerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pakAccount, setPakAccount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !phone) { setError("نام و شماره تماس الزامی است"); return; }
    if (!/^[0-9]+$/.test(phone)) { setError("فقط اعداد انگلیسی مجاز است"); return; }
    setLoading(true);
    try {
      await api.post("/api/customers", { name, phone, pakAccount });
      setSuccess(true);
      setTimeout(() => router.push("/customers"), 1000);
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
    setLoading(false);
  };

  if (success) return (
    <main className="min-h-dvh bg-white flex flex-col items-center justify-center gap-3">
      <CheckCircle2 className="h-12 w-12 text-green-500" />
      <p className="text-sm font-semibold text-gray-900">مشتری ثبت شد</p>
    </main>
  );

  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-gray-100 bg-white px-4">
        <button onClick={() => router.back()} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-50"><ArrowLeft className="h-4 w-4 text-gray-500" strokeWidth={1.5} /></button>
        <h1 className="text-sm font-semibold text-gray-900">افزودن مشتری</h1>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {error && <ErrorAlert message={error} />}
        <div className="space-y-1"><label className="text-xs font-medium text-gray-500">نام</label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام کامل" className="h-12" /></div>
        <div className="space-y-1"><label className="text-xs font-medium text-gray-500">شماره موبایل</label><Input value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))} placeholder="09..." className="h-12" dir="ltr" inputMode="numeric" /></div>
        <div className="space-y-1"><label className="text-xs font-medium text-gray-500">شماره حساب پاکستان</label><Input value={pakAccount} onChange={(e) => setPakAccount(e.target.value)} placeholder="اختیاری" className="h-12" dir="ltr" /></div>
        <Button type="submit" isLoading={loading} className="w-full h-12">ثبت مشتری</Button>
      </form>
    </main>
  );
}
