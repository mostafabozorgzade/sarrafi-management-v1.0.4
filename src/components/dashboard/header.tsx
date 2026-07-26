"use client";

import Link from "next/link";
import { Bell, Landmark } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-100 bg-white px-4">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Landmark className="h-4 w-4 text-white" strokeWidth={1.5} />
        </div>
        <span className="text-sm font-bold text-gray-900">SarafiX</span>
      </Link>
      <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600">
        <Bell className="h-4 w-4" strokeWidth={1.5} />
        <span className="absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
      </button>
    </header>
  );
}
