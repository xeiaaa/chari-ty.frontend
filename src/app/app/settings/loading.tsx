import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-card border border-border rounded-lg shadow-sm divide-y divide-border">
        <div className="p-6">
          <Skeleton className="h-10 w-32 mb-1" />
          <Skeleton className="h-5 w-64" />
        </div>

        {/* Profile Section */}
        <div className="p-6">
          <Skeleton className="h-8 w-32 mb-4" />
          <div className="space-y-4">
            <div className="grid gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid gap-2">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-[100px] w-full" />
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="p-6">
          <Skeleton className="h-8 w-40 mb-4" />
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-6 w-48 mb-1" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6 bg-destructive/5">
          <Skeleton className="h-8 w-40 mb-4" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
