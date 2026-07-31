"use client";

import { useState, useEffect } from "react";
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
  HelpCircle,
  FileText,
  Headphones,
  CreditCard,
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
  const [faqOpen, setFaqOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tenantBilling, setTenantBilling] = useState<{
    billingMode: string;
    subscriptionEnd: string | null;
    amountDue: string;
  } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    if (user?.tenantId) {
      api.get(`/api/tenants/${user.tenantId}`)
        .then((data) => {
          setTenantBilling({
            billingMode: data.billingMode,
            subscriptionEnd: data.subscriptionEnd,
            amountDue: data.amountDue,
          });
        })
        .catch(() => {});
    }
  }, [user?.tenantId]);

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

        {/* Subscription Info - only for non-free billing */}
        {tenantBilling && tenantBilling.billingMode !== "FREE" && (
          <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
              <h3 className="text-[13px] font-semibold text-gray-900">اطلاعات اشتراک</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="text-gray-400">نوع اشتراک</span>
                <span className={cn(
                  "rounded-[3px] px-2 py-0.5 text-[10px] font-semibold",
                  tenantBilling.billingMode === "SUBSCRIPTION" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                )}>
                  {tenantBilling.billingMode === "SUBSCRIPTION" ? "اشتراک ماهیانه" : "درصدی/کارمزدی"}
                </span>
              </div>
              {tenantBilling.billingMode === "SUBSCRIPTION" && tenantBilling.subscriptionEnd && (
                <>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-gray-400">تاریخ پایان اشتراک</span>
                    <span className="font-medium text-gray-700">{new Date(tenantBilling.subscriptionEnd).toLocaleDateString("fa-IR")}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-gray-400">روزهای باقی‌مانده</span>
                    <span className={cn(
                      "font-semibold",
                      Math.ceil((new Date(tenantBilling.subscriptionEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) < 0
                        ? "text-red-600"
                        : Math.ceil((new Date(tenantBilling.subscriptionEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 7
                        ? "text-amber-600"
                        : "text-emerald-600"
                    )}>
                      {Math.max(0, Math.ceil((new Date(tenantBilling.subscriptionEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} روز
                    </span>
                  </div>
                </>
              )}
              {tenantBilling.billingMode === "PERCENTAGE" && (
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-400">مبلغ قابل پرداخت</span>
                  <span className={cn("font-bold", Number(tenantBilling.amountDue) > 0 ? "text-red-600" : "text-emerald-600")}>
                    {Number(tenantBilling.amountDue).toLocaleString("fa-IR")} تومان
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

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

        {/* Support & Info Links */}
        <div className="rounded-[5px] bg-white border border-gray-200/80">
          <button
            onClick={() => { setFaqOpen(true); window.history.pushState({}, ""); }}
            className="flex items-center gap-3 p-4 active:bg-gray-50 transition-colors w-full text-right border-b border-gray-100"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-blue-50">
              <HelpCircle className="h-[18px] w-[18px] text-blue-500" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900">سوالات متداول</p>
              <p className="text-[11px] text-gray-400 mt-0.5">پاسخ سوالات رایج</p>
            </div>
            <ChevronLeft className="h-5 w-5 flex-shrink-0 text-gray-300" strokeWidth={1.5} />
          </button>

          <button
            onClick={() => { setTermsOpen(true); window.history.pushState({}, ""); }}
            className="flex items-center gap-3 p-4 active:bg-gray-50 transition-colors w-full text-right border-b border-gray-100"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-amber-50">
              <FileText className="h-[18px] w-[18px] text-amber-500" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900">قوانین و مقررات</p>
              <p className="text-[11px] text-gray-400 mt-0.5">شرایط استفاده از سامانه</p>
            </div>
            <ChevronLeft className="h-5 w-5 flex-shrink-0 text-gray-300" strokeWidth={1.5} />
          </button>

          <button
            onClick={() => { setSupportOpen(true); window.history.pushState({}, ""); }}
            className="flex items-center gap-3 p-4 active:bg-gray-50 transition-colors w-full text-right"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-green-50">
              <Headphones className="h-[18px] w-[18px] text-green-500" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900">پشتیبانی</p>
              <p className="text-[11px] text-gray-400 mt-0.5">ارتباط با پشتیبانی</p>
            </div>
            <ChevronLeft className="h-5 w-5 flex-shrink-0 text-gray-300" strokeWidth={1.5} />
          </button>
        </div>

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

      {/* FAQ BottomSheet */}
      <BottomSheet isOpen={faqOpen} onClose={() => setFaqOpen(false)} title="سوالات متداول" className="max-h-[85vh]">
        <div className="space-y-4">
          {[
            { q: "چگونه سفارش تبدیل ارز ثبت کنم؟", a: "از صفحه سفارشات، دکمه ثبت سفارش را بزنید، نوع تبدیل (ایران به پاکستان یا بالعکس) و سپس نوع معامله را انتخاب کنید. اطلاعات مشتری، مبلغ و نرخ را وارد کرده و ثبت کنید." },
            { q: "تفاوت خرید روپیه و فروش روپیه چیست؟", a: "خرید روپیه یعنی شما روپیه از مشتری می‌خرید (پاکستان→ایران)، فروش روپیه یعنی روپیه به مشتری می‌فروشید (ایران→پاکستان)." },
            { q: "سود معاملات چگونه محاسبه می‌شود؟", a: "سود بر اساس تفاوت نرخ بازار و نرخ معامله محاسبه می‌شود. نرخ بازار در لحظه ثبت سفارش ذخیره شده و سود نهایی در گزارشات قابل مشاهده است." },
            { q: "آیا امکان لغو سفارش وجود دارد؟", a: "بله، سفارشات در حال انجام قابل لغو هستند. از صفحه سفارشات، سفارش مورد نظر را انتخاب و وضعیت آن را به لغو شده تغییر دهید." },
            { q: "نرخ ارز را چگونه بروزرسانی کنم؟", a: "از بخش نرخ ارز در صفحه اصلی یا تنظیمات، روی ویرایش کلیک کرده و نرخ بازار، خرید و فروش را وارد کنید." },
            { q: "آیا امکان مشاهده گزارش سود وجود دارد؟", a: "بله، از صفحه گزارشات می‌توانید سود خرید، سود فروش و سود نهایی را به تفکیک امروز، این هفته، این ماه و کل مشاهده کنید." },
          ].map((item, i) => (
            <div key={i} className="rounded-[5px] bg-gray-50 p-3.5">
              <p className="text-[12px] font-semibold text-gray-900 mb-1.5">{item.q}</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </BottomSheet>

      {/* Terms BottomSheet */}
      <BottomSheet isOpen={termsOpen} onClose={() => setTermsOpen(false)} title="قوانین و مقررات" className="max-h-[85vh]">
        <div className="space-y-4">
          <div className="rounded-[5px] bg-gray-50 p-3.5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">قوانین عمومی</p>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              استفاده از سامانه صرافی سرفی به معنای پذیرش قوانین زیر است. کاربران موظف به رعایت تمامی مقررات ذکر شده بوده و هرگونه سوءاستفاده پیگرد قانونی دارد.
            </p>
          </div>
          <div className="rounded-[5px] bg-gray-50 p-3.5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">حریم خصوصی</p>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              اطلاعات شخصی کاربران، مشتریان و تراکنش‌ها کاملاً محرمانه بوده و در اختیار اشخاص ثالث قرار نخواهد گرفت. تمامی داده‌ها رمزنگاری شده و در سرور امن نگهداری می‌شوند.
            </p>
          </div>
          <div className="rounded-[5px] bg-gray-50 p-3.5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">مسئولیت‌ها</p>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              هر کاربر مسئول حفظ امنیت حساب کاربری خود (نام کاربری و رمز عبور) است. صندوقداران فقط امکان مدیریت سفارشات و مشتریان را دارند و امکان تغییر تنظیمات برای آن‌ها غیرفعال است.
            </p>
          </div>
          <div className="rounded-[5px] bg-gray-50 p-3.5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">قوانین مالی</p>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              تمامی تراکنش‌ها بر اساس نرخ لحظه‌ای ارز ثبت می‌شوند. سود حاصل از معاملات به صورت خودکار محاسبه شده و در بخش گزارشات قابل مشاهده است. اطلاعات مالی فقط برای مدیران و مالک قابل رویت است.
            </p>
          </div>
          <div className="rounded-[5px] bg-gray-50 p-3.5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">تغییرات</p>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              مدیریت سامانه حق تغییر در قوانین، نرخ‌ها و شرایط استفاده را در هر زمان برای خود محفوظ می‌دارد. کاربران موظف به بررسی دوره‌ای تغییرات هستند.
            </p>
          </div>
        </div>
      </BottomSheet>

      {/* Support BottomSheet */}
      <BottomSheet isOpen={supportOpen} onClose={() => setSupportOpen(false)} title="پشتیبانی" className="max-h-[85vh]">
        <div className="space-y-4">
          <div className="rounded-[5px] bg-green-50 p-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mx-auto mb-3">
              <Headphones className="h-6 w-6 text-green-600" strokeWidth={1.5} />
            </div>
            <p className="text-[13px] font-semibold text-gray-900">پشتیبانی ۲۴ ساعته</p>
            <p className="text-[11px] text-gray-500 mt-1">برای رفع مشکل با ما در ارتباط باشید</p>
          </div>

          <div className="rounded-[5px] bg-white border border-gray-200/80">
            <a href="tel:+989224013811" className="flex items-center gap-3 p-4 active:bg-gray-50 transition-colors border-b border-gray-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-blue-50">
                <Phone className="h-[18px] w-[18px] text-blue-500" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900">تماس تلفنی</p>
                <p className="text-[11px] text-gray-400 mt-0.5" dir="ltr">09224013811</p>
              </div>
              <ChevronLeft className="h-5 w-5 flex-shrink-0 text-gray-300" strokeWidth={1.5} />
            </a>

            <a href="https://wa.me/989224013811" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 active:bg-gray-50 transition-colors border-b border-gray-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-green-50">
                <svg className="h-[18px] w-[18px] text-green-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900">واتساپ</p>
                <p className="text-[11px] text-gray-400 mt-0.5" dir="ltr">09224013811</p>
              </div>
              <ChevronLeft className="h-5 w-5 flex-shrink-0 text-gray-300" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </BottomSheet>
    </main>
  );
}
