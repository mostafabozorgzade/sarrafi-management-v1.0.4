"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CreditCard, Phone, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { formatJalaliDate, toPersianDigits } from "@/lib/jalali";

export function SubscriptionWarning() {
  const { user, logout } = useAuth();
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
  const isBlocked = daysLeft < -2;

  if (isBlocked) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
        <div className="mx-6 max-w-sm w-full">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-6">
              <Lock className="h-10 w-10 text-red-500" strokeWidth={1.5} />
            </div>

            <h2 className="text-[20px] font-bold text-gray-900 mb-2">دسترسی مسدود شده</h2>
            <p className="text-[13px] text-gray-500 leading-relaxed mb-2">
              اشتراک شما بیش از ۲ روز است منقضی شده است.
            </p>
            <p className="text-[13px] text-gray-500 leading-relaxed mb-6">
              جهت جلوگیری از از بین رفتن اطلاعات و فعال‌سازی مجدد سامانه، لطفاً با پشتیبانی تماس بگیرید.
            </p>

            <div className="w-full rounded-[5px] bg-red-50 border border-red-200 p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-red-600" strokeWidth={1.5} />
                <span className="text-[12px] font-semibold text-red-700">شماره پشتیبانی</span>
              </div>
              <a
                href="tel:+989224013811"
                className="flex items-center justify-center gap-2 h-12 rounded-[5px] bg-red-600 text-white text-[16px] font-bold"
                dir="ltr"
              >
                <Phone className="h-5 w-5" strokeWidth={1.5} />
                09224013811
              </a>
            </div>

            <button
              onClick={() => logout()}
              className="w-full h-11 rounded-[5px] border border-gray-200 text-[13px] font-semibold text-gray-500 active:bg-gray-50 transition-colors"
            >
              خروج از حساب کاربری
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center justify-between mt-2">
            <span className={cn("text-[9px] font-medium", isExpired ? "text-red-500" : "text-amber-500")}>
              پایان: {formatJalaliDate(billing.subscriptionEnd)}
            </span>
            {isExpired && (
              <a href="tel:+989224013811" className="flex items-center gap-1 text-[9px] font-medium text-red-500">
                <Phone className="h-3 w-3" strokeWidth={1.5} />
                پشتیبانی
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
