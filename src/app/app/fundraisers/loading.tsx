import { Skeleton } from "@/components/ui/skeleton";

export default function FundraisersLoading() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-card border border-border rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-muted/50 border border-border rounded-lg overflow-hidden"
            >
              <Skeleton className="h-48 w-full" />
              <div className="p-4">
                <div className="space-y-2 mb-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-4/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
