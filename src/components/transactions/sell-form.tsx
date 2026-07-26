"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowUpFromLine, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { customers, employees } from "@/lib/mock-data";

const sellSchema = z.object({
  customerId: z.string().min(1, "مشتری را انتخاب کنید"),
  amount: z.string().min(1, "مقدار الزامی است"),
  rate: z.string().min(1, "نرخ الزامی است"),
  destinationAccount: z.string().min(1, "شماره حساب مقصد الزامی است"),
  description: z.string().optional(),
});
type SellFormData = z.infer<typeof sellSchema>;

export function SellForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SellFormData>({
    resolver: zodResolver(sellSchema),
    mode: "onBlur",
    defaultValues: { rate: "320" },
  });

  const amount = watch("amount");
  const rate = watch("rate");
  const total = (parseFloat(amount || "0") * parseFloat(rate || "0")) || 0;

  const onSubmit = async () => {
    setServerError(null);
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setSuccess(true);
      setTimeout(() => router.push("/transactions"), 1200);
    } catch {
      setServerError("خطا در ثبت معامله");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 animate-in fade-in duration-300">
        <CheckCircle2 className="h-14 w-14 text-green-500" />
        <p className="text-base font-semibold text-gray-900">ثبت شد</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && <ErrorAlert message={serverError} />}

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500">مشتری</label>
        <select {...register("customerId")} className="flex h-12 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20">
          <option value="">انتخاب مشتری</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {errors.customerId && <p className="text-xs text-red-500">{errors.customerId.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500">مقدار روپیه</label>
        <Input {...register("amount")} type="number" placeholder="0" error={errors.amount?.message} className="h-12 text-left" inputMode="numeric" />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500">نرخ فروش (تومان)</label>
        <Input {...register("rate")} type="number" placeholder="0" error={errors.rate?.message} className="h-12 text-left" inputMode="numeric" />
      </div>

      <div className="rounded-lg bg-gray-50 p-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">مبلغ دریافتی</span>
        <span className="text-sm font-bold text-gray-900" dir="ltr">{total.toLocaleString("en-US")} تومان</span>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500">شماره حساب مقصد</label>
        <Input {...register("destinationAccount")} type="text" placeholder="شماره حساب" error={errors.destinationAccount?.message} className="h-12 text-left" dir="ltr" />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500">کارمند</label>
        <select className="flex h-12 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:border-blue-500" defaultValue={employees[0]}>
          {employees.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-500">توضیحات</label>
        <textarea {...register("description")} placeholder="اختیاری" rows={2} className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-500" />
      </div>

      <Button type="submit" isLoading={isLoading} className="w-full h-12">
        <ArrowUpFromLine className="h-4 w-4" strokeWidth={1.5} />
        ثبت فروش
      </Button>
    </form>
  );
}
