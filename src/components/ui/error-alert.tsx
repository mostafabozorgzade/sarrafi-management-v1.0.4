"use client";

import { AlertCircle } from "lucide-react";

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600 animate-in fade-in duration-200" role="alert">
      <AlertCircle className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
      <span>{message}</span>
    </div>
  );
}
