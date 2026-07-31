"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  ChevronLeft,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { BottomSheet } from "@/components/ui/bottom-sheet";

interface User {
  id: string;
  mobile: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
}

interface Rate {
  id: string;
  currencyId: string;
  marketRate: bigint;
  buyRate: bigint;
  sellRate: bigint;
  currency: { code: string; name: string };
  changedBy: { firstName: string; lastName: string } | null;
}

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

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState<"list" | "rates">("list");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [mobile, setMobile] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [rates, setRates] = useState<Rate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [editingRate, setEditingRate] = useState<Rate | null>(null);
  const [marketRate, setMarketRate] = useState("");
  const [buyRate, setBuyRate] = useState("");
  const [sellRate, setSellRate] = useState("");
  const [rateSaving, setRateSaving] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  const onlyDigits = (v: string) => v.replace(/[^0-9]/g, "");
  const formatNum = (v: string) => {
    const d = onlyDigits(v);
    if (!d) return "";
    return Number(d).toLocaleString("en-US");
  };

  const loadUsers = () =>
    api
      .get("/api/users")
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

  const loadRates = () =>
    api
      .get("/api/rates")
      .then((data) => {
        setRates(data);
        setRatesLoading(false);
      })
      .catch(() => setRatesLoading(false));

  useEffect(() => {
    loadUsers();
    loadRates();
  }, []);

  useEffect(() => {
    if (!authLoading && user && user.role === "CASHIER") {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const openAddSheet = () => {
    setMobile("");
    setFirstName("");
    setLastName("");
    setPassword("");
    setToast(null);
    setAddSheetOpen(true);
    window.history.pushState({}, "");
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile.trim()) { showToast("error", "شماره موبایل الزامی است"); return; }
    if (!/^[0-9]+$/.test(mobile.trim())) { showToast("error", "فقط اعداد انگلیسی مجاز است"); return; }
    if (!firstName.trim()) { showToast("error", "نام الزامی است"); return; }
    if (!lastName.trim()) { showToast("error", "نام خانوادگی الزامی است"); return; }
    if (!password.trim() || password.trim().length < 6) { showToast("error", "رمز عبور حداقل ۶ کاراکتر باشد"); return; }
    setSubmitting(true);
    try {
      await api.post("/api/users", {
        mobile: mobile.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password: password.trim(),
        role: "CASHIER",
      });
      loadUsers();
      showToast("success", "کارمند اضافه شد");
      setTimeout(() => setAddSheetOpen(false), 1200);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "خطا");
    }
    setSubmitting(false);
  };

  const openEditSheet = (u: User) => {
    setSelectedUser(u);
    setMobile(u.mobile);
    setFirstName(u.firstName);
    setLastName(u.lastName);
    setPassword("");
    setToast(null);
    setEditSheetOpen(true);
    window.history.pushState({}, "");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!mobile.trim()) { showToast("error", "شماره موبایل الزامی است"); return; }
    if (!/^[0-9]+$/.test(mobile.trim())) { showToast("error", "فقط اعداد انگلیسی مجاز است"); return; }
    if (!firstName.trim()) { showToast("error", "نام الزامی است"); return; }
    if (!lastName.trim()) { showToast("error", "نام خانوادگی الزامی است"); return; }
    setSubmitting(true);
    try {
      const payload: Record<string, string> = {
        mobile: mobile.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };
      if (password.trim()) {
        if (password.trim().length < 6) { showToast("error", "رمز عبور حداقل ۶ کاراکتر باشد"); setSubmitting(false); return; }
        payload.password = password.trim();
      }
      await api.put(`/api/users/${selectedUser.id}`, payload);
      loadUsers();
      showToast("success", "کارمند بروزرسانی شد");
      setTimeout(() => setEditSheetOpen(false), 1200);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "خطا");
    }
    setSubmitting(false);
  };

  const openEditRate = (rate: Rate) => {
    setEditingRate(rate);
    setMarketRate(Number(rate.marketRate).toLocaleString("en-US"));
    setBuyRate(Number(rate.buyRate).toLocaleString("en-US"));
    setSellRate(Number(rate.sellRate).toLocaleString("en-US"));
  };

  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRate) return;
    setRateSaving(true);
    try {
      await api.post("/api/rates", {
        currencyId: editingRate.currencyId,
        marketRate: onlyDigits(marketRate),
        buyRate: onlyDigits(buyRate),
        sellRate: onlyDigits(sellRate),
      });
      loadRates();
      showToast("success", "نرخ بروزرسانی شد");
      setTimeout(() => setEditingRate(null), 1200);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "خطا در بروزرسانی نرخ");
    }
    setRateSaving(false);
  };

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
            <h1 className="text-[17px] font-bold tracking-tight text-gray-900">تنظیمات</h1>
          </div>
          <BarChart3 className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3">
          <div className="flex gap-1.5">
            {([["list", "کارکنان"], ["rates", "نرخ ارز"]] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={cn(
                  "rounded-[5px] px-4 py-1.5 text-[11px] font-semibold transition-all duration-200 whitespace-nowrap",
                  tab === value
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-gray-100/70 text-gray-400 hover:text-gray-600"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-28">
        {/* Users List */}
        {tab === "list" && (
          loading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-[5px] bg-white border border-gray-200/80 p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-[5px]" />
                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-5 w-14 rounded-[3px]" />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton className="h-2.5 w-20" />
                        <Skeleton className="h-2.5 w-16" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-[5px] bg-gray-50 mb-4">
                <UserPlus className="h-7 w-7 text-gray-300" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-gray-400">کارمندی ثبت نشده</p>
              <p className="text-xs text-gray-300 mt-1">برای شروع، دکمه + را بزنید</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {users.filter((u) => u.id !== user?.id).map((u) => (
                <div key={u.id} className="rounded-[5px] bg-white border border-gray-200/80 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-gray-900 text-[13px] font-bold text-white">
                      {u.firstName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">{u.firstName} {u.lastName}</p>
                        <span className={cn("rounded-[3px] px-1.5 py-0.5 text-[9px] font-semibold flex-shrink-0 mr-2", roleColors[u.role])}>
                          {roleLabels[u.role]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[11px] text-gray-400 tabular-nums" dir="ltr">{u.mobile}</span>
                        {u.lastLogin && (
                          <span className="text-[10px] text-gray-300">آخرین ورود: {new Date(u.lastLogin).toLocaleDateString("fa-IR")}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => openEditSheet(u)}
                      className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex-shrink-0"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Rates */}
        {tab === "rates" && (
          ratesLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-[5px] bg-white border border-gray-200/80 p-4 space-y-3">
                  <Skeleton className="h-3 w-20" />
                  <div className="grid grid-cols-3 gap-2">
                    <Skeleton className="h-10 rounded-[5px]" />
                    <Skeleton className="h-10 rounded-[5px]" />
                    <Skeleton className="h-10 rounded-[5px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {rates.map((r) => (
                <div key={r.id} className="rounded-[5px] bg-white border border-gray-200/80 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-gray-50">
                        <TrendingUp className="h-[18px] w-[18px] text-gray-500" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900">{r.currency.name}</p>
                        <p className="text-[10px] text-gray-400" dir="ltr">{r.currency.code}</p>
                      </div>
                    </div>
                    {editingRate?.id === r.id ? (
                      <button onClick={() => setEditingRate(null)} className="text-[11px] text-gray-400 font-medium">لغو</button>
                    ) : (
                      <button onClick={() => openEditRate(r)} className="flex items-center gap-1 text-[11px] text-blue-500 font-medium">
                        <Pencil className="h-3 w-3" strokeWidth={1.5} />
                        ویرایش
                      </button>
                    )}
                  </div>

                  {editingRate?.id === r.id ? (
                    <form onSubmit={handleRateSubmit} className="space-y-2.5">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <span className="text-[9px] text-gray-400 font-medium">بازار</span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={marketRate}
                            onChange={(e) => setMarketRate(formatNum(e.target.value))}
                            placeholder="0"
                            className="h-10 text-left text-[11px] rounded-[5px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-blue-500 font-medium">خرید</span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={buyRate}
                            onChange={(e) => setBuyRate(formatNum(e.target.value))}
                            placeholder="0"
                            className="h-10 text-left text-[11px] rounded-[5px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-emerald-500 font-medium">فروش</span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={sellRate}
                            onChange={(e) => setSellRate(formatNum(e.target.value))}
                            placeholder="0"
                            className="h-10 text-left text-[11px] rounded-[5px]"
                          />
                        </div>
                      </div>
                      <Button type="submit" isLoading={rateSaving} className="w-full h-10 rounded-[5px] bg-gray-900 hover:bg-gray-800 text-[12px]">
                        ذخیره نرخ
                      </Button>
                    </form>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-[5px] bg-gray-50 p-2.5 text-center">
                        <span className="text-[9px] text-gray-400 font-medium">بازار</span>
                        <p className="text-[12px] font-bold text-gray-700 mt-0.5" dir="ltr">{Number(r.marketRate).toLocaleString("en-US")}</p>
                      </div>
                      <div className="rounded-[5px] bg-blue-50 p-2.5 text-center">
                        <span className="text-[9px] text-blue-500 font-medium">خرید</span>
                        <p className="text-[12px] font-bold text-blue-700 mt-0.5" dir="ltr">{Number(r.buyRate).toLocaleString("en-US")}</p>
                      </div>
                      <div className="rounded-[5px] bg-emerald-50 p-2.5 text-center">
                        <span className="text-[9px] text-emerald-500 font-medium">فروش</span>
                        <p className="text-[12px] font-bold text-emerald-700 mt-0.5" dir="ltr">{Number(r.sellRate).toLocaleString("en-US")}</p>
                      </div>
                    </div>
                  )}

                  {r.changedBy && (
                    <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-gray-100">
                      <span className="text-[9px] text-gray-300">آخرین تغییر: {r.changedBy.firstName} {r.changedBy.lastName}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* FAB - only on list tab */}
      {tab === "list" && (
        <button
          onClick={openAddSheet}
          className="fixed bottom-24 left-4 z-30 flex h-12 items-center gap-2 rounded-[5px] bg-gray-900 pl-4 pr-3 text-white shadow-lg shadow-gray-900/20 transition-all active:scale-95 hover:bg-gray-800"
        >
          <span className="text-[13px] font-semibold">افزودن کارمند</span>
          <UserPlus className="h-5 w-5" strokeWidth={2} />
        </button>
      )}

      {/* Add Employee BottomSheet */}
      <BottomSheet isOpen={addSheetOpen} onClose={() => setAddSheetOpen(false)} title="افزودن کارمند" className="max-h-[85vh]">
        <form onSubmit={handleAddSubmit} className="space-y-4">
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
            <label className="text-[11px] font-medium text-gray-400">رمز عبور <span className="text-red-400">*</span></label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="حداقل ۶ کاراکتر"
              className="h-12 rounded-[5px]"
            />
          </div>

          <div className="rounded-[5px] bg-gray-50 p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">نقش کارمند</p>
            <div className="flex items-center gap-3 rounded-[5px] bg-white border border-gray-200 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-green-50">
                <UserPlus className="h-[18px] w-[18px] text-green-600" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-gray-900">صندوق‌دار</p>
                <p className="text-[10px] text-gray-400 mt-0.5">مدیریت سفارشات و مشتریان</p>
              </div>
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
            </div>
          </div>

          <Button type="submit" isLoading={submitting} className="w-full h-12 rounded-[5px] bg-gray-900 hover:bg-gray-800">
            <UserPlus className="h-4 w-4 ml-2" strokeWidth={1.5} />
            افزودن کارمند
          </Button>
        </form>
      </BottomSheet>

      {/* Edit Employee BottomSheet */}
      <BottomSheet isOpen={editSheetOpen} onClose={() => setEditSheetOpen(false)} title="ویرایش کارمند" className="max-h-[85vh]">
        <form onSubmit={handleEditSubmit} className="space-y-4">
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

          <div className="rounded-[5px] bg-gray-50 p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">تغییر رمز عبور</p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-gray-400">رمز عبور جدید</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور جدید (اختیاری)"
                className="h-12 rounded-[5px]"
              />
            </div>
          </div>

          {selectedUser && (
            <div className="rounded-[5px] bg-gray-50 p-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">نقش کارمند</p>
              <div className="flex items-center gap-3 rounded-[5px] bg-white border border-gray-200 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-green-50">
                  <UserPlus className="h-[18px] w-[18px] text-green-600" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-gray-900">{roleLabels[selectedUser.role] || selectedUser.role}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">مدیریت سفارشات و مشتریان</p>
                </div>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
              </div>
            </div>
          )}

          <Button type="submit" isLoading={submitting} className="w-full h-12 rounded-[5px] bg-gray-900 hover:bg-gray-800">
            ذخیره تغییرات
          </Button>
        </form>
      </BottomSheet>
    </main>
  );
}
