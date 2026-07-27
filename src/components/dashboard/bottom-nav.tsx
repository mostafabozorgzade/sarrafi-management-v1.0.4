"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "داشبورد", icon: LayoutDashboard, href: "/dashboard" },
  { label: "سفارشات", icon: ClipboardList, href: "/orders" },
  { label: "مشتریان", icon: Users, href: "/customers" },
  { label: "گزارشات", icon: BarChart3, href: "/reports" },
  { label: "تنظیمات", icon: Settings, href: "/settings" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors",
                isActive ? "text-blue-600" : "text-gray-400"
              )}
            >
              <item.icon className="h-5 w-5" strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
