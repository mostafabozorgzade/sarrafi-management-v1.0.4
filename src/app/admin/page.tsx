"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  ClipboardList,
  Plus,
  CheckCircle2,
  Search,
  X,
  Coins,
  ArrowLeft,
  Trash2,
  AlertTriangle,
  Power,
  Calendar,
  CreditCard,
} from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";

interface Tenant {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  billingMode: "FREE" | "SUBSCRIPTION" | "PERCENTAGE";
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  percentageRate: number | null;
  fixedFeePer1000PKR: string | null;
  amountDue: string;
  _count: { users: number; orders: number; customers: number; transactions: number };
}

interface CurrencyItem {
  code: string;
  name: string;
  symbol: string;
  enabled: boolean;
  buyRate: string;
  sellRate: string;
  marketRate: string;
}

const availableCurrencies: Omit<CurrencyItem, "enabled" | "buyRate" | "sellRate" | "marketRate">[] = [
  { code: "PKR", name: "روپیه پاکستان", symbol: "Rs" },
  { code: "USD", name: "دلار آمریکا", symbol: "$" },
  { code: "EUR", name: "یورو", symbol: "€" },
  { code: "AED", name: "درهم امارات", symbol: "د.إ" },
  { code: "TRY", name: "لیر ترکیه", symbol: "₺" },
  { code: "CNY", name: "یوان چین", symbol: "¥" },
  { code: "GBP", name: "پوند انگلیس", symbol: "£" },
  { code: "SAR", name: "ریال عربستان", symbol: "﷼" },
];

const FILTER_TABS = [
  { value: "all", label: "همه" },
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
] as const;

