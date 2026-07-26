"use client";

import {
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "داشبورد", icon: LayoutDashboard, href: "/dashboard", active: true },
  { label: "معاملات", icon: ArrowLeftRight, href: "/transactions", active: false },
  { label: "مشتریان", icon: Users, href: "/customers", active: false },
  { label: "تنظیمات", icon: Settings, href: "/settings", active: false },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white">
      <div className="flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-4 py-2 text-[10px] font-medium transition-colors",
              item.active ? "text-blue-600" : "text-gray-400"
            )}
          >
            <item.icon className="h-5 w-5" strokeWidth={1.5} />
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
