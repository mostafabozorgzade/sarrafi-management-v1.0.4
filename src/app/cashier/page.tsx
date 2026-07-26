"use client";

import { useState } from "react";
import { Wallet, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { cashRegisters } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function CashierPage() {
  const [active, setActive] = useState(cashRegisters[0].id);
  const register = cashRegisters.find((r) => r.id === active);

  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 flex h-12 items-center border-b border-gray-100 bg-white px-4">
        <h1 className="text-sm font-semibold text-gray-900">صندوق</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          {cashRegisters.map((r) => (
            <button key={r.id} onClick={() => setActive(r.id)} className={cn("flex-1 rounded-xl border p-3 text-center transition-colors", active === r.id ? "border-blue-200 bg-blue-50" : "border-gray-100 bg-white")}>
              <Wallet className={cn("mx-auto h-5 w-5 mb-1.5", r.type === "toman" ? "text-blue-500" : "text-emerald-500")} strokeWidth={1.5} />
              <p className="text-[10px] text-gray-400">{r.name}</p>
              <p className={cn("text-base font-bold mt-0.5", r.type === "toman" ? "text-blue-700" : "text-emerald-700")} dir="ltr">{r.balance.toLocaleString("en-US")}</p>
            </button>
          ))}
        </div>

        {register && (
          <div>
            <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider mb-2 px-1">تراکنش‌ها</p>
            <div className="space-y-0">
              {register.entries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 -mx-4 px-4">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", entry.type === "in" ? "bg-green-50" : "bg-red-50")}>
                    {entry.type === "in" ? <ArrowDownToLine className="h-3.5 w-3.5 text-green-500" strokeWidth={1.5} /> : <ArrowUpFromLine className="h-3.5 w-3.5 text-red-500" strokeWidth={1.5} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-900 truncate">{entry.description}</p>
                    <p className="text-[10px] text-gray-300">{entry.date}</p>
                  </div>
                  <span className={cn("text-xs font-semibold", entry.type === "in" ? "text-green-600" : "text-red-500")} dir="ltr">
                    {entry.type === "in" ? "+" : "-"}{entry.amount.toLocaleString("en-US")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
