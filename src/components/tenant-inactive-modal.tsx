"use client";

import { Lock, Phone } from "lucide-react";

interface TenantInactiveModalProps {
  isOpen: boolean;
}

export function TenantInactiveModal({ isOpen }: TenantInactiveModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-sm rounded-[8px] bg-white p-8 text-center shadow-xl">
        <div className="flex justify-center mb-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <Lock className="h-8 w-8 text-red-500" strokeWidth={1.5} />
          </div>
        </div>

        <h2 className="text-[17px] font-bold text-gray-900 mb-2">
          صرافی غیرفعال شده
        </h2>

        <p className="text-[13px] text-gray-500 leading-relaxed mb-6">
          صرافی شما غیرفعال شده است. لطفاً با پشتیبانی تماس بگیرید.
        </p>

        <a
          href="tel:09224013811"
          className="flex items-center justify-center gap-2 w-full rounded-[5px] bg-blue-600 px-4 py-3 text-[13px] font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <Phone className="h-4 w-4" strokeWidth={1.5} />
          <span dir="ltr">09224013811</span>
        </a>

        <p className="text-[11px] text-gray-400 mt-4">
          پشتیبانی ۲۴ ساعته
        </p>
      </div>
    </div>
  );
}
