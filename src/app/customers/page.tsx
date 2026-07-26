"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Phone } from "lucide-react";
import { customers } from "@/lib/mock-data";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const filtered = customers.filter((c) => c.name.includes(search) || c.phone.includes(search));

  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-white">
        <div className="flex h-12 items-center justify-between px-4">
          <h1 className="text-sm font-semibold text-gray-900">مشتریان</h1>
          <span className="text-[10px] text-gray-300">{filtered.length}</span>
        </div>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300" strokeWidth={1.5} />
            <input type="text" placeholder="جستجو..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pr-8 pl-3 text-xs text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-500" />
          </div>
        </div>
      </div>

      <div className="px-4 py-2">
        {filtered.map((c) => (
          <Link key={c.id} href={`/customers/${c.id}`} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 active:bg-gray-50 -mx-4 px-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600">
              {c.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-900">{c.name}</span>
                {c.debt > 0 && <span className="text-[9px] text-red-500 font-medium">بدهکار</span>}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <Phone className="h-2.5 w-2.5 text-gray-300" strokeWidth={1.5} />
                <span className="text-[11px] text-gray-400" dir="ltr">{c.phone}</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-300">{c.totalTransactions} معامله</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
