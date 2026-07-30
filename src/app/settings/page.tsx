"use client";

import { useState, useEffect } from "react";
import { UserPlus, CheckCircle2, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface User { id: string; mobile: string; firstName: string; lastName: string; role: string; isActive: boolean; lastLogin: string | null; }
interface Rate { id: string; currencyId: string; marketRate: bigint; buyRate: bigint; sellRate: bigint; currency: { code: string; name: string }; changedBy: { firstName: string; lastName: string } | null; }

const roleLabels: Record<string, string> = { SUPER_ADMIN: "سوپرادمین", OWNER: "مالک", MANAGER: "مدیر", CASHIER: "صندوق‌دار", ACCOUNTANT: "حسابدار" };
const roleColors: Record<string, string> = { SUPER_ADMIN: "bg-amber-50 text-amber-600", OWNER: "bg-red-50 text-red-600", MANAGER: "bg-blue-50 text-blue-600", CASHIER: "bg-green-50 text-green-600", ACCOUNTANT: "bg-violet-50 text-violet-600" };

export default function SettingsPage() {
  const [tab, setTab] = useState<"list" | "add" | "rates">("list");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobile, setMobile] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CASHIER");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [rates, setRates] = useState<Rate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [editingRate, setEditingRate] = useState<Rate | null>(null);
  const [marketRate, setMarketRate] = useState("");
  const [buyRate, setBuyRate] = useState("");
  const [sellRate, setSellRate] = useState("");
  const [rateSaving, setRateSaving] = useState(false);
  const [rateSuccess, setRateSuccess] = useState(false);

  const onlyDigits = (v: string) => v.replace(/[^0-9]/g, "");
  const formatNum = (v: string) => { const d = onlyDigits(v); if (!d) return ""; return Number(d).toLocaleString("en-US"); };

  const loadUsers = () => api.get("/api/users").then((data) => { setUsers(data); setLoading(false); }).catch(() => setLoading(false));
  const loadRates = () => api.get("/api/rates").then((data) => { setRates(data); setRatesLoading(false); }).catch(() => setRatesLoading(false));
  useEffect(() => { loadUsers(); loadRates(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!mobile || !firstName || !lastName || !password) { setError("فیلدهای الزامی را پر کنید"); return; }
    try {
      await api.post("/api/users", { mobile, firstName, lastName, password, role });
      setSuccess(true);
      loadUsers();
      setTimeout(() => { setSuccess(false); setTab("list"); setMobile(""); setFirstName(""); setLastName(""); setPassword(""); }, 1500);
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
  };

  const openEditRate = (rate: Rate) => {
    setEditingRate(rate);
    setMarketRate(Number(rate.marketRate).toLocaleString("en-US"));
    setBuyRate(Number(rate.buyRate).toLocaleString("en-US"));
    setSellRate(Number(rate.sellRate).toLocaleString("en-US"));
    setRateSuccess(false);
    setError(null);
  };

  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRate) return;
    setError(null);
    setRateSaving(true);
    try {
      await api.post("/api/rates", {
        currencyId: editingRate.currencyId,
        marketRate: onlyDigits(marketRate),
        buyRate: onlyDigits(buyRate),
        sellRate: onlyDigits(sellRate),
      });
      setRateSuccess(true);
      loadRates();
      setTimeout(() => { setRateSuccess(false); setEditingRate(null); }, 1500);
    } catch (err) { setError(err instanceof Error ? err.message : "خطا در بروزرسانی نرخ"); }
    setRateSaving(false);
  };

  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white">
        <div className="flex h-12 items-center px-4"><h1 className="text-sm font-semibold text-gray-900">تنظیمات</h1></div>
        <div className="flex gap-1 px-4 pb-2">
          <button onClick={() => setTab("list")} className={cn("flex-1 rounded-md py-1.5 text-xs font-medium transition-colors", tab === "list" ? "bg-gray-900 text-white" : "text-gray-400")}>کارکنان</button>
          <button onClick={() => setTab("add")} className={cn("flex-1 rounded-md py-1.5 text-xs font-medium transition-colors", tab === "add" ? "bg-gray-900 text-white" : "text-gray-400")}>افزودن</button>
          <button onClick={() => setTab("rates")} className={cn("flex-1 rounded-md py-1.5 text-xs font-medium transition-colors", tab === "rates" ? "bg-gray-900 text-white" : "text-gray-400")}>نرخ ارز</button>
        </div>
      </div>
      <div className="p-4">
        {tab === "list" && (loading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 -mx-4 px-4"><Skeleton className="h-9 w-9 rounded-lg" /><div className="flex-1 space-y-1.5"><div className="flex justify-between"><Skeleton className="h-3 w-24" /><Skeleton className="h-4 w-14 rounded-md" /></div><div className="flex justify-between"><Skeleton className="h-2.5 w-20" /><Skeleton className="h-2 w-16" /></div></div></div>))}</div> : users.map((u) => (
          <div key={u.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 -mx-4 px-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600">{u.firstName.charAt(0)}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-900">{u.firstName} {u.lastName}</span><span className={cn("rounded-md px-1.5 py-0.5 text-[9px] font-medium", roleColors[u.role])}>{roleLabels[u.role]}</span></div>
              <div className="flex items-center justify-between mt-0.5"><span className="text-[11px] text-gray-400" dir="ltr">{u.mobile}</span>{u.lastLogin && <span className="text-[9px] text-gray-300">{new Date(u.lastLogin).toLocaleDateString("fa-IR")}</span>}</div>
            </div>
          </div>
        )))}

        {tab === "add" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorAlert message={error} />}
            {success && <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-600"><CheckCircle2 className="h-4 w-4" />کارمند اضافه شد</div>}
            <div className="space-y-1"><label className="text-xs font-medium text-gray-500">شماره موبایل</label><Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="09..." className="h-12" dir="ltr" inputMode="numeric" /></div>
            <div className="space-y-1"><label className="text-xs font-medium text-gray-500">نام</label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="نام" className="h-12" /></div>
            <div className="space-y-1"><label className="text-xs font-medium text-gray-500">نام خانوادگی</label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="نام خانوادگی" className="h-12" /></div>
            <div className="space-y-1"><label className="text-xs font-medium text-gray-500">رمز عبور</label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="حداقل ۶ کاراکتر" className="h-12" /></div>
            <div className="space-y-1"><label className="text-xs font-medium text-gray-500">نقش</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="flex h-12 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-blue-500">
                <option value="CASHIER">صندوق‌دار</option><option value="MANAGER">مدیر</option><option value="ACCOUNTANT">حسابدار</option><option value="OWNER">مالک</option>
              </select></div>
            <Button type="submit" isLoading={false} className="w-full h-12"><UserPlus className="h-4 w-4" strokeWidth={1.5} />افزودن کارمند</Button>
          </form>
        )}

        {tab === "rates" && (
          <div className="space-y-4">
            {error && <ErrorAlert message={error} />}
            {rateSuccess && <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-600"><CheckCircle2 className="h-4 w-4" />نرخ بروزرسانی شد</div>}

            {ratesLoading ? (
              <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => (<div key={i} className="rounded-xl border border-gray-100 p-3 space-y-2"><Skeleton className="h-3 w-20" /><div className="grid grid-cols-3 gap-2"><Skeleton className="h-10 rounded-lg" /><Skeleton className="h-10 rounded-lg" /><Skeleton className="h-10 rounded-lg" /></div></div>))}</div>
            ) : (
              <div className="space-y-3">
                {rates.map((r) => (
                  <div key={r.id} className="rounded-xl border border-gray-100 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
                        <span className="text-xs font-medium text-gray-900">{r.currency.name} ({r.currency.code})</span>
                      </div>
                      {editingRate?.id === r.id ? (
                        <button onClick={() => setEditingRate(null)} className="text-[10px] text-gray-400">لغو</button>
                      ) : (
                        <button onClick={() => openEditRate(r)} className="text-[10px] text-blue-500 font-medium">ویرایش</button>
                      )}
                    </div>

                    {editingRate?.id === r.id ? (
                      <form onSubmit={handleRateSubmit} className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <span className="text-[8px] text-gray-400">بازار</span>
                            <Input type="text" inputMode="numeric" value={marketRate} onChange={(e) => setMarketRate(formatNum(e.target.value))} placeholder="0" className="h-10 text-left text-xs rounded-lg" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] text-blue-500">خرید</span>
                            <Input type="text" inputMode="numeric" value={buyRate} onChange={(e) => setBuyRate(formatNum(e.target.value))} placeholder="0" className="h-10 text-left text-xs rounded-lg" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] text-emerald-500">فروش</span>
                            <Input type="text" inputMode="numeric" value={sellRate} onChange={(e) => setSellRate(formatNum(e.target.value))} placeholder="0" className="h-10 text-left text-xs rounded-lg" />
                          </div>
                        </div>
                        <Button type="submit" isLoading={rateSaving} className="w-full h-9 rounded-lg text-xs">ذخیره نرخ</Button>
                      </form>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg bg-gray-50 p-2 text-center">
                          <span className="text-[8px] text-gray-400">بازار</span>
                          <p className="text-[11px] font-bold text-gray-700" dir="ltr">{Number(r.marketRate).toLocaleString("en-US")}</p>
                        </div>
                        <div className="rounded-lg bg-blue-50 p-2 text-center">
                          <span className="text-[8px] text-blue-500">خرید</span>
                          <p className="text-[11px] font-bold text-blue-700" dir="ltr">{Number(r.buyRate).toLocaleString("en-US")}</p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 p-2 text-center">
                          <span className="text-[8px] text-emerald-500">فروش</span>
                          <p className="text-[11px] font-bold text-emerald-700" dir="ltr">{Number(r.sellRate).toLocaleString("en-US")}</p>
                        </div>
                      </div>
                    )}

                    {r.changedBy && (
                      <p className="text-[9px] text-gray-300">آخرین تغییر: {r.changedBy.firstName} {r.changedBy.lastName}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
