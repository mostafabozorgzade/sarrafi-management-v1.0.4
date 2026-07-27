"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Phone, UserPlus } from "lucide-react";
import { api } from "@/lib/api";

interface Customer {
  id: string; name: string; phone: string; pakAccount: string | null;
  totalBuy: bigint; totalSell: bigint; debt: bigint;
  totalTransactions?: number;
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/customers").then((data) => { setCustomers(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) => c.name.includes(search) || c.phone.includes(search));

  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white">
        <div className="flex h-12 items-center justify-between px-4">
          <h1 className="text-sm font-semibold text-gray-900">مشتریان</h1>
          <Link href="/customers/new" className="flex h-7 items-center gap-1 rounded-md bg-blue-600 px-2.5 text-[10px] font-medium text-white"><UserPlus className="h-3 w-3" strokeWidth={1.5} />جدید</Link>
        </div>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300" strokeWidth={1.5} />
            <input type="text" placeholder="جستجو..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pr-8 pl-3 text-xs text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-500" />
          </div>
        </div>
      </div>

      <div className="px-4 py-2">
        {loading ? <div className="py-8 text-center text-xs text-gray-300">بارگذاری...</div> : filtered.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-300">مشتری یافت نشد</div>
        ) : filtered.map((c) => (
          <Link key={c.id} href={`/customers/${c.id}`} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 active:bg-gray-50 -mx-4 px-4">
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
          </Link>
        ))}
      </div>
    </main>
  );
}
