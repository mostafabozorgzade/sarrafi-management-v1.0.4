"use client";

import { LogOut, User, Bell, Shield } from "lucide-react";

const items = [
  { icon: User, label: "پروفایل", desc: "اطلاعات حساب کاربری" },
  { icon: Bell, label: "اعلان‌ها", desc: "تنظیمات اعلان‌ها" },
  { icon: Shield, label: "امنیت", desc: "رمز عبور و امنیت" },
];

export default function SettingsPage() {
  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 flex h-12 items-center border-b border-gray-100 bg-white px-4">
        <h1 className="text-sm font-semibold text-gray-900">تنظیمات</h1>
      </div>

      <div className="p-4 space-y-0">
        {items.map((item) => (
          <button key={item.label} className="flex w-full items-center gap-3 py-3.5 border-b border-gray-50 last:border-0 -mx-4 px-4 active:bg-gray-50">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50">
              <item.icon className="h-4 w-4 text-gray-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1 text-right">
              <p className="text-xs font-medium text-gray-900">{item.label}</p>
              <p className="text-[10px] text-gray-300">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="p-4">
        <button className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-red-200 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 active:bg-red-100">
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
          خروج از حساب
        </button>
      </div>
    </main>
  );
}
