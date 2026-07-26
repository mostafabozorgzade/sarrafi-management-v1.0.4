import { ArrowDownToLine } from "lucide-react";
import { BuyForm } from "@/components/transactions/buy-form";

export default function BuyPage() {
  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-gray-100 bg-white px-4">
        <ArrowDownToLine className="h-4 w-4 text-blue-600" strokeWidth={1.5} />
        <h1 className="text-sm font-semibold text-gray-900">ثبت خرید ارز</h1>
      </div>
      <div className="px-4 py-4">
        <BuyForm />
      </div>
    </main>
  );
}
