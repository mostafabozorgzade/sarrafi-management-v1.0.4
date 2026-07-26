"use client";

import {
  Banknote,
  BadgeIndianRupee,
  TrendingUp,
  Receipt,
  BarChart3,
} from "lucide-react";

interface StatusCard {
  label: string;
  value: string;
  change?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const statusCards: StatusCard[] = [
  { label: "موجودی تومان", value: "۲,۴۵۰,۰۰۰,۰۰۰", change: "+۲.۳٪", icon: Banknote, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  { label: "موجودی روپیه", value: "۱۲,۸۰۰,۰۰۰", change: "+۱.۱٪", icon: BadgeIndianRupee, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
  { label: "سود امروز", value: "۸,۵۰۰,۰۰۰", change: "+۱۵٪", icon: TrendingUp, iconBg: "bg-green-50", iconColor: "text-green-600" },
  { label: "تعداد معاملات", value: "۴۷", change: "+۸", icon: Receipt, iconBg: "bg-violet-50", iconColor: "text-violet-600" },
  { label: "حجم معاملات", value: "۱۲۵,۰۰۰,۰۰۰", icon: BarChart3, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
];

export function StatusCards() {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold text-gray-400 px-1 uppercase tracking-wider">وضعیت لحظه‌ای</h2>
      <div className="flex gap-2 overflow-x-auto pb-1 px-1 -mx-1 snap-x snap-mandatory scrollbar-hide">
        {statusCards.map((card) => (
          <div
            key={card.label}
            className="min-w-[140px] flex-1 snap-start rounded-xl border border-gray-100 bg-white p-3"
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.iconBg}`}>
                <card.icon className={`h-4 w-4 ${card.iconColor}`} strokeWidth={1.5} />
              </div>
              {card.change && (
                <span className="rounded-md bg-green-50 px-1.5 py-0.5 text-[9px] font-semibold text-green-600">
                  {card.change}
                </span>
              )}
            </div>
            <p className="mt-2 text-[11px] text-gray-400">{card.label}</p>
            <p className="text-base font-bold text-gray-900 mt-0.5" dir="ltr">{card.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
