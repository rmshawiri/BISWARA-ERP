import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border p-6 sm:p-8">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-5">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="mt-4 h-6 w-20" />
            <Skeleton className="mt-2 h-3 w-16" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border lg:col-span-2">
          <div className="p-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-6 h-40 w-full" />
          </div>
        </div>
        <div className="rounded-xl border p-6">
          <Skeleton className="h-5 w-32" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
