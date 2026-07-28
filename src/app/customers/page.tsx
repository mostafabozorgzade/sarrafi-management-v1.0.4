"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Phone,
  Plus,
  CreditCard,
  ArrowUpLeft,
  ArrowDownRight,
  Clock,
  Package,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";

interface Customer {
  id: string;
  name: string;
  phone: string;
  pakAccount: string | null;
  totalBuy: bigint;
  totalSell: bigint;
  debt: bigint;
}

interface CustomerDetail extends Customer {
  orders: { id: string; orderType: string; status: string; totalToman: bigint; createdAt: string; currency: { code: string } }[];
  transactions: { id: string; type: string; amount: bigint; currency: { code: string }; createdAt: string }[];
}

const typeLabels: Record<string, string> = {
  IR_TO_PK: "ایران→پاکستان", PK_TO_IR: "پاکستان→ایران", BUY_PKR: "خرید روپیه", SELL_PKR: "فروش روپیه",
};
const statusLabels: Record<string, string> = {
  DRAFT: "پیش‌نویس", REGISTERED: "ثبت شده", TOMAN_RECEIVED: "تومان دریافت",
  AWAITING_PKR_TRANSFER: "انتظار روپیه", PKR_TRANSFERRED: "روپیه واریز",
  IN_PROGRESS: "در حال انجام", COMPLETED: "تکمیل", CANCELLED: "لغو",
};
const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600", REGISTERED: "bg-blue-50 text-blue-600",
  TOMAN_RECEIVED: "bg-amber-50 text-amber-600", COMPLETED: "bg-green-50 text-green-600",
  CANCELLED: "bg-red-50 text-red-600",
};

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pakAccount, setPakAccount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get("/api/customers").then((data) => { setCustomers(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) => c.name.includes(search) || c.phone.includes(search));

  const openDetail = async (customer: Customer) => {
    setSelectedCustomer(null);
    setDetailSheetOpen(true);
    setDetailLoading(true);
    try {
      const data = await api.get(`/api/customers/${customer.id}`);
      setSelectedCustomer(data);
    } catch {}
    setDetailLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !phone) { setError("نام و شماره تماس الزامی است"); return; }
    setSubmitting(true);
    try {
      const newCustomer = await api.post("/api/customers", { name, phone, pakAccount });
      setAddSheetOpen(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);
      setCustomers((prev) => [{ ...newCustomer, totalBuy: BigInt(0), totalSell: BigInt(0), debt: BigInt(0) }, ...prev]);
      setName(""); setPhone(""); setPakAccount("");
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
    setSubmitting(false);
  };

  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white">
        <div className="flex h-12 items-center justify-center px-4">
          <h1 className="text-sm font-semibold text-gray-900">مشتریان</h1>
        </div>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300" strokeWidth={1.5} />
            <input type="text" placeholder="جستجو..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pr-8 pl-3 text-xs text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-500" />
          </div>
        </div>
      </div>

      <div className="px-4 py-2 pb-28">
        {loading ? (
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 -mx-4 px-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <div className="flex justify-between"><Skeleton className="h-3 w-24" /><Skeleton className="h-2.5 w-10" /></div>
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-300">مشتری یافت نشد</div>
        ) : (
          filtered.map((c) => (
            <div key={c.id} onClick={() => openDetail(c)} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 -mx-4 px-4 active:bg-gray-50">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600">{c.name.charAt(0)}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-900">{c.name}</span>
                  {Number(c.debt) > 0 && <span className="text-[9px] text-red-500">بدهکار</span>}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Phone className="h-2.5 w-2.5 text-gray-300" strokeWidth={1.5} />
                  <span className="text-[11px] text-gray-400" dir="ltr">{c.phone}</span>
                </div>
              </div>
              <ChevronLeft className="h-4 w-4 text-gray-300" strokeWidth={1.5} />
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setAddSheetOpen(true)}
        className="fixed bottom-24 left-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg transition-all active:scale-95 hover:bg-gray-800"
      >
        <Plus className="h-6 w-6" strokeWidth={2} />
      </button>

      {/* Success Toast */}
      {success && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 shadow-lg animate-slide-up">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium text-green-700">مشتری ثبت شد</span>
        </div>
      )}

      {/* Add Customer BottomSheet */}
      <BottomSheet isOpen={addSheetOpen} onClose={() => setAddSheetOpen(false)} title="افزودن مشتری">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorAlert message={error} />}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">نام</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام کامل" className="h-12 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">شماره موبایل</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09..." className="h-12 rounded-xl" dir="ltr" inputMode="numeric" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">شماره حساب پاکستان</label>
            <Input value={pakAccount} onChange={(e) => setPakAccount(e.target.value)} placeholder="اختیاری" className="h-12 rounded-xl" dir="ltr" />
          </div>
          <Button type="submit" isLoading={submitting} className="w-full h-12 rounded-xl">ثبت مشتری</Button>
        </form>
      </BottomSheet>

      {/* Customer Detail BottomSheet */}
      <BottomSheet isOpen={detailSheetOpen} onClose={() => setDetailSheetOpen(false)} title="جزئیات مشتری" className="max-h-[85vh]">
        {detailLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3"><Skeleton className="h-12 w-12 rounded-xl" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div>
            <div className="grid grid-cols-2 gap-2"><Skeleton className="h-20 rounded-xl" /><Skeleton className="h-20 rounded-xl" /></div>
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : selectedCustomer ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-600">{selectedCustomer.name.charAt(0)}</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{selectedCustomer.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3 text-gray-400" strokeWidth={1.5} />
                  <span className="text-xs text-gray-500" dir="ltr">{selectedCustomer.phone}</span>
                </div>
                {selectedCustomer.pakAccount && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <CreditCard className="h-3 w-3 text-gray-400" strokeWidth={1.5} />
                    <span className="text-[10px] text-gray-400" dir="ltr">{selectedCustomer.pakAccount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-gray-100 p-3 text-center">
                <p className="text-[10px] text-gray-400">بدهی</p>
                <p className={cn("text-sm font-bold", Number(selectedCustomer.debt) > 0 ? "text-red-600" : "text-green-600")} dir="ltr">
                  {Number(selectedCustomer.debt) > 0 ? Number(selectedCustomer.debt).toLocaleString("en-US") : "تسویه"}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3 text-center">
                <p className="text-[10px] text-gray-400">مجموع خرید</p>
                <p className="text-sm font-bold text-blue-600" dir="ltr">{(Number(selectedCustomer.totalBuy) / 1000000).toFixed(1)}M</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3 text-center">
                <p className="text-[10px] text-gray-400">مجموع فروش</p>
                <p className="text-sm font-bold text-emerald-600" dir="ltr">{(Number(selectedCustomer.totalSell) / 1000000).toFixed(1)}M</p>
              </div>
            </div>

            {/* Orders */}
            {selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">سفارشات اخیر</span>
                </div>
                <div className="space-y-2">
                  {selectedCustomer.orders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                      <div>
                        <p className="text-xs font-medium text-gray-900">{typeLabels[o.orderType] || o.orderType}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{o.currency.code}</p>
                      </div>
                      <div className="text-left">
                        <span className={cn("inline-block rounded-md px-1.5 py-0.5 text-[9px] font-medium", statusColors[o.status] || "bg-gray-100 text-gray-600")}>{statusLabels[o.status]}</span>
                        <p className="text-[10px] text-gray-400 mt-0.5" dir="ltr">{Number(o.totalToman).toLocaleString("en-US")} تومان</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transactions */}
            {selectedCustomer.transactions && selectedCustomer.transactions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">تاریخچه معاملات</span>
                </div>
                <div className="space-y-0">
                  {selectedCustomer.transactions.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", t.type === "buy" ? "bg-blue-50" : "bg-emerald-50")}>
                        {t.type === "buy" ? <ArrowDownRight className="h-3.5 w-3.5 text-blue-600" strokeWidth={1.5} /> : <ArrowUpLeft className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.5} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-medium text-gray-900">{t.type === "buy" ? "خرید" : "فروش"} {t.currency.code}</span>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[10px] text-gray-400" dir="ltr">{Number(t.amount).toLocaleString("en-US")}</span>
                          <span className="text-[10px] text-gray-400">{new Date(t.createdAt).toLocaleDateString("fa-IR")}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!selectedCustomer.orders || selectedCustomer.orders.length === 0) && (!selectedCustomer.transactions || selectedCustomer.transactions.length === 0) && (
              <div className="py-6 text-center text-xs text-gray-300">بدون سفارش یا معامله</div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-gray-400">خطا در بارگذاری</div>
        )}
      </BottomSheet>
    </main>
  );
}
