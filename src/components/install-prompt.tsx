"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showPrompt || isDismissed) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm animate-slide-up">
      <div className="rounded-[5px] bg-gray-900 p-4 shadow-xl shadow-gray-900/20">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] bg-white/10">
            <Download className="h-5 w-5 text-white" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white">نصب اپلیکیشن</p>
            <p className="text-[11px] text-white/60 mt-0.5 leading-relaxed">
              صرافیکس رو روی گوشیت نصب کن تا سریع‌تر بهش دسترسی داشته باشی
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-white/40 hover:text-white/70 transition-colors"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleInstall}
            className="flex-1 h-10 rounded-[5px] bg-white text-[13px] font-bold text-gray-900 hover:bg-white/90 transition-colors"
          >
            نصب
          </button>
          <button
            onClick={handleDismiss}
            className="h-10 px-4 rounded-[5px] bg-white/10 text-[13px] font-medium text-white/70 hover:bg-white/15 transition-colors"
          >
            بعداً
          </button>
        </div>
      </div>
    </div>
  );
}
