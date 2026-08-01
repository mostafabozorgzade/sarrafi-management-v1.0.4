import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="min-h-dvh bg-[#fafafa] flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="rounded-[5px] bg-white border border-gray-200/80 p-6 text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[5px] bg-gray-50">
              <WifiOff className="h-7 w-7 text-gray-300" strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-bold text-gray-900">اتصال اینترنت قطع است</h1>
            <p className="text-[13px] text-gray-400 leading-relaxed">
              برای استفاده از اپلیکیشن به اینترنت نیاز دارید.
              <br />
              لطفاً اتصال خود را بررسی کنید و دوباره تلاش کنید.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full h-12 rounded-[5px] bg-gray-900 text-[13px] font-bold text-white hover:bg-gray-800 transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    </main>
  );
}