function getBillingBadge(tenant: Tenant) {
  if (tenant.billingMode === "SUBSCRIPTION" && tenant.subscriptionEnd) {
    const endDate = new Date(tenant.subscriptionEnd);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = daysLeft < 0;
    return {
      label: isExpired ? "منقضی شده" : `${daysLeft} روز باقی‌مانده`,
      subLabel: `اشتراک تا ${endDate.toLocaleDateString("fa-IR")}`,
      color: isExpired ? "bg-red-50 text-red-600" : daysLeft <= 7 ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600",
      icon: Calendar,
    };
  }
  if (tenant.billingMode === "PERCENTAGE") {
    const amount = Number(tenant.amountDue || 0);
    return {
      label: amount > 0 ? `${amount.toLocaleString("fa-IR")} تومان` : "بدون بدهی",
      subLabel: "صورتحساب درصدی",
      color: amount > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600",
      icon: CreditCard,
    };
  }
  return null;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [currencies, setCurrencies] = useState<CurrencyItem[]>(
    availableCurrencies.map((c) => ({ ...c, enabled: false, buyRate: "", sellRate: "", marketRate: "" }))
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && user && user.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const loadTenants = () => {
    api.get("/api/tenants")
      .then((data) => { setTenants(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadTenants(); }, []);

  const filteredTenants = tenants.filter((t) => {
    if (filter === "active" && !t.isActive) return false;
    if (filter === "inactive" && t.isActive) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.address?.toLowerCase().includes(q) || t.phone?.includes(q);
    }
    return true;
  });

  const toggleCurrency = (code: string) => {
    setCurrencies((prev) =>
      prev.map((c) => (c.code === code ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const updateCurrencyRate = (code: string, field: "buyRate" | "sellRate" | "marketRate", value: string) => {
    setCurrencies((prev) =>
      prev.map((c) => (c.code === code ? { ...c, [field]: value } : c))
    );
  };

  const handleNextStep = () => {
    setError(null);
    if (!name) { setError("نام صرافی الزامی است"); return; }
    setStep(2);
  };

  const resetForm = () => {
    setStep(1);
    setName("");
    setAddress("");
    setPhone("");
    setCurrencies(availableCurrencies.map((c) => ({ ...c, enabled: false, buyRate: "", sellRate: "", marketRate: "" })));
    setError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const enabledCurrencies = currencies.filter((c) => c.enabled);
    if (enabledCurrencies.length === 0) {
      setError("حداقل یک ارز را انتخاب کنید");
      return;
    }

    for (const c of enabledCurrencies) {
      if (!c.buyRate || !c.sellRate || !c.marketRate) {
        setError(`نرخ خرید، فروش و مارکت ارز ${c.name} را وارد کنید`);
        return;
      }
    }

    setCreating(true);
    try {
      const currenciesData = enabledCurrencies.map((c) => ({
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        buyRate: Number(c.buyRate),
        sellRate: Number(c.sellRate),
        marketRate: Number(c.marketRate),
      }));

      await api.post("/api/tenants", { name, address, phone, currencies: currenciesData });
      setSuccess(true);
      loadTenants();
      setSheetOpen(false);
      resetForm();
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
    setCreating(false);
  };

  const openDeleteDialog = (tenant: Tenant) => {
    setDeletingTenant(tenant);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingTenant) return;
    setDeleting(true);
    try {
      await api.delete(`/api/tenants/${deletingTenant.id}`);
      setDeleteDialogOpen(false);
      setDeletingTenant(null);
      loadTenants();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در حذف");
      setDeleteDialogOpen(false);
    }
    setDeleting(false);
  };

  const handleToggleActive = async (tenant: Tenant) => {
    try {
      await api.put(`/api/tenants/${tenant.id}`, { isActive: !tenant.isActive });
      loadTenants();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در بروزرسانی");
    }
  };

  return (
    <main className="min-h-dvh bg-[#fafafa]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100/80">
        <div className="flex h-14 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[17px] font-bold tracking-tight text-gray-900">مدیریت صرافی‌ها</h1>
            {!loading && filteredTenants.length > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-100 px-1.5 text-[10px] font-bold text-gray-500 tabular-nums">
                {filteredTenants.length}
              </span>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative group">
            <Search className="absolute right-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-gray-300 group-focus-within:text-gray-500 transition-colors" strokeWidth={1.5} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو بر اساس نام، آدرس یا تلفن..."
              className="h-10 w-full rounded-[5px] border border-gray-100 bg-gray-50/80 pr-10 pl-9 text-[13px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-gray-200 focus:bg-white focus:shadow-sm transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200/60 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
                <X className="h-3 w-3" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 pb-3">
          <div className="flex gap-1.5">
            {FILTER_TABS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  "rounded-[5px] px-4 py-1.5 text-[11px] font-semibold transition-all duration-200",
                  filter === value
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
        {loading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-[5px] bg-white border border-gray-200/80 p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-[5px]" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2.5 w-48" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-[5px] bg-gray-50 mb-4">
              {searchQuery ? (
                <Search className="h-7 w-7 text-gray-300" strokeWidth={1.5} />
              ) : (
                <Building2 className="h-7 w-7 text-gray-300" strokeWidth={1.5} />
              )}
            </div>
            <p className="text-sm font-medium text-gray-400">
              {searchQuery ? "نتیجه‌ای یافت نشد" : "هنوز صرافی ایجاد نشده"}
            </p>
            <p className="text-xs text-gray-300 mt-1">
              {searchQuery ? `برای «${searchQuery}» صرافی وجود ندارد` : "برای شروع، دکمه + را بزنید"}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTenants.map((t) => (
              <div
                key={t.id}
                className="rounded-[5px] bg-white border border-gray-200/80 p-4 active:bg-gray-50/50 transition-colors"
              >
                <Link href={`/admin/tenants/${t.id}`} className="block">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-[5px] text-xs font-bold",
                        t.isActive ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400"
                      )}>
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900 leading-tight">{t.name}</p>
                        {t.address && (
                          <p className="text-[11px] text-gray-400 mt-0.5">{t.address}</p>
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      "rounded-[3px] px-2 py-0.5 text-[10px] font-semibold",
                      t.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                    )}>
                      {t.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-2.5">
                    {t.phone && (
                      <div className="flex items-center gap-1 rounded-[3px] bg-gray-50 px-2 py-1">
                        <span className="text-[11px] font-semibold text-gray-700 tabular-nums" dir="ltr">{t.phone}</span>
                      </div>
                    )}
                  </div>

                  {(() => {
                    const badge = getBillingBadge(t);
                    if (!badge) return null;
                    const Icon = badge.icon;
                    return (
                      <div className={cn("flex items-center gap-1.5 rounded-[3px] px-2 py-1 mb-2.5", badge.color)}>
                        <Icon className="h-3 w-3" strokeWidth={1.5} />
                        <div>
                          <span className="text-[10px] font-semibold">{badge.label}</span>
                          <span className="text-[9px] mr-1 opacity-70">{badge.subLabel}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-400">
                        <Users className="inline h-3 w-3 ml-0.5" strokeWidth={1.5} />{t._count.users}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        <ClipboardList className="inline h-3 w-3 ml-0.5" strokeWidth={1.5} />{t._count.orders}
                      </span>
                    </div>
                    <ArrowLeft className="h-4 w-4 text-gray-300" strokeWidth={1.5} />
                  </div>
                </Link>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleActive(t); }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-[3px] px-2.5 py-1.5 text-[10px] font-medium transition-colors",
                      t.isActive ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                    )}
                  >
                    <Power className="h-3 w-3" strokeWidth={1.5} />
                    {t.isActive ? "غیرفعال" : "فعال"}
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDeleteDialog(t); }}
                    className="flex items-center gap-1.5 rounded-[3px] px-2.5 py-1.5 text-[10px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                    حذف صرافی
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { resetForm(); setSheetOpen(true); }}
        className="fixed bottom-24 left-4 z-30 flex h-12 items-center gap-2 rounded-[5px] bg-gray-900 pl-4 pr-3 text-white shadow-lg shadow-gray-900/20 transition-all active:scale-95 hover:bg-gray-800"
      >
        <span className="text-[13px] font-semibold">صرافی جدید</span>
        <Plus className="h-5 w-5" strokeWidth={2} />
      </button>

      {/* Success Toast */}
      {success && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 rounded-[5px] bg-white border border-gray-100 px-4 py-3 shadow-lg shadow-black/5 animate-slide-up">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
          <span className="text-[13px] font-medium text-gray-700">صرافی با موفقیت ایجاد شد</span>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 rounded-[5px] bg-white border border-gray-100 px-4 py-3 shadow-lg shadow-black/5 animate-slide-up max-w-[90vw]">
          <span className="text-[13px] font-medium text-gray-700">{error}</span>
        </div>
      )}

      {/* Create Tenant BottomSheet */}
      <BottomSheet isOpen={sheetOpen} onClose={() => { setSheetOpen(false); resetForm(); }} title={step === 1 ? "صرافی جدید" : "انتخاب ارز و نرخ"} className="max-h-[85vh]">
        <div className="flex items-center justify-end mb-4">
          <div className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full transition-colors", step === 1 ? "bg-gray-900" : "bg-gray-200")} />
            <span className={cn("h-2 w-2 rounded-full transition-colors", step === 2 ? "bg-gray-900" : "bg-gray-200")} />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">نام صرافی <span className="text-red-500">*</span></label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام صرافی" className="h-12 rounded-[5px]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">آدرس</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="اختیاری" className="h-12 rounded-[5px]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">تلفن</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="اختیاری" className="h-12 rounded-[5px]" dir="ltr" />
            </div>
            <Button type="button" onClick={handleNextStep} className="w-full h-12 rounded-[5px]">
              مرحله بعد
            </Button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto">
              {currencies.map((c) => (
                <div
                  key={c.code}
                  className={cn(
                    "rounded-[5px] border p-3 transition-colors",
                    c.enabled ? "border-blue-200 bg-blue-50/50" : "border-gray-100 bg-white"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={c.enabled}
                        onChange={() => toggleCurrency(c.code)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-[12px] font-semibold text-gray-900">{c.name}</span>
                        <span className="text-[10px] text-gray-400 mr-1.5">({c.code})</span>
                      </div>
                    </label>
                    <span className="text-[11px] text-gray-400">{c.symbol}</span>
                  </div>
                  {c.enabled && (
                    <div className="grid grid-cols-3 gap-2 mt-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-gray-500">نرخ خرید</label>
                        <Input
                          type="number"
                          value={c.buyRate}
                          onChange={(e) => updateCurrencyRate(c.code, "buyRate", e.target.value)}
                          placeholder="0"
                          className="h-9 text-[12px] rounded-[5px]"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-gray-500">نرخ فروش</label>
                        <Input
                          type="number"
                          value={c.sellRate}
                          onChange={(e) => updateCurrencyRate(c.code, "sellRate", e.target.value)}
                          placeholder="0"
                          className="h-9 text-[12px] rounded-[5px]"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-gray-500">نرخ مارکت</label>
                        <Input
                          type="number"
                          value={c.marketRate}
                          onChange={(e) => updateCurrencyRate(c.code, "marketRate", e.target.value)}
                          placeholder="0"
                          className="h-9 text-[12px] rounded-[5px]"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex h-12 items-center justify-center gap-1 rounded-[5px] border border-gray-200 px-4 text-[12px] font-medium text-gray-600"
              >
                بازگشت
              </button>
              <Button type="submit" isLoading={creating} className="flex-1 h-12 rounded-[5px]">
                <Coins className="h-4 w-4 ml-1" strokeWidth={2} />
                ایجاد صرافی
              </Button>
            </div>
          </form>
        )}
      </BottomSheet>

      {/* Delete Confirmation BottomSheet */}
      <BottomSheet isOpen={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} title="حذف صرافی">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-500" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">آیا از حذف این صرافی مطمئن هستید؟</p>
              <p className="text-xs text-gray-500 mt-1">
                تمام اطلاعات مرتبط با <span className="font-semibold">{deletingTenant?.name}</span> شامل کاربران، سفارشات، مشتریان، تراکنش‌ها و ارزها حذف خواهد شد.
              </p>
              <p className="text-xs text-red-500 mt-1 font-medium">این عمل قابل بازگشت نیست.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDeleteDialogOpen(false)}
              className="flex-1 h-11 rounded-[5px] border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              انصراف
            </button>
            <Button
              onClick={handleDelete}
              isLoading={deleting}
              className="flex-1 h-11 rounded-[5px] bg-red-600 hover:bg-red-700 text-white"
            >
              حذف صرافی
            </Button>
          </div>
        </div>
      </BottomSheet>
    </main>
  );
}
