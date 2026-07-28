"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Settings, LogOut, ChevronLeft, User, Shield, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const roleLabels: Record<string, string> = {
  OWNER: "مالک",
  MANAGER: "مدیر",
  CASHIER: "صندوق‌دار",
  ACCOUNTANT: "حسابدار",
};

const roleColors: Record<string, string> = {
  OWNER: "bg-red-50 text-red-600",
  MANAGER: "bg-blue-50 text-blue-600",
  CASHIER: "bg-green-50 text-green-600",
  ACCOUNTANT: "bg-violet-50 text-violet-600",
};

export default function ProfilePage() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="space-y-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2.5 w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-xl font-bold text-blue-600">
          {user.firstName.charAt(0)}
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
          <p className="text-[11px] text-gray-400 mt-0.5" dir="ltr">{user.mobile}</p>
        </div>
        <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", roleColors[user.role])}>
          {roleLabels[user.role]}
        </span>
      </div>

      <div className="space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 active:bg-gray-50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
            <Settings className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-900">تنظیمات کارکنان</p>
            <p className="text-[10px] text-gray-400 mt-0.5">مدیریت کاربران و نقش‌ها</p>
          </div>
          <ChevronLeft className="h-4 w-4 text-gray-300" strokeWidth={1.5} />
        </Link>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
            <User className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-900">نام</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{user.firstName} {user.lastName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
            <Phone className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-900">شماره موبایل</p>
            <p className="text-[11px] text-gray-400 mt-0.5" dir="ltr">{user.mobile}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50">
            <Shield className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-900">نقش</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{roleLabels[user.role]}</p>
          </div>
        </div>
      </div>

      <button
        onClick={logout}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 py-3 text-xs font-medium text-red-600 active:bg-red-100 transition-colors"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.5} />
        خروج از حساب کاربری
      </button>
    </div>
  );
}
