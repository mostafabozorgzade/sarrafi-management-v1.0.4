"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Receipt, Wallet, Wifi, Car, User, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { ErrorAlert } from "@/components/ui/error-alert";
import { cn } from "@/lib/utils";

interface Expense {
  id: string;
  category: string;
  amount: bigint;
  description: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string };
}

type Tab = "list" | "add";

const expenseCats = [
  { id: "حقوق", icon: User, color: "text-blue-500", bg: "bg-blue-50" },
  { id: "اجاره", icon: Wallet, color: "text-violet-500", bg: "bg-violet-50" },
  { id: "حمل پول", icon: Car, color: "text-amber-500", bg: "bg-amber-50" },
  { id: "اینترنت", icon: Wifi, color: "text-cyan-500", bg: "bg-cyan-50" },
  { id: "سایر", icon: Receipt, color: "text-gray-500", bg: "bg-gray-50" },
];

const incomeCats = [
  { id: "کارمزد", icon: TrendingUp, color: "text-green-500", bg: "bg-green-50" },
  { id: "خدمات جانبی", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
];

export default function ExpensesPage() {
  const [tab, setTab] = useState<Tab>("list");
  const [cat, setCat] = useState<"expense" | "income">("expense");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadExpenses = () => api.get("/api/expenses").then((data) => { setExpenses(data); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { loadExpenses(); }, []);

  const totalExpenses = expenses.filter((e) => !["کارمزد", "خدمات جانبی"].includes(e.category)).reduce((s, e) => s + Number(e.amount), 0);
  const totalIncome = expenses.filter((e) => ["کارمزد", "خدمات جانبی"].includes(e.category)).reduce((s, e) => s + Number(e.amount), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedCat || !amount) { setError("دسته‌بندی و مبلغ الزامی است"); return; }
    try {
      await api.post("/api/expenses", { category: selectedCat, amount: Number(amount), description });
      setSuccess(true);
      loadExpenses();
      setTimeout(() => { setSuccess(false); setTab("list"); setAmount(""); setDescription(""); setSelectedCat(""); }, 1500);
    } catch (err) { setError(err instanceof Error ? err.message : "خطا"); }
  };

  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white">
        <div className="flex h-12 items-center px-4">
          <h1 className="text-sm font-semibold text-gray-900">هزینه و درآمد</h1>
        </div>
        <div className="flex gap-1 px-4 pb-2">
          <button onClick={() => setTab("list")} className={cn("flex-1 rounded-md py-1.5 text-xs font-medium transition-colors", tab === "list" ? "bg-gray-900 text-white" : "text-gray-400")}>لیست</button>
          <button onClick={() => setTab("add")} className={cn("flex-1 rounded-md py-1.5 text-xs font-medium transition-colors", tab === "add" ? "bg-gray-900 text-white" : "text-gray-400")}>ثبت جدید</button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-red-100 bg-red-50/50 p-3">
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown className="h-3 w-3 text-red-400" strokeWidth={1.5} />
              <span className="text-[10px] text-red-400">هزینه</span>
            </div>
            <p className="text-sm font-bold text-red-600" dir="ltr">{totalExpenses.toLocaleString("en-US")}</p>
          </div>
          <div className="rounded-lg border border-green-100 bg-green-50/50 p-3">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3 text-green-400" strokeWidth={1.5} />
              <span className="text-[10px] text-green-400">درآمد</span>
            </div>
            <p className="text-sm font-bold text-green-600" dir="ltr">{totalIncome.toLocaleString("en-US")}</p>
          </div>
        </div>

        {tab === "list" && (
          loading ? <div className="py-8 text-center text-xs text-gray-300">بارگذاری...</div> : expenses.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-300">رکوردی ثبت نشده</div>
          ) : (
          <div className="space-y-0">
            {expenses.map((ex) => {
              const isIncome = ["کارمزد", "خدمات جانبی"].includes(ex.category);
              const allCats = [...expenseCats, ...incomeCats];
              const c = allCats.find((x) => x.id === ex.category);
              const Icon = c?.icon || Receipt;
              return (
                <div key={ex.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 -mx-4 px-4">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", c?.bg || "bg-gray-50")}>
                    <Icon className={cn("h-3.5 w-3.5", c?.color || "text-gray-500")} strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-900">{ex.category}</span>
                      <span className={cn("text-xs font-semibold", isIncome ? "text-green-600" : "text-red-500")} dir="ltr">{isIncome ? "+" : "-"}{Number(ex.amount).toLocaleString("en-US")}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-gray-300 truncate max-w-[180px]">{ex.description}</span>
                      <span className="text-[10px] text-gray-300">{new Date(ex.createdAt).toLocaleDateString("fa-IR")}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )
        )}

        {tab === "add" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <ErrorAlert message={error} />}
            {success && <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-600"><CheckCircle2 className="h-4 w-4" />ثبت شد</div>}
            <div className="flex gap-1">
              <button type="button" onClick={() => { setCat("expense"); setSelectedCat(""); }} className={cn("flex-1 rounded-md py-2 text-xs font-medium transition-colors", cat === "expense" ? "bg-red-500 text-white" : "text-gray-400 bg-gray-100")}>هزینه</button>
              <button type="button" onClick={() => { setCat("income"); setSelectedCat(""); }} className={cn("flex-1 rounded-md py-2 text-xs font-medium transition-colors", cat === "income" ? "bg-green-500 text-white" : "text-gray-400 bg-gray-100")}>درآمد</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(cat === "expense" ? expenseCats : incomeCats).map((c) => (
                <button type="button" key={c.id} onClick={() => setSelectedCat(c.id)} className={cn("flex flex-col items-center gap-1 rounded-lg border p-2.5 transition-colors", selectedCat === c.id ? "border-blue-500 bg-blue-50" : "border-gray-100")}>
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", c.bg)}><c.icon className={cn("h-3.5 w-3.5", c.color)} strokeWidth={1.5} /></div>
                  <span className="text-[9px] text-gray-400">{c.id}</span>
                </button>
              ))}
            </div>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="مبلغ (تومان)" className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-left placeholder:text-gray-300 focus:outline-none focus:border-blue-500" inputMode="numeric" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="توضیحات" rows={2} className="flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-500" />
            <button type="submit" className="flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-[0.99]">ثبت</button>
          </form>
        )}
      </div>
    </main>
  );
}
