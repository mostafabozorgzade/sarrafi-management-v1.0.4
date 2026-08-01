"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CreditCard } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { formatJalaliDate, toPersianDigits } from "@/lib/jalali";

export function SubscriptionWarning() {
  const { user } = useAuth();
  const [billing, setBilling] = useState<{
    billingMode: string;
    subscriptionEnd: string | null;
  } | null>(null);

  useEffect(() => {
    if (user) {
      api.get("/api/billing-info")
        .then((d) => {
          setBilling({ billingMode: d.billingMode, subscriptionEnd: d.subscriptionEnd });
        })
        .catch(() => {});
    }
  }, [user]);

  if (!billing || billing.billingMode !== "SUBSCRIPTION" || !billing.subscriptionEnd) return null;

  const daysLeft = Math.ceil((new Date(billing.subscriptionEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysLeft > 6) return null;

  const isExpired = daysLeft < 0;

  return (
    <div className={cn(
      "mx-4 mt-3 rounded-[5px] border p-3",
      isExpired ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
    )}>
      <div className="flex items-start gap-2.5">
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-[5px] flex-shrink-0",
          isExpired ? "bg-red-100" : "bg-amber-100"
        )}>
          {isExpired ? (
            <AlertTriangle className="h-4 w-4 text-red-600" strokeWidth={1.5} />
          ) : (
            <CreditCard className="h-4 w-4 text-amber-600" strokeWidth={1.5} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-[12px] font-bold", isExpired ? "text-red-800" : "text-amber-800")}>
            {isExpired ? "اشتراک منقضی شده!" : "اتمام اشتراک نزدیک است"}
          </p>
          <p className={cn("text-[10px] mt-0.5 leading-relaxed", isExpired ? "text-red-600" : "text-amber-700")}>
            {isExpired
              ? "جهت جلوگیری از غیرفعال شدن اپلیکیشن و از بین رفتن اطلاعات، اشتراک خود را تمدید کنید."
              : `تنها ${toPersianDigits(daysLeft)} روز باقی مانده. جهت جلوگیری از غیرفعال شدن اپلیکیشن، اشتراک خود را تمدید کنید.`
            }
          </p>
          <span className={cn("text-[9px] font-medium", isExpired ? "text-red-500" : "text-amber-500")}>
            پایان: {formatJalaliDate(billing.subscriptionEnd)}
          </span>
        </div>
      </div>
    </div>
  );
}
