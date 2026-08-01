"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, UserPlus, CheckCircle2, Coins, Power, Pencil, CreditCard, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { formatJalaliDate } from "@/lib/jalali";

interface CurrencyRate {
  buyRate: number;
  sellRate: number;
  marketRate: number;
}

interface CurrencyItem {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
  isActive: boolean;
  currencyRates: CurrencyRate[];
}

interface TenantDetail {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  billingMode: "FREE" | "SUBSCRIPTION" | "PERCENTAGE";
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  percentageBase: string | null;
  percentageRate: number | null;
  fixedFeePer1000PKR: string | null;
  amountDue: string;
  amountDueLastCalculated: string | null;
  _count: { users: number; orders: number; customers: number; transactions: number; currencies: number; cashRegisters: number };
  users: { id: string; mobile: string; firstName: string; lastName: string; role: string; isActive: boolean; lastLogin: string | null }[];
  currencies: CurrencyItem[];
}

const roleLabels: Record<string, string> = { SUPER_ADMIN: "سوپرادمین", OWNER: "مالک", MANAGER: "مدیر", CASHIER: "صندوق‌دار", ACCOUNTANT: "حسابدار" };
const roleColors: Record<string, string> = { SUPER_ADMIN: "bg-amber-50 text-amber-600", OWNER: "bg-red-50 text-red-600", MANAGER: "bg-blue-50 text-blue-600", CASHIER: "bg-green-50 text-green-600", ACCOUNTANT: "bg-violet-50 text-violet-600" };

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"info" | "users" | "billing">("info");

  useEffect(() => {
    if (!authLoading && user && user.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const [mobile, setMobile] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CASHIER");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [creating, setCreating] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const [editingUser, setEditingUser] = useState<{ id: string; firstName: string; lastName: string; mobile: string; role: string; isActive: boolean } | null>(null);
  const [editUserFirstName, setEditUserFirstName] = useState("");
  const [editUserLastName, setEditUserLastName] = useState("");
  const [editUserMobile, setEditUserMobile] = useState("");
  const [editUserRole, setEditUserRole] = useState("");
  const [editUserPassword, setEditUserPassword] = useState("");
  const [editUserSaving, setEditUserSaving] = useState(false);
  const [editUserSuccess, setEditUserSuccess] = useState(false);

  const [addUserOpen, setAddUserOpen] = useState(false);

  const [editBillingMode, setEditBillingMode] = useState<"FREE" | "SUBSCRIPTION" | "PERCENTAGE">("FREE");
  const [editSubStart, setEditSubStart] = useState("");
  const [editSubEnd, setEditSubEnd] = useState("");
  const [editPercentageBase, setEditPercentageBase] = useState("total");
  const [editPercentageRate, setEditPercentageRate] = useState("");
  const [editFixedFee, setEditFixedFee] = useState("");
  const [editAmountDue, setEditAmountDue] = useState("");
  const [billingSaving, setBillingSaving] = useState(false);
  const [billingSuccess, setBillingSuccess] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const loadTenant = () => {
    api.get(`/api/tenants/${id}`)
      .then((data) => {
        setTenant(data);
        setEditName(data.name);
        setEditAddress(data.address || "");
        setEditPhone(data.phone || "");
        setEditBillingMode(data.billingMode || "FREE");
        setEditSubStart(data.subscriptionStart ? data.subscriptionStart.split("T")[0] : "");
        setEditSubEnd(data.subscriptionEnd ? data.subscriptionEnd.split("T")[0] : "");
        setEditPercentageBase(data.percentageBase || "total");
        setEditPercentageRate(data.percentageRate?.toString() || "");
        setEditFixedFee(data.fixedFeePer1000PKR?.toString() || "");
        setEditAmountDue(data.amountDue?.toString() || "0");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadTenant(); }, [id]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!mobile || !firstName || !lastName || !password) { setError("فیلدهای الزامی را پر کنید"); return; }
    setCreating(true);
    try {
      await api.post(`/api/tenants/${id}/users`, { mobile, firstName, lastName, password, role });
      setSuccess(true);
      loadTenant();
      setTimeout(() => { setSuccess(false); setAddUserOpen(false); setMobile(""); setFirstName(""); setLastName(""); setPassword(""); setRole("CASHIER"); }, 1500);
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
    setCreating(false);
  };

  const handleEditTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!editName) { setError("نام صرافی الزامی است"); return; }
    setEditSaving(true);
    try {
      await api.put(`/api/tenants/${id}`, { name: editName, address: editAddress, phone: editPhone });
      setEditSuccess(true);
      loadTenant();
      setTimeout(() => { setEditSuccess(false); setEditing(false); }, 1500);
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
    setEditSaving(false);
  };

  const handleToggleActive = async () => {
    if (!tenant) return;
    try {
      await api.put(`/api/tenants/${id}`, { isActive: !tenant.isActive });
      loadTenant();
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
  };

  const openEditUser = (u: { id: string; firstName: string; lastName: string; mobile: string; role: string; isActive: boolean }) => {
    setEditingUser(u);
    setEditUserFirstName(u.firstName);
    setEditUserLastName(u.lastName);
    setEditUserMobile(u.mobile);
    setEditUserRole(u.role);
    setEditUserPassword("");
    setEditUserSuccess(false);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditUserSaving(true);
    try {
      const data: Record<string, unknown> = {
        firstName: editUserFirstName,
        lastName: editUserLastName,
        mobile: editUserMobile,
        role: editUserRole,
      };
      if (editUserPassword) data.password = editUserPassword;
      await api.put(`/api/users/${editingUser.id}`, data);
      setEditUserSuccess(true);
      loadTenant();
      setTimeout(() => { setEditUserSuccess(false); setEditingUser(null); }, 1500);
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
    setEditUserSaving(false);
  };

  const handleToggleUserActive = async (u: { id: string; isActive: boolean }) => {
    try {
      await api.put(`/api/users/${u.id}`, { isActive: !u.isActive });
      loadTenant();
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
  };

  const handleSaveBilling = async () => {
    setError(null);
    setBillingSaving(true);
    try {
      const data: Record<string, unknown> = {
        billingMode: editBillingMode,
      };

      if (editBillingMode === "SUBSCRIPTION") {
        if (!editSubStart || !editSubEnd) {
          setError("تاریخ شروع و پایان اشتراک الزامی است");
          setBillingSaving(false);
          return;
        }
        data.subscriptionStart = editSubStart;
        data.subscriptionEnd = editSubEnd;
      } else if (editBillingMode === "PERCENTAGE") {
        if (!editPercentageRate && !editFixedFee) {
          setError("حداقل یکی از درصد یا مبلغ ثابت را وارد کنید");
          setBillingSaving(false);
          return;
        }
        data.percentageBase = editPercentageBase;
        data.percentageRate = editPercentageRate ? parseFloat(editPercentageRate) : null;
        data.fixedFeePer1000PKR = editFixedFee ? parseInt(editFixedFee) : null;
        data.amountDue = editAmountDue || "0";
      }

      await api.put(`/api/tenants/${id}`, data);
      setBillingSuccess(true);
      loadTenant();
      setTimeout(() => setBillingSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ذخیره اشتراک");
    }
    setBillingSaving(false);
  };

  const handleCalculateBilling = async () => {
    setCalculating(true);
    setError(null);
    try {
      await api.post("/api/admin/billing", { tenantId: id });
      loadTenant();
      setBillingSuccess(true);
      setTimeout(() => setBillingSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در محاسبه صورتحساب");
    }
    setCalculating(false);
  };

  if (loading) return (
    <main className="min-h-dvh bg-[#fafafa]">
      <div className="bg-white border-b border-gray-100/80">
        <div className="flex h-14 items-center px-5 gap-2.5">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[5px] bg-white border border-gray-200/80 p-4">
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </main>
  );

  if (!tenant) return (
    <main className="min-h-dvh bg-[#fafafa] flex items-center justify-center">
      <p className="text-[13px] text-gray-400">صرافی یافت نشد</p>
    </main>
  );

  return (
    <main className="min-h-dvh bg-[#fafafa]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100/80">
        <div className="flex h-14 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <Link href="/admin" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            </Link>
            <h1 className="text-[17px] font-bold tracking-tight text-gray-900">{tenant.name}</h1>
          </div>
          <button
            onClick={handleToggleActive}
            className={cn(
              "flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95",
              tenant.isActive ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            )}
          >
            <Power className="h-3.5 w-3.5" strokeWidth={1.5} />
            {tenant.isActive ? "غیرفعال" : "فعال"}
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3">
          <div className="flex gap-1.5">
            <button
              onClick={() => setTab("info")}
              className={cn(
                "rounded-[5px] px-4 py-1.5 text-[11px] font-semibold transition-all duration-200",
                tab === "info"
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-100/70 text-gray-400 hover:text-gray-600"
              )}
            >
              اطلاعات
            </button>
            <button
              onClick={() => setTab("users")}
              className={cn(
                "rounded-[5px] px-4 py-1.5 text-[11px] font-semibold transition-all duration-200",
                tab === "users"
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-100/70 text-gray-400 hover:text-gray-600"
              )}
            >
              کاربران ({tenant.users.length})
            </button>
            <button
              onClick={() => setTab("billing")}
              className={cn(
                "rounded-[5px] px-4 py-1.5 text-[11px] font-semibold transition-all duration-200",
                tab === "billing"
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-100/70 text-gray-400 hover:text-gray-600"
              )}
            >
              اشتراک و صورتحساب
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-28">
        {error && <ErrorAlert message={error} />}

        {tab === "info" && (
          <div className="space-y-3">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-[5px] bg-white border border-gray-200/80 p-3 text-center active:bg-gray-50 transition-colors">
                <p className="text-[10px] text-gray-400 mb-1">کاربران</p>
                <p className="text-[18px] font-bold text-gray-900">{tenant._count.users}</p>
              </div>
              <div className="rounded-[5px] bg-white border border-gray-200/80 p-3 text-center active:bg-gray-50 transition-colors">
                <p className="text-[10px] text-gray-400 mb-1">سفارشات</p>
                <p className="text-[18px] font-bold text-blue-600">{tenant._count.orders}</p>
              </div>
              <div className="rounded-[5px] bg-white border border-gray-200/80 p-3 text-center active:bg-gray-50 transition-colors">
                <p className="text-[10px] text-gray-400 mb-1">مشتریان</p>
                <p className="text-[18px] font-bold text-emerald-600">{tenant._count.customers}</p>
              </div>
            </div>

            {/* Edit Form */}
            {editing ? (
              <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
                {editSuccess && (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-600 mb-3">
                    <CheckCircle2 className="h-4 w-4" />بروزرسانی شد
                  </div>
                )}
                <form onSubmit={handleEditTenant} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-gray-500">نام</label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-11" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-gray-500">آدرس</label>
                    <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="h-11" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-gray-500">تلفن</label>
                    <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="h-11" dir="ltr" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" isLoading={editSaving} className="flex-1 h-11">ذخیره</Button>
                    <button type="button" onClick={() => setEditing(false)} className="flex-1 h-11 rounded-lg border border-gray-200 text-xs font-medium text-gray-500">لغو</button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-semibold text-gray-900">اطلاعات صرافی</h3>
                  <button onClick={() => setEditing(true)} className="text-[11px] text-blue-500 font-medium">ویرایش</button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-gray-400">نام</span>
                    <span className="font-medium text-gray-700">{tenant.name}</span>
                  </div>
                  {tenant.address && (
                    <div className="flex justify-between text-[12px]">
                      <span className="text-gray-400">آدرس</span>
                      <span className="font-medium text-gray-700">{tenant.address}</span>
                    </div>
                  )}
                  {tenant.phone && (
                    <div className="flex justify-between text-[12px]">
                      <span className="text-gray-400">تلفن</span>
                      <span className="font-medium text-gray-700" dir="ltr">{tenant.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[12px]">
                    <span className="text-gray-400">صندوق‌ها</span>
                    <span className="font-medium text-gray-700">{tenant._count.cashRegisters}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-gray-400">تاریخ ایجاد</span>
                    <span className="font-medium text-gray-700">{formatJalaliDate(tenant.createdAt)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Currencies & Rates */}
            <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Coins className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
                <h3 className="text-[13px] font-semibold text-gray-900">ارزها و نرخ‌ها</h3>
              </div>
              {tenant.currencies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-[12px] text-gray-400">هنوز ارزی تعریف نشده</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tenant.currencies.map((c) => {
                    const rate = c.currencyRates[0];
                    return (
                      <div key={c.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-[10px] font-bold text-blue-600">
                            {c.code}
                          </div>
                          <div>
                            <span className="text-[12px] font-semibold text-gray-900">{c.name}</span>
                            {c.symbol && <span className="text-[10px] text-gray-400 mr-1">({c.symbol})</span>}
                          </div>
                        </div>
                        {rate && (
                          <div className="flex items-center gap-2 text-[11px]">
                            <div className="text-center">
                              <p className="text-[9px] text-gray-400">مارکت</p>
                              <p className="font-semibold text-gray-700" dir="ltr">{rate.marketRate.toLocaleString()}</p>
                            </div>
                            <div className="h-4 w-px bg-gray-200" />
                            <div className="text-center">
                              <p className="text-[9px] text-gray-400">خرید</p>
                              <p className="font-semibold text-emerald-600" dir="ltr">{rate.buyRate.toLocaleString()}</p>
                            </div>
                            <div className="h-4 w-px bg-gray-200" />
                            <div className="text-center">
                              <p className="text-[9px] text-gray-400">فروش</p>
                              <p className="font-semibold text-red-600" dir="ltr">{rate.sellRate.toLocaleString()}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-2.5">
            {success && (
              <div className="flex items-center gap-2.5 rounded-[5px] bg-white border border-gray-100 px-4 py-3 shadow-lg shadow-black/5 animate-slide-up">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                <span className="text-[13px] font-medium text-gray-700">کاربر اضافه شد</span>
              </div>
            )}
            {tenant.users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="flex h-16 w-16 items-center justify-center rounded-[5px] bg-gray-50 mb-4">
                  <Users className="h-7 w-7 text-gray-300" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-medium text-gray-400">هنوز کاربری اضافه نشده</p>
                <p className="text-xs text-gray-300 mt-1">برای شروع، دکمه + را بزنید</p>
              </div>
            ) : (
              tenant.users.map((u) => (
                <div key={u.id} className="rounded-[5px] bg-white border border-gray-200/80 p-4 active:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-[5px] text-xs font-bold",
                      u.isActive ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400"
                    )}>
                      {u.firstName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-gray-900 leading-tight">{u.firstName} {u.lastName}</p>
                        <span className={cn("rounded-[3px] px-2 py-0.5 text-[10px] font-semibold", roleColors[u.role])}>{roleLabels[u.role]}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-gray-400" dir="ltr">{u.mobile}</span>
                        {u.lastLogin && (
                          <span className="text-[10px] text-gray-300">آخرین ورود: {formatJalaliDate(u.lastLogin)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2.5 border-t border-gray-100">
                    <button
                      onClick={() => openEditUser(u)}
                      className="flex items-center gap-1.5 rounded-[5px] bg-gray-100/70 px-3 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-200/70 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleToggleUserActive(u)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-[11px] font-semibold transition-colors",
                        u.isActive ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      )}
                    >
                      <Power className="h-3.5 w-3.5" strokeWidth={1.5} />
                      {u.isActive ? "غیرفعال" : "فعال"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "billing" && (
          <div className="space-y-3">
            {billingSuccess && (
              <div className="flex items-center gap-2.5 rounded-[5px] bg-white border border-gray-100 px-4 py-3 shadow-lg shadow-black/5 animate-slide-up">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                <span className="text-[13px] font-medium text-gray-700">اطلاعات اشتراک ذخیره شد</span>
              </div>
            )}

            {/* Current Status */}
            <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
              <h3 className="text-[13px] font-semibold text-gray-900 mb-3">وضعیت فعلی</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-400">نوع اشتراک</span>
                  <span className={cn(
                    "rounded-[3px] px-2 py-0.5 text-[10px] font-semibold",
                    tenant.billingMode === "FREE" ? "bg-gray-100 text-gray-600" :
                    tenant.billingMode === "SUBSCRIPTION" ? "bg-blue-50 text-blue-600" :
                    "bg-amber-50 text-amber-600"
                  )}>
                    {tenant.billingMode === "FREE" ? "رایگان" : tenant.billingMode === "SUBSCRIPTION" ? "اشتراک ماهیانه" : "درصدی/کارمزدی"}
                  </span>
                </div>
                {tenant.billingMode === "SUBSCRIPTION" && tenant.subscriptionEnd && (
                  <>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-gray-400">شروع اشتراک</span>
                      <span className="font-medium text-gray-700">{formatJalaliDate(tenant.subscriptionStart)}</span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-gray-400">پایان اشتراک</span>
                      <span className="font-medium text-gray-700">{formatJalaliDate(tenant.subscriptionEnd)}</span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-gray-400">روزهای باقی‌مانده</span>
                      <span className={cn(
                        "font-semibold",
                        Math.ceil((new Date(tenant.subscriptionEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) < 0
                          ? "text-red-600"
                          : Math.ceil((new Date(tenant.subscriptionEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 7
                          ? "text-amber-600"
                          : "text-emerald-600"
                      )}>
                        {Math.max(0, Math.ceil((new Date(tenant.subscriptionEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} روز
                      </span>
                    </div>
                  </>
                )}
                {tenant.billingMode === "PERCENTAGE" && (
                  <>
                    {tenant.percentageRate && (
                      <div className="flex justify-between text-[12px]">
                        <span className="text-gray-400">درصد کارمزد</span>
                        <span className="font-medium text-gray-700">{tenant.percentageRate}% از {tenant.percentageBase === "profit" ? "سود" : "کل مبلغ"}</span>
                      </div>
                    )}
                    {tenant.fixedFeePer1000PKR && (
                      <div className="flex justify-between text-[12px]">
                        <span className="text-gray-400">مبلغ ثابت هر ۱۰۰۰ روپیه</span>
                        <span className="font-medium text-gray-700">{Number(tenant.fixedFeePer1000PKR).toLocaleString("fa-IR")} تومان</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[12px]">
                      <span className="text-gray-400">مبلغ قابل پرداخت</span>
                      <span className={cn("font-bold", Number(tenant.amountDue) > 0 ? "text-red-600" : "text-emerald-600")}>
                        {Number(tenant.amountDue).toLocaleString("fa-IR")} تومان
                      </span>
                    </div>
                    {tenant.amountDueLastCalculated && (
                      <div className="flex justify-between text-[12px]">
                        <span className="text-gray-400">آخرین محاسبه</span>
                        <span className="font-medium text-gray-700">{formatJalaliDate(tenant.amountDueLastCalculated)}</span>
                      </div>
                    )}
                    <button
                      onClick={handleCalculateBilling}
                      disabled={calculating}
                      className="flex items-center justify-center gap-1.5 w-full h-10 rounded-[5px] bg-blue-50 text-[11px] font-semibold text-blue-600 hover:bg-blue-100 transition-colors mt-2"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", calculating && "animate-spin")} strokeWidth={1.5} />
                      {calculating ? "در حال محاسبه..." : "محاسبه مجدد صورتحساب"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Edit Billing */}
            <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-gray-900">تغییر نوع اشتراک</h3>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-gray-500">نوع اشتراک</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "FREE", label: "رایگان", color: "gray" },
                      { value: "SUBSCRIPTION", label: "اشتراکی", color: "blue" },
                      { value: "PERCENTAGE", label: "درصدی", color: "amber" },
                    ].map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setEditBillingMode(m.value as typeof editBillingMode)}
                        className={cn(
                          "rounded-[5px] border px-3 py-2.5 text-[11px] font-semibold transition-all duration-200",
                          editBillingMode === m.value
                            ? m.color === "gray" ? "border-gray-500 bg-gray-50 text-gray-700 shadow-sm"
                            : m.color === "blue" ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                            : "border-amber-500 bg-amber-50 text-amber-700 shadow-sm"
                            : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                        )}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {editBillingMode === "SUBSCRIPTION" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-gray-500">تاریخ شروع</label>
                      <JalaliDatePicker
                        value={editSubStart}
                        onChange={setEditSubStart}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-gray-500">تاریخ پایان</label>
                      <JalaliDatePicker
                        value={editSubEnd}
                        onChange={setEditSubEnd}
                      />
                    </div>
                  </>
                )}

                {editBillingMode === "PERCENTAGE" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-gray-500">مبنا محاسبه درصد</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "total", label: "کل مبلغ معامله" },
                          { value: "profit", label: "سود معامله" },
                        ].map((b) => (
                          <button
                            key={b.value}
                            type="button"
                            onClick={() => setEditPercentageBase(b.value)}
                            className={cn(
                              "rounded-[5px] border px-3 py-2.5 text-[11px] font-semibold transition-all duration-200",
                              editPercentageBase === b.value
                                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                            )}
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-gray-500">درصد کارمزد (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editPercentageRate}
                        onChange={(e) => setEditPercentageRate(e.target.value)}
                        placeholder="مثلاً 0.5"
                        dir="ltr"
                        className="h-11 w-full rounded-[5px] border border-gray-200 bg-white px-3 text-[13px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-gray-500">مبلغ ثابت به ازای هر ۱۰۰۰ روپیه (تومان)</label>
                      <input
                        type="number"
                        value={editFixedFee}
                        onChange={(e) => setEditFixedFee(e.target.value)}
                        placeholder="اختیاری"
                        dir="ltr"
                        className="h-11 w-full rounded-[5px] border border-gray-200 bg-white px-3 text-[13px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-gray-500">مبلغ قابل پرداخت (تومان) - قابل ویرایش</label>
                      <input
                        type="number"
                        value={editAmountDue}
                        onChange={(e) => setEditAmountDue(e.target.value)}
                        dir="ltr"
                        className="h-11 w-full rounded-[5px] border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:outline-none focus:border-gray-400 transition-all"
                      />
                    </div>
                  </>
                )}

                <button
                  onClick={handleSaveBilling}
                  disabled={billingSaving}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-[5px] bg-gray-900 text-[13px] font-semibold text-white shadow-sm transition-all active:scale-[0.98] hover:bg-gray-800 disabled:opacity-50"
                >
                  {billingSaving ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  ) : (
                    <CreditCard className="h-4 w-4" strokeWidth={1.5} />
                  )}
                  ذخیره تغییرات اشتراک
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      {tab === "users" && (
        <button
          onClick={() => setAddUserOpen(true)}
          className="fixed bottom-24 left-4 z-30 flex h-12 items-center gap-2 rounded-[5px] bg-gray-900 pl-4 pr-3 text-white shadow-lg shadow-gray-900/20 transition-all active:scale-95 hover:bg-gray-800"
        >
          <span className="text-[13px] font-semibold">افزودن کاربر</span>
          <UserPlus className="h-5 w-5" strokeWidth={2} />
        </button>
      )}

      {/* Add User BottomSheet */}
      <BottomSheet isOpen={addUserOpen} onClose={() => setAddUserOpen(false)} title={`افزودن کاربر به ${tenant.name}`}>
        <div>
          {success && (
            <div className="flex items-center gap-2.5 rounded-[5px] bg-white border border-gray-100 px-4 py-3 shadow-lg shadow-black/5 animate-slide-up mb-3">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
              <span className="text-[13px] font-medium text-gray-700">کاربر اضافه شد</span>
            </div>
          )}
          <form onSubmit={handleAddUser} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-500">شماره موبایل</label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="09..."
                dir="ltr"
                inputMode="numeric"
                className="h-11 w-full rounded-[5px] border border-gray-200 bg-white px-3 text-[13px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 focus:shadow-sm transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-500">نام</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="نام"
                className="h-11 w-full rounded-[5px] border border-gray-200 bg-white px-3 text-[13px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 focus:shadow-sm transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-500">نام خانوادگی</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="نام خانوادگی"
                className="h-11 w-full rounded-[5px] border border-gray-200 bg-white px-3 text-[13px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 focus:shadow-sm transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-500">رمز عبور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="حداقل ۶ کاراکتر"
                className="h-11 w-full rounded-[5px] border border-gray-200 bg-white px-3 text-[13px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 focus:shadow-sm transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-gray-500">نقش</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "CASHIER", label: "صندوق‌دار", color: "green" },
                  { value: "MANAGER", label: "مدیر", color: "blue" },
                  { value: "OWNER", label: "مالک", color: "red" },
                  { value: "ACCOUNTANT", label: "حسابدار", color: "violet" },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={cn(
                      "rounded-[5px] border px-3 py-2.5 text-[12px] font-semibold transition-all duration-200",
                      role === r.value
                        ? r.color === "green" ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                        : r.color === "blue" ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                        : r.color === "red" ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                        : "border-violet-500 bg-violet-50 text-violet-700 shadow-sm"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[5px] bg-gray-900 text-[13px] font-semibold text-white shadow-sm transition-all active:scale-[0.98] hover:bg-gray-800 disabled:opacity-50"
            >
              {creating ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                <UserPlus className="h-4 w-4" strokeWidth={1.5} />
              )}
              افزودن کاربر
            </button>
          </form>
        </div>
      </BottomSheet>

      {/* Edit User BottomSheet */}
      <BottomSheet isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="ویرایش کاربر">
        {editingUser && (
          <div>
            {editUserSuccess && (
              <div className="flex items-center gap-2.5 rounded-[5px] bg-white border border-gray-100 px-4 py-3 shadow-lg shadow-black/5 animate-slide-up mb-3">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                <span className="text-[13px] font-medium text-gray-700">کاربر بروزرسانی شد</span>
              </div>
            )}
            <form onSubmit={handleEditUser} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-500">شماره موبایل</label>
                <input
                  type="text"
                  value={editUserMobile}
                  onChange={(e) => setEditUserMobile(e.target.value)}
                  dir="ltr"
                  inputMode="numeric"
                  className="h-11 w-full rounded-[5px] border border-gray-200 bg-white px-3 text-[13px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 focus:shadow-sm transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-500">نام</label>
                <input
                  type="text"
                  value={editUserFirstName}
                  onChange={(e) => setEditUserFirstName(e.target.value)}
                  className="h-11 w-full rounded-[5px] border border-gray-200 bg-white px-3 text-[13px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 focus:shadow-sm transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-500">نام خانوادگی</label>
                <input
                  type="text"
                  value={editUserLastName}
                  onChange={(e) => setEditUserLastName(e.target.value)}
                  className="h-11 w-full rounded-[5px] border border-gray-200 bg-white px-3 text-[13px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 focus:shadow-sm transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-500">نقش</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "CASHIER", label: "صندوق‌دار", color: "green" },
                    { value: "MANAGER", label: "مدیر", color: "blue" },
                    { value: "OWNER", label: "مالک", color: "red" },
                    { value: "ACCOUNTANT", label: "حسابدار", color: "violet" },
                  ].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setEditUserRole(r.value)}
                      className={cn(
                        "rounded-[5px] border px-3 py-2.5 text-[12px] font-semibold transition-all duration-200",
                        editUserRole === r.value
                          ? r.color === "green" ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                          : r.color === "blue" ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                          : r.color === "red" ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                          : "border-violet-500 bg-violet-50 text-violet-700 shadow-sm"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-500">رمز عبور جدید (اختیاری)</label>
                <input
                  type="password"
                  value={editUserPassword}
                  onChange={(e) => setEditUserPassword(e.target.value)}
                  placeholder="برای تغییر رمز وارد کنید"
                  className="h-11 w-full rounded-[5px] border border-gray-200 bg-white px-3 text-[13px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 focus:shadow-sm transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={editUserSaving}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-[5px] bg-gray-900 text-[13px] font-semibold text-white shadow-sm transition-all active:scale-[0.98] hover:bg-gray-800 disabled:opacity-50"
              >
                {editUserSaving ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                ) : (
                  <Pencil className="h-4 w-4" strokeWidth={1.5} />
                )}
                ذخیره تغییرات
              </button>
            </form>
          </div>
        )}
      </BottomSheet>
    </main>
  );
}
