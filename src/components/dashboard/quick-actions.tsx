"use client";

import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  UserPlus,
  Wallet,
} from "lucide-react";

const actions = [
  { label: "ثبت خرید", icon: ArrowDownToLine, bg: "bg-blue-600", href: "/transactions/buy" },
  { label: "ثبت فروش", icon: ArrowUpFromLine, bg: "bg-emerald-600", href: "/transactions/sell" },
  { label: "افزودن مشتری", icon: UserPlus, bg: "bg-violet-600", href: "/customers" },
  { label: "صندوق", icon: Wallet, bg: "bg-amber-500", href: "/cashier" },
];

export function QuickActions() {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold text-gray-400 px-1 uppercase tracking-wider">دسترسی سریع</h2>
      <div className="grid grid-cols-4 gap-2 px-1">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-3 transition-colors active:bg-gray-50"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.bg}`}>
              <a.icon className="h-4 w-4 text-white" strokeWidth={1.5} />
            </div>
            <span className="text-[10px] font-medium text-gray-500 text-center leading-tight">{a.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
