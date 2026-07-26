"use client";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  UserPlus,
  Wallet,
} from "lucide-react";

interface QuickAction {
  label: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  href: string;
}

const actions: QuickAction[] = [
  { label: "ثبت خرید", icon: ArrowDownToLine, iconBg: "bg-blue-600", iconColor: "text-white", href: "/transactions/buy" },
  { label: "ثبت فروش", icon: ArrowUpFromLine, iconBg: "bg-emerald-600", iconColor: "text-white", href: "/transactions/sell" },
  { label: "افزودن مشتری", icon: UserPlus, iconBg: "bg-violet-600", iconColor: "text-white", href: "/customers" },
  { label: "صندوق", icon: Wallet, iconBg: "bg-amber-500", iconColor: "text-white", href: "/cashier" },
];

export function QuickActions() {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold text-gray-400 px-1 uppercase tracking-wider">دسترسی سریع</h2>
      <div className="grid grid-cols-4 gap-2 px-1">
        {actions.map((action) => (
          <a
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-3 transition-colors active:bg-gray-50"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.iconBg}`}>
              <action.icon className={`h-4 w-4 ${action.iconColor}`} strokeWidth={1.5} />
            </div>
            <span className="text-[10px] font-medium text-gray-500 text-center leading-tight">{action.label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
