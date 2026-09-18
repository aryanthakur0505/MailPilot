// ==================================================
// MailPilot — Dashboard Loading State
// ==================================================
// Applies to every /dashboard/* route via Next's file-based Suspense
// boundary — previously there was none anywhere in the dashboard tree,
// so a slow Server Component data fetch (a real factor on Render's free
// tier) rendered nothing at all until it finished. Deliberately generic
// (stat-row + list skeleton) since it covers every child route, not
// just the inbox.

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="mb-4 size-10 rounded-lg" />
            <Skeleton className="mb-2 h-7 w-12" />
            <Skeleton className="h-4 w-20" />
          </Card>
        ))}
      </div>

      <Card className="p-0">
        <div className="border-b p-5">
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3.5 px-5 py-3.5">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <Skeleton className="h-3 w-12 shrink-0" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
