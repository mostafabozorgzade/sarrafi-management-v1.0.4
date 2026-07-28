import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-gray-100 p-3">
          <Skeleton className="h-3 w-10 mb-1" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="rounded-lg border border-gray-100 p-3">
          <Skeleton className="h-3 w-10 mb-1" />
          <Skeleton className="h-5 w-10" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-2.5 w-28" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 -mx-4 px-4">
            <div className="space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-16" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
