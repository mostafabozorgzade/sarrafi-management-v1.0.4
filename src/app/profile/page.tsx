"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  Settings,
  LogOut,
  ChevronLeft,
  User,
  Shield,
  Phone,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Lock,
  BarChart3,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "سوپرادمین",
  OWNER: "مالک",
  MANAGER: "مدیر",
  CASHIER: "صندوق‌دار",
  ACCOUNTANT: "حسابدار",
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: "bg-amber-50 text-amber-600",
  OWNER: "bg-red-50 text-red-600",
  MANAGER: "bg-blue-50 text-blue-600",
  CASHIER: "bg-green-50 text-green-600",
  ACCOUNTANT: "bg-violet-50 text-violet-600",
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, logout, refreshUser } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  const openEdit = () => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setMobile(user.mobile);
    setNewPassword("");
    setToast(null);
    setEditOpen(true);
    window.history.pushState({}, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) { showToast("error", "نام الزامی است"); return; }
    if (!lastName.trim()) { showToast("error", "نام خانوادگی الزامی است"); return; }
    if (!mobile.trim()) { showToast("error", "شماره موبایل الزامی است"); return; }
    if (!/^[0-9]+$/.test(mobile.trim())) { showToast("error", "فقط اعداد انگلیسی مجاز است"); return; }
    setSubmitting(true);
    try {
      const payload: Record<string, string> = { firstName: firstName.trim(), lastName: lastName.trim(), mobile: mobile.trim() };
      if (newPassword.trim()) {
        payload.newPassword = newPassword.trim();
      }
      await api.put("/api/auth/profile", payload);
      await refreshUser();
      showToast("success", "پروفایل بروزرسانی شد");
      setTimeout(() => setEditOpen(false), 1200);
    } catch (err) { showToast("error", err instanceof Error ? err.message : "خطا"); }
    setSubmitting(false);
  };

  if (isLoading || !user) {
    return (
      <main className="min-h-dvh bg-[#fafafa]">
        <div className="bg-white border-b border-gray-100/80">
          <div className="flex h-14 items-center px-5">
            <Skeleton className="h-5 w-20 rounded-[5px]" />
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="rounded-[5px] bg-white border border-gray-200/80 p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-[5px]" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-2.5 w-28" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#fafafa]">
      {toast && toast.type === "success" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 rounded-[5px] bg-white border border-gray-100 px-4 py-3 shadow-lg shadow-black/5 animate-slide-up">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
          <span className="text-[13px] font-medium text-gray-700">{toast.message}</span>
        </div>
      )}
      {toast && toast.type === "error" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 rounded-[5px] bg-white border border-gray-100 px-4 py-3 shadow-lg shadow-black/5 animate-slide-up max-w-[90vw]">
          <AlertCircle className="h-4.5 w-4.5 text-red-500 flex-shrink-0" />
          <span className="text-[13px] font-medium text-gray-700">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100/80">
        <div className="flex h-14 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[17px] font-bold tracking-tight text-gray-900">پروفایل</h1>
          </div>
          <BarChart3 className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
        </div>
      </div>

      <div className="p-4 pb-24 space-y-3">
        {/* Avatar Card */}
        <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-900 text-xl font-bold text-white">
              {user.firstName.charAt(0)}
            </div>
            <div className="text-center">
              <p className="text-[15px] font-bold text-gray-900">{user.firstName} {user.lastName}</p>
              <p className="text-[11px] text-gray-400 mt-0.5" dir="ltr">{user.mobile}</p>
            </div>
            <span className={cn("rounded-[3px] px-2 py-0.5 text-[10px] font-semibold", roleColors[user.role])}>
              {roleLabels[user.role]}
            </span>
          </div>
        </div>

        {/* Info Card */}
        <div className="rounded-[5px] bg-white border border-gray-200/80 p-4 space-y-0">
          <button
            onClick={openEdit}
            className="flex w-full items-center gap-3 py-3 border-b border-gray-100 last:border-0 active:bg-gray-50 -mx-4 px-4 transition-colors text-right"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-gray-50">
              <User className="h-[18px] w-[18px] text-gray-500" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400">نام و نام خانوادگی</p>
              <p className="text-[13px] font-semibold text-gray-900 mt-0.5">{user.firstName} {user.lastName}</p>
            </div>
            <Pencil className="h-4 w-4 text-gray-300 flex-shrink-0" strokeWidth={1.5} />
          </button>

          <button
            onClick={openEdit}
            className="flex w-full items-center gap-3 py-3 border-b border-gray-100 last:border-0 active:bg-gray-50 -mx-4 px-4 transition-colors text-right"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-gray-50">
              <Phone className="h-[18px] w-[18px] text-gray-500" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400">شماره موبایل</p>
              <p className="text-[13px] font-semibold text-gray-900 mt-0.5" dir="ltr">{user.mobile}</p>
            </div>
            <Pencil className="h-4 w-4 text-gray-300 flex-shrink-0" strokeWidth={1.5} />
          </button>

          <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 -mx-4 px-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-gray-50">
              <Shield className="h-[18px] w-[18px] text-gray-500" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400">نقش</p>
              <p className="text-[13px] font-semibold text-gray-900 mt-0.5">{roleLabels[user.role]}</p>
            </div>
          </div>

          <button
            onClick={openEdit}
            className="flex w-full items-center gap-3 py-3 active:bg-gray-50 -mx-4 px-4 transition-colors text-right"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-gray-50">
              <Lock className="h-[18px] w-[18px] text-gray-500" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400">رمز عبور</p>
              <p className="text-[13px] font-semibold text-gray-900 mt-0.5">تغییر رمز عبور</p>
            </div>
            <Pencil className="h-4 w-4 text-gray-300 flex-shrink-0" strokeWidth={1.5} />
          </button>
        </div>

        {/* Settings Link */}
        {user.role !== "CASHIER" && (
          <div className="rounded-[5px] bg-white border border-gray-200/80">
            <button
              onClick={() => {
                setSettingsLoading(true);
                router.push("/settings");
              }}
              disabled={settingsLoading}
              className="flex items-center gap-3 p-4 active:bg-gray-50 transition-colors w-full text-right"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-gray-50">
                {settingsLoading ? (
                  <Loader2 className="h-[18px] w-[18px] text-gray-400 animate-spin" strokeWidth={1.5} />
                ) : (
                  <Settings className="h-[18px] w-[18px] text-gray-500" strokeWidth={1.5} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900">تنظیمات</p>
                <p className="text-[11px] text-gray-400 mt-0.5">تنظیمات کلی سامانه</p>
              </div>
              {settingsLoading ? (
                <Loader2 className="h-5 w-5 flex-shrink-0 text-gray-400 animate-spin" strokeWidth={1.5} />
              ) : (
                <ChevronLeft className="h-5 w-5 flex-shrink-0 text-gray-300" strokeWidth={1.5} />
              )}
            </button>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-[5px] border border-red-200/60 bg-red-50 py-3 text-[13px] font-semibold text-red-600 active:bg-red-100 transition-colors"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
          خروج از حساب کاربری
        </button>
      </div>

      {/* Edit BottomSheet */}
      <BottomSheet isOpen={editOpen} onClose={() => setEditOpen(false)} title="ویرایش پروفایل" className="max-h-[85vh]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-gray-400">نام <span className="text-red-400">*</span></label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="نام"
              className="h-12 rounded-[5px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-gray-400">نام خانوادگی <span className="text-red-400">*</span></label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="نام خانوادگی"
              className="h-12 rounded-[5px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-gray-400">شماره موبایل <span className="text-red-400">*</span></label>
            <Input
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="09123456789"
              className="h-12 rounded-[5px] text-left"
              dir="ltr"
              inputMode="numeric"
            />
          </div>

          <div className="rounded-[5px] bg-gray-50 p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">تغییر رمز عبور</p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-gray-400">رمز عبور جدید</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="رمز عبور جدید (اختیاری)"
                className="h-12 rounded-[5px]"
              />
            </div>
          </div>

          <Button type="submit" isLoading={submitting} className="w-full h-12 rounded-[5px] bg-gray-900 hover:bg-gray-800">
            ذخیره تغییرات
          </Button>
        </form>
      </BottomSheet>
    </main>
  );
}
