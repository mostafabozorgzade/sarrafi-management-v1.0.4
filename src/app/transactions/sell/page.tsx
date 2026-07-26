import { ArrowUpFromLine } from "lucide-react";
import { SellForm } from "@/components/transactions/sell-form";

export default function SellPage() {
  return (
    <main className="min-h-dvh bg-white">
      <div className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-gray-100 bg-white px-4">
        <ArrowUpFromLine className="h-4 w-4 text-emerald-600" strokeWidth={1.5} />
        <h1 className="text-sm font-semibold text-gray-900">ثبت فروش ارز</h1>
      </div>
      <div className="px-4 py-4">
        <SellForm />
      </div>
    </main>
  );
}
