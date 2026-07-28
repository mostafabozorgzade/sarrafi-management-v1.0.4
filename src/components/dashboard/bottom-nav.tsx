"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  BarChart3,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "داشبورد", icon: LayoutDashboard, href: "/dashboard" },
  { label: "سفارشات", icon: ClipboardList, href: "/orders" },
  { label: "مشتریان", icon: Users, href: "/customers" },
  { label: "گزارشات", icon: BarChart3, href: "/reports" },
  { label: "پروفایل", icon: User, href: "/profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const handleClick = (href: string) => {
    if (pathname.startsWith(href)) return;
    setPendingHref(href);
  };

  const isLoading = (href: string) => pendingHref === href && !pathname.startsWith(href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const loading = isLoading(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => handleClick(item.href)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors",
                active ? "text-blue-600" : "text-gray-400"
              )}
            >
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute inset-0 animate-shimmer rounded-lg opacity-30 bg-gradient-to-r from-transparent via-blue-100 to-transparent" />
                </div>
              )}
              <div className="relative">
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-all",
                    loading && "animate-pulse"
                  )}
                  strokeWidth={1.5}
                />
                {loading && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                    <div className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                  </div>
                )}
              </div>
              <span className={cn(loading && "animate-pulse")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
