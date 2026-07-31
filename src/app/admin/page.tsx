"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Users, ClipboardList, ArrowLeft, Plus, CheckCircle2, Trash2, Settings } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
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
  _count: { users: number; orders: number; customers: number; transactions: number };
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [creating, setCreating] = useState(false);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name) { setError("نام صرافی الزامی است"); return; }
    setCreating(true);
    try {
      await api.post("/api/tenants", { name, address, phone });
      setSuccess(true);
      loadTenants();
      setTimeout(() => { setSuccess(false); setShowCreate(false); setName(""); setAddress(""); setPhone(""); }, 1500);
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
    setCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این صرافی اطمینان دارید؟ تمام اطلاعات مرتبط حذف خواهد شد.")) return;
    try {
      await api.delete(`/api/tenants/${id}`);
      loadTenants();
    } catch (err) { setError(err instanceof Error ? err.message : "خطا در حذف"); }
  };

  const totalStats = tenants.reduce(
    (acc, t) => ({
      users: acc.users + t._count.users,
      orders: acc.orders + t._count.orders,
      customers: acc.customers + t._count.customers,
    }),
    { users: 0, orders: 0, customers: 0 }
  );

  return (
    <main className="min-h-dvh bg-[#fafafa]">
      <div className="bg-white border-b border-gray-100/80">
        <div className="flex h-14 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <Link href="/dashboard" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            </Link>
            <h1 className="text-[17px] font-bold tracking-tight text-gray-900">مدیریت صرافی‌ها</h1>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-gray-900 px-3 text-[11px] font-medium text-white"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            صرافی جدید
          </button>
        </div>
      </div>

      <div className="p-4 pb-24 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-[5px] bg-white border border-gray-200/80 p-3 text-center">
            <p className="text-[10px] text-gray-400 mb-1">صرافی‌ها</p>
            <p className="text-[18px] font-bold text-gray-900">{loading ? "-" : tenants.length}</p>
          </div>
          <div className="rounded-[5px] bg-white border border-gray-200/80 p-3 text-center">
            <p className="text-[10px] text-gray-400 mb-1">کاربران</p>
            <p className="text-[18px] font-bold text-blue-600">{loading ? "-" : totalStats.users}</p>
          </div>
          <div className="rounded-[5px] bg-white border border-gray-200/80 p-3 text-center">
            <p className="text-[10px] text-gray-400 mb-1">سفارشات</p>
            <p className="text-[18px] font-bold text-emerald-600">{loading ? "-" : totalStats.orders.toLocaleString("en-US")}</p>
          </div>
        </div>

        {error && <ErrorAlert message={error} />}
        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-600">
            <CheckCircle2 className="h-4 w-4" />صرافی با موفقیت ایجاد شد
          </div>
        )}

        {/* Create Form */}
        {showCreate && (
          <div className="rounded-[5px] bg-white border border-gray-200/80 p-4">
            <h3 className="text-[13px] font-semibold text-gray-900 mb-3">صرافی جدید</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-gray-500">نام صرافی</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام صرافی" className="h-11" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-gray-500">آدرس</label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="اختیاری" className="h-11" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-gray-500">تلفن</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="اختیاری" className="h-11" dir="ltr" />
              </div>
              <Button type="submit" isLoading={creating} className="w-full h-11">
                ایجاد صرافی
              </Button>
            </form>
          </div>
        )}

        {/* Tenants List */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
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
        ) : tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-[5px] bg-white border border-gray-200/80">
            <div className="flex h-12 w-12 items-center justify-center rounded-[5px] bg-gray-50 mb-3">
              <Building2 className="h-5 w-5 text-gray-300" strokeWidth={1.5} />
            </div>
            <p className="text-[13px] font-medium text-gray-400">هنوز صرافی ایجاد نشده</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tenants.map((t) => (
              <Link
                key={t.id}
                href={`/admin/tenants/${t.id}`}
                className="block rounded-[5px] bg-white border border-gray-200/80 p-4 active:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-[5px] text-xs font-bold",
                    t.isActive ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400"
                  )}>
                    {t.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-gray-900">{t.name}</span>
                      <span className={cn(
                        "rounded-[3px] px-1.5 py-0.5 text-[9px] font-medium",
                        t.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                      )}>
                        {t.isActive ? "فعال" : "غیرفعال"}
                      </span>
                    </div>
                    {t.address && (
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">{t.address}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-gray-400">
                        <Users className="inline h-3 w-3 ml-0.5" strokeWidth={1.5} />{t._count.users}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        <ClipboardList className="inline h-3 w-3 ml-0.5" strokeWidth={1.5} />{t._count.orders}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        مشتری: {t._count.customers}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
