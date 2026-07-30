"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ExchangeLogo } from "@/components/shared/exchange-logo";

export function Header() {
  const { user } = useAuth();
  const tenantName = user?.tenantName;

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-100 bg-white px-4">
      <Link href="/dashboard">
        <ExchangeLogo
          size={32}
          showText
          showTenant
          tenantName={tenantName}
        />
      </Link>
      <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600">
        <Bell className="h-4 w-4" strokeWidth={1.5} />
        <span className="absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
      </button>
    </header>
  );
}
