"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({ isOpen, onClose, title, children, className }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasFixedHeight = className?.includes("h-[") || className?.includes("h-screen");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={sheetRef}
        className={cn(
          "relative w-full max-w-lg rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out",
          "animate-slide-up",
          hasFixedHeight ? "flex flex-col" : "",
          className
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 rounded-t-2xl shrink-0">
          {title && <h2 className="text-sm font-semibold text-gray-900">{title}</h2>}
        </div>
        <div className={cn(
          "overflow-y-auto overscroll-contain p-4",
          hasFixedHeight ? "flex-1 min-h-0" : "max-h-[70vh]"
        )}>
          {children}
        </div>
      </div>
    </div>
  );
}
