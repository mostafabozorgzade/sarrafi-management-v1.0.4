"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, ClipboardList, UserPlus, CheckCircle2, Trash2, Building2, Coins, Power, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { BottomSheet } from "@/components/ui/bottom-sheet";

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
  const [tab, setTab] = useState<"info" | "users">("info");

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

  const loadTenant = () => {
    api.get(`/api/tenants/${id}`)
      .then((data) => {
        setTenant(data);
        setEditName(data.name);
        setEditAddress(data.address || "");
        setEditPhone(data.phone || "");
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
              "flex items-center gap-1 rounded-[3px] px-2.5 py-1.5 text-[10px] font-medium transition-colors",
              tenant.isActive ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            )}
          >
            <Power className="h-3 w-3" strokeWidth={1.5} />
            {tenant.isActive ? "غیرفعال کردن" : "فعال کردن"}
          </button>
        </div>
        <div className="flex gap-1 px-4 pb-2">
          <button onClick={() => setTab("info")} className={cn("flex-1 rounded-md py-1.5 text-xs font-medium transition-colors", tab === "info" ? "bg-gray-900 text-white" : "text-gray-400")}>اطلاعات</button>
          <button onClick={() => setTab("users")} className={cn("flex-1 rounded-md py-1.5 text-xs font-medium transition-colors", tab === "users" ? "bg-gray-900 text-white" : "text-gray-400")}>کاربران ({tenant.users.length})</button>
        </div>
      </div>

      <div className="p-4 pb-24 space-y-3">
        {error && <ErrorAlert message={error} />}

        {tab === "info" && (
          <div className="space-y-3">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-[5px] bg-white border border-gray-200/80 p-3 text-center">
                <p className="text-[10px] text-gray-400 mb-1">کاربران</p>
                <p className="text-[18px] font-bold text-gray-900">{tenant._count.users}</p>
              </div>
              <div className="rounded-[5px] bg-white border border-gray-200/80 p-3 text-center">
                <p className="text-[10px] text-gray-400 mb-1">سفارشات</p>
                <p className="text-[18px] font-bold text-blue-600">{tenant._count.orders}</p>
              </div>
              <div className="rounded-[5px] bg-white border border-gray-200/80 p-3 text-center">
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
                    <span className="font-medium text-gray-700">{new Date(tenant.createdAt).toLocaleDateString("fa-IR")}</span>
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
          <div className="space-y-2">
            {success && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-600">
                <CheckCircle2 className="h-4 w-4" />کاربر اضافه شد
              </div>
            )}
            {tenant.users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 rounded-[5px] bg-white border border-gray-200/80">
                <div className="flex h-12 w-12 items-center justify-center rounded-[5px] bg-gray-50 mb-3">
                  <Users className="h-5 w-5 text-gray-300" strokeWidth={1.5} />
                </div>
                <p className="text-[13px] font-medium text-gray-400">هنوز کاربری اضافه نشده</p>
              </div>
            ) : (
              tenant.users.map((u) => (
                <div key={u.id} className="rounded-[5px] bg-white border border-gray-200/80 p-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-[5px] text-xs font-bold",
                      u.isActive ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400"
                    )}>
                      {u.firstName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-gray-900">{u.firstName} {u.lastName}</span>
                        <span className={cn("rounded-[3px] px-1.5 py-0.5 text-[9px] font-medium", roleColors[u.role])}>{roleLabels[u.role]}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-gray-400" dir="ltr">{u.mobile}</span>
                        {u.lastLogin && (
                          <span className="text-[9px] text-gray-300">آخرین ورود: {new Date(u.lastLogin).toLocaleDateString("fa-IR")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => openEditUser(u)}
                      className="flex items-center gap-1 rounded-[3px] px-2 py-1 text-[10px] font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Pencil className="h-3 w-3" strokeWidth={1.5} />
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleToggleUserActive(u)}
                      className={cn(
                        "flex items-center gap-1 rounded-[3px] px-2 py-1 text-[10px] font-medium transition-colors",
                        u.isActive ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                      )}
                    >
                      <Power className="h-3 w-3" strokeWidth={1.5} />
                      {u.isActive ? "غیرفعال" : "فعال"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* FAB - Add User */}
      {tab === "users" && (
        <button
          onClick={() => setAddUserOpen(true)}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-[13px] font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="h-4 w-4" strokeWidth={1.5} />
          افزودن کاربر
        </button>
      )}

      {/* Add User BottomSheet */}
      <BottomSheet isOpen={addUserOpen} onClose={() => setAddUserOpen(false)} title={`افزودن کاربر به ${tenant.name}`}>
        <div>
          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-600 mb-3">
              <CheckCircle2 className="h-4 w-4" />کاربر اضافه شد
            </div>
          )}
          <form onSubmit={handleAddUser} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-gray-500">شماره موبایل</label>
              <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="09..." className="h-11" dir="ltr" inputMode="numeric" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-gray-500">نام</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="نام" className="h-11" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-gray-500">نام خانوادگی</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="نام خانوادگی" className="h-11" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-gray-500">رمز عبور</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="حداقل ۶ کاراکتر" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-gray-500">نقش</label>
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
                      "rounded-[5px] border px-3 py-2.5 text-[12px] font-medium transition-colors",
                      role === r.value
                        ? r.color === "green" ? "border-green-500 bg-green-50 text-green-700"
                        : r.color === "blue" ? "border-blue-500 bg-blue-50 text-blue-700"
                        : r.color === "red" ? "border-red-500 bg-red-50 text-red-700"
                        : "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-gray-200 bg-white text-gray-500"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" isLoading={creating} className="w-full h-11">
              <UserPlus className="h-4 w-4" strokeWidth={1.5} />
              افزودن کاربر
            </Button>
          </form>
        </div>
      </BottomSheet>

      {/* Edit User BottomSheet */}
      <BottomSheet isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="ویرایش کاربر">
        {editingUser && (
          <div>
            {editUserSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-600 mb-3">
                <CheckCircle2 className="h-4 w-4" />کاربر بروزرسانی شد
              </div>
            )}
            <form onSubmit={handleEditUser} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-gray-500">شماره موبایل</label>
                <Input value={editUserMobile} onChange={(e) => setEditUserMobile(e.target.value)} className="h-11" dir="ltr" inputMode="numeric" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-gray-500">نام</label>
                <Input value={editUserFirstName} onChange={(e) => setEditUserFirstName(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-gray-500">نام خانوادگی</label>
                <Input value={editUserLastName} onChange={(e) => setEditUserLastName(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-gray-500">نقش</label>
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
                        "rounded-[5px] border px-3 py-2.5 text-[12px] font-medium transition-colors",
                        editUserRole === r.value
                          ? r.color === "green" ? "border-green-500 bg-green-50 text-green-700"
                          : r.color === "blue" ? "border-blue-500 bg-blue-50 text-blue-700"
                          : r.color === "red" ? "border-red-500 bg-red-50 text-red-700"
                          : "border-violet-500 bg-violet-50 text-violet-700"
                          : "border-gray-200 bg-white text-gray-500"
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-gray-500">رمز عبور جدید (اختیاری)</label>
                <Input type="password" value={editUserPassword} onChange={(e) => setEditUserPassword(e.target.value)} placeholder="برای تغییر رمز وارد کنید" className="h-11" />
              </div>
              <Button type="submit" isLoading={editUserSaving} className="w-full h-11">
                <Pencil className="h-4 w-4" strokeWidth={1.5} />
                ذخیره تغییرات
              </Button>
            </form>
          </div>
        )}
      </BottomSheet>
    </main>
  );
}
