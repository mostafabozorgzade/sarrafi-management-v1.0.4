import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersLoading() {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gray-100 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
          <div className="flex items-center justify-between mb-1">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-2.5 w-28" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-7 flex-1 rounded-lg" />
            <Skeleton className="h-7 w-12 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
