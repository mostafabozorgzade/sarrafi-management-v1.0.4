"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  X,
  Loader2,
  MapPin,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/order-types";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { useAuth } from "@/lib/auth-context";

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  pakAccount: string | null;
  totalBuy: bigint;
  totalSell: bigint;
  debt: bigint;
  tenant?: { id: string; name: string };
}

interface CustomerDetail extends Customer {
  orders: { id: string; orderType: string; status: string; totalToman: bigint; createdAt: string; currency: { code: string } }[];
  transactions: { id: string; type: string; amount: bigint; currency: { code: string }; createdAt: string }[];
}

const typeLabels: Record<string, string> = {
  IR_TO_PK: "ایران→پاکستان", PK_TO_IR: "پاکستان→ایران", BUY_PKR: "خرید روپیه", SELL_PKR: "فروش روپیه",
};

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const PAGE_SIZE = 15;

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || !hasMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    const params = new URLSearchParams();
    if (searchRef.current.trim()) params.set("search", searchRef.current.trim());
    params.set("page", String(nextPage));
    params.set("limit", String(PAGE_SIZE));
    api.get(`/api/customers?${params.toString()}`).then((data) => {
      setCustomers((prev) => [...prev, ...data.customers]);
      pageRef.current = nextPage;
      const more = data.customers.length >= PAGE_SIZE;
      hasMoreRef.current = more;
      setHasMore(more);
    }).catch(() => {}).finally(() => {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    });
  }, []);

  useEffect(() => {
    const scrollContainer = document.querySelector("[data-scroll-container]");
    if (!scrollContainer) return;

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      if (scrollHeight - scrollTop - clientHeight < 200) {
        loadMore();
      }
    };

    scrollContainer.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", onScroll);
  }, [loadMore]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", String(PAGE_SIZE));
    api.get(`/api/customers?${params.toString()}`).then((data) => {
      setCustomers(data.customers);
      const more = data.customers.length < data.total;
      hasMoreRef.current = more;
      setHasMore(more);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onPopState = () => {
      if (deleteDialogOpen) { setDeleteDialogOpen(false); return; }
      if (editSheetOpen) { setEditSheetOpen(false); return; }
      if (addSheetOpen) { setAddSheetOpen(false); return; }
      if (detailSheetOpen) { setDetailSheetOpen(false); return; }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [addSheetOpen, editSheetOpen, detailSheetOpen, deleteDialogOpen]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      searchRef.current = value;
      pageRef.current = 1;
      hasMoreRef.current = true;
      loadingMoreRef.current = false;
      setHasMore(true);
      setLoadingMore(false);
      setLoading(true);
      const params = new URLSearchParams();
      if (value.trim()) params.set("search", value.trim());
      params.set("page", "1");
      params.set("limit", String(PAGE_SIZE));
      api.get(`/api/customers?${params.toString()}`).then((data) => {
        setCustomers(data.customers);
        const more = data.customers.length < data.total;
        hasMoreRef.current = more;
        setHasMore(more);
        setLoading(false);
      }).catch(() => setLoading(false));
    }, 350);
  };

  const clearSearch = () => {
    setSearchQuery("");
    searchRef.current = "";
    pageRef.current = 1;
    hasMoreRef.current = true;
    loadingMoreRef.current = false;
    setHasMore(true);
    setLoadingMore(false);
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", String(PAGE_SIZE));
    api.get(`/api/customers?${params.toString()}`).then((data) => {
      setCustomers(data.customers);
      const more = data.customers.length < data.total;
      hasMoreRef.current = more;
      setHasMore(more);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const openDetail = async (customer: Customer) => {
    setSelectedCustomer(null);
    setDetailSheetOpen(true);
    window.history.pushState({}, "");
    setDetailLoading(true);
    try {
      const data = await api.get(`/api/customers/${customer.id}`);
      setSelectedCustomer(data);
    } catch {}
    setDetailLoading(false);
  };

  const openEditSheet = (customer: CustomerDetail | Customer) => {
    setDetailSheetOpen(false);
    setFullName(customer.name);
    setPhone(customer.phone);
    setAddress(customer.address || "");
    setError(null);
    setEditSheetOpen(true);
    window.history.pushState({}, "");
  };

  const openDeleteDialog = () => {
    setDetailSheetOpen(false);
    setDeleteDialogOpen(true);
    window.history.pushState({}, "");
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) { setError("نام و نام خانوادگی الزامی است"); return; }
    if (!phone.trim()) { setError("شماره موبایل الزامی است"); return; }
    if (!/^[0-9]+$/.test(phone.trim())) { setError("فقط اعداد انگلیسی مجاز است"); return; }
    setSubmitting(true);
    try {
      const newCustomer = await api.post("/api/customers", { name: fullName.trim(), phone: phone.trim(), address: address.trim() || null });
      setAddSheetOpen(false);
      showSuccess("مشتری با موفقیت اضافه شد");
      setCustomers((prev) => [{ ...newCustomer, totalBuy: BigInt(0), totalSell: BigInt(0), debt: BigInt(0) }, ...prev]);
      setFullName(""); setPhone(""); setAddress("");
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
    setSubmitting(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) { setError("نام و نام خانوادگی الزامی است"); return; }
    if (!phone.trim()) { setError("شماره موبایل الزامی است"); return; }
    if (!/^[0-9]+$/.test(phone.trim())) { setError("فقط اعداد انگلیسی مجاز است"); return; }
    if (!selectedCustomer) return;
    setSubmitting(true);
    try {
      const updated = await api.patch(`/api/customers/${selectedCustomer.id}`, { name: fullName.trim(), phone: phone.trim(), address: address.trim() || null });
      setEditSheetOpen(false);
      showSuccess("مشتری با موفقیت ویرایش شد");
      setCustomers((prev) => prev.map((c) => c.id === updated.id ? { ...c, name: updated.name, phone: updated.phone, address: updated.address } : c));
      setSelectedCustomer((prev) => prev ? { ...prev, name: updated.name, phone: updated.phone, address: updated.address } : null);
      setFullName(""); setPhone(""); setAddress("");
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    setDeleting(true);
    try {
      await api.delete(`/api/customers/${selectedCustomer.id}`);
      setDeleteDialogOpen(false);
      setDetailSheetOpen(false);
      showSuccess("مشتری با موفقیت حذف شد");
      setCustomers((prev) => prev.filter((c) => c.id !== selectedCustomer.id));
      setSelectedCustomer(null);
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
    setDeleting(false);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const resetForm = () => {
    setFullName(""); setPhone(""); setAddress(""); setError(null);
  };

  return (
    <main className="min-h-dvh bg-[#fafafa]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100/80">
        {/* Title */}
        <div className="flex h-14 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[17px] font-bold tracking-tight text-gray-900">مشتریان</h1>
            {!loading && customers.length > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-100 px-1.5 text-[10px] font-bold text-gray-500 tabular-nums">
                {customers.length}
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
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="جستجو بر اساس نام یا شماره..."
              className="h-10 w-full rounded-[5px] border border-gray-100 bg-gray-50/80 pr-10 pl-9 text-[13px] text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-gray-200 focus:bg-white focus:shadow-sm transition-all"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="absolute left-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200/60 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
                <X className="h-3 w-3" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-28">
        {loading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-[5px] bg-white border border-gray-200/80 p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-[5px]" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-4 rounded-[3px]" />
                </div>
              </div>
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-[5px] bg-gray-50 mb-4">
              {searchQuery ? (
                <Search className="h-7 w-7 text-gray-300" strokeWidth={1.5} />
              ) : (
                <Phone className="h-7 w-7 text-gray-300" strokeWidth={1.5} />
              )}
            </div>
            <p className="text-sm font-medium text-gray-400">
              {searchQuery ? "نتیجه‌ای یافت نشد" : "مشتری ثبت نشده"}
            </p>
            <p className="text-xs text-gray-300 mt-1">
              {searchQuery ? `برای «${searchQuery}» مشتری وجود ندارد` : "برای شروع، دکمه + را بزنید"}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {customers.map((c) => {
              const initials = c.name.split(" ").map((w) => w.charAt(0)).join("").slice(0, 2);
              return (
                <div
                  key={c.id}
                  onClick={() => openDetail(c)}
                  className="rounded-[5px] bg-white border border-gray-200/80 p-4 active:bg-gray-50/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-gray-50 text-[13px] font-bold text-gray-500">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">{c.name}</p>
                        {Number(c.debt) > 0 && (
                          <span className="rounded-[3px] bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold text-red-500 mr-2">بدهکار</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-300" strokeWidth={1.5} />
                          <span className="text-[11px] text-gray-400 tabular-nums" dir="ltr">{c.phone}</span>
                        </div>
                        {user?.role === "SUPER_ADMIN" && c.tenant && (
                          <div className="flex items-center gap-1 rounded-[3px] bg-blue-50 px-1.5 py-0.5">
                            <span className="text-[9px] font-semibold text-blue-600">{c.tenant.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-gray-300 flex-shrink-0" strokeWidth={1.5} />
                  </div>
                </div>
              );
            })}
            {hasMore && <div className="h-1" />}
            {loadingMore && (
              <div className="space-y-2.5">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={`shimmer-${i}`} className="rounded-[5px] bg-white border border-gray-200/80 p-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-[5px]" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-2.5 w-20" />
                      </div>
                      <Skeleton className="h-4 w-4 rounded-[3px]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { resetForm(); setAddSheetOpen(true); window.history.pushState({}, ""); }}
        className="fixed bottom-24 left-4 z-30 flex h-12 items-center gap-2 rounded-[5px] bg-gray-900 pl-4 pr-3 text-white shadow-lg shadow-gray-900/20 transition-all active:scale-95 hover:bg-gray-800"
      >
        <span className="text-[13px] font-semibold">افزودن مشتری</span>
        <Plus className="h-5 w-5" strokeWidth={2} />
      </button>

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-[5px] bg-white border border-gray-100 px-4 py-3 shadow-lg shadow-black/5 animate-slide-up">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
          <span className="text-[13px] font-medium text-gray-700">{successMessage}</span>
        </div>
      )}

      {/* Add Customer BottomSheet */}
      <BottomSheet isOpen={addSheetOpen} onClose={() => setAddSheetOpen(false)} title="افزودن مشتری">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {error && <ErrorAlert message={error} />}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">نام و نام خانوادگی <span className="text-red-400">*</span></label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: علی رضایی"
              className="h-12 rounded-[5px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">شماره موبایل <span className="text-red-400">*</span></label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="09123456789"
              className="h-12 rounded-[5px] text-left"
              dir="ltr"
              inputMode="numeric"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">آدرس</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="اختیاری"
              rows={2}
              className="flex w-full rounded-[5px] border border-gray-200 bg-white px-3 py-2.5 text-sm placeholder:text-gray-300 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/10 transition-colors"
            />
          </div>

          <Button type="submit" isLoading={submitting} className="w-full h-12 rounded-[5px] bg-gray-900 hover:bg-gray-800">ثبت مشتری</Button>
        </form>
      </BottomSheet>

      {/* Edit Customer BottomSheet */}
      <BottomSheet isOpen={editSheetOpen} onClose={() => setEditSheetOpen(false)} title="ویرایش مشتری">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {error && <ErrorAlert message={error} />}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">نام و نام خانوادگی <span className="text-red-400">*</span></label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: علی رضایی"
              className="h-12 rounded-[5px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">شماره موبایل <span className="text-red-400">*</span></label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="09123456789"
              className="h-12 rounded-[5px] text-left"
              dir="ltr"
              inputMode="numeric"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500">آدرس</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="اختیاری"
              rows={2}
              className="flex w-full rounded-[5px] border border-gray-200 bg-white px-3 py-2.5 text-sm placeholder:text-gray-300 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900/10 transition-colors"
            />
          </div>

          <Button type="submit" isLoading={submitting} className="w-full h-12 rounded-[5px] bg-gray-900 hover:bg-gray-800">ذخیره تغییرات</Button>
        </form>
      </BottomSheet>

      {/* Delete Confirmation Dialog */}
      <BottomSheet isOpen={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} title="حذف مشتری">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-500" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">آیا از حذف این مشتری مطمئن هستید؟</p>
              <p className="text-xs text-gray-500 mt-1">این عمل قابل بازگشت نیست و تمام اطلاعات مشتری حذف خواهد شد.</p>
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
              حذف مشتری
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Customer Detail BottomSheet */}
      <BottomSheet isOpen={detailSheetOpen} onClose={() => setDetailSheetOpen(false)} title="جزئیات مشتری" className="max-h-[85vh]">
        {detailLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3"><Skeleton className="h-12 w-12 rounded-[5px]" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></div>
            <div className="grid grid-cols-3 gap-2"><Skeleton className="h-20 rounded-[5px]" /><Skeleton className="h-20 rounded-[5px]" /><Skeleton className="h-20 rounded-[5px]" /></div>
            <Skeleton className="h-32 rounded-[5px]" />
          </div>
        ) : selectedCustomer ? (
          <div className="space-y-4">
            {/* Header with Actions */}
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[5px] bg-gray-50 text-[15px] font-bold text-gray-500">
                {selectedCustomer.name.split(" ").map((w) => w.charAt(0)).join("").slice(0, 2)}
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-gray-900">{selectedCustomer.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Phone className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
                  <span className="text-[12px] text-gray-500 tabular-nums" dir="ltr">{selectedCustomer.phone}</span>
                </div>
                {selectedCustomer.address && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
                    <span className="text-[12px] text-gray-500">{selectedCustomer.address}</span>
                  </div>
                )}
                {selectedCustomer.pakAccount && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <CreditCard className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
                    <span className="text-[11px] text-gray-400 tabular-nums" dir="ltr">{selectedCustomer.pakAccount}</span>
                  </div>
                )}
              </div>
              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEditSheet(selectedCustomer)}
                  className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <Pencil className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button
                  onClick={openDeleteDialog}
                  className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-[5px] border border-gray-200/80 p-3 text-center">
                <p className="text-[10px] text-gray-400">بدهی</p>
                <p className={cn("text-[13px] font-bold tabular-nums", Number(selectedCustomer.debt) > 0 ? "text-red-600" : "text-emerald-600")} dir="ltr">
                  {Number(selectedCustomer.debt) > 0 ? Number(selectedCustomer.debt).toLocaleString("en-US") : "تسویه"}
                </p>
              </div>
              <div className="rounded-[5px] border border-gray-200/80 p-3 text-center">
                <p className="text-[10px] text-gray-400">مجموع خرید</p>
                <p className="text-[13px] font-bold text-gray-900 tabular-nums" dir="ltr">{(Number(selectedCustomer.totalBuy) / 1000000).toFixed(1)}M</p>
              </div>
              <div className="rounded-[5px] border border-gray-200/80 p-3 text-center">
                <p className="text-[10px] text-gray-400">مجموع فروش</p>
                <p className="text-[13px] font-bold text-gray-900 tabular-nums" dir="ltr">{(Number(selectedCustomer.totalSell) / 1000000).toFixed(1)}M</p>
              </div>
            </div>

            {/* Orders */}
            {selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Package className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">سفارشات اخیر</span>
                </div>
                <div className="space-y-2">
                  {selectedCustomer.orders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between rounded-[5px] bg-gray-50 p-3">
                      <div>
                        <p className="text-[12px] font-medium text-gray-900">{typeLabels[o.orderType] || o.orderType}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{o.currency.code}</p>
                      </div>
                      <div className="text-left">
                        <span className={cn("inline-block rounded-[3px] px-1.5 py-0.5 text-[9px] font-semibold", STATUS_COLORS[o.status] || "bg-gray-100 text-gray-600")}>{STATUS_LABELS[o.status]}</span>
                        <p className="text-[10px] text-gray-400 mt-0.5 tabular-nums" dir="ltr">{Number(o.totalToman).toLocaleString("en-US")} تومان</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transactions */}
            {selectedCustomer.transactions && selectedCustomer.transactions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Clock className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">تاریخچه معاملات</span>
                </div>
                <div className="space-y-0">
                  {selectedCustomer.transactions.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-[5px]", t.type === "buy" ? "bg-blue-50" : "bg-emerald-50")}>
                        {t.type === "buy" ? <ArrowDownRight className="h-3.5 w-3.5 text-blue-600" strokeWidth={1.5} /> : <ArrowUpLeft className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.5} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[12px] font-medium text-gray-900">{t.type === "buy" ? "خرید" : "فروش"} {t.currency.code}</span>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[10px] text-gray-400 tabular-nums" dir="ltr">{Number(t.amount).toLocaleString("en-US")}</span>
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
              <div className="py-6 text-center text-[12px] text-gray-300">بدون سفارش یا معامله</div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center text-[12px] text-gray-400">خطا در بارگذاری</div>
        )}
      </BottomSheet>
    </main>
  );
}
