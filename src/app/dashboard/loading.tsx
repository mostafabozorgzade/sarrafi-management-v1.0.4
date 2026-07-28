import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 px-4 py-4">
      <section className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-gray-100 bg-white p-3">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-6 w-28" />
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-3">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <Skeleton className="h-3 w-20" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-2 w-14 mt-2" />
              <Skeleton className="h-4 w-16 mt-1" />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <Skeleton className="h-3 w-16" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="min-w-[120px] rounded-xl border border-gray-100 bg-white p-3">
              <Skeleton className="h-2 w-14 mb-2" />
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <Skeleton className="h-3 w-20" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-2 w-12" />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <Skeleton className="h-3 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 -mx-4 px-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-10" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
