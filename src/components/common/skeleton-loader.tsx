import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonLoaderProps {
  variant?: "dashboard" | "card" | "list";
  className?: string;
}

const SkeletonLoader = ({
  variant = "dashboard",
  className = "",
}: SkeletonLoaderProps) => {
  const renderDashboardSkeleton = () => (
    <div className={`max-w-6xl mx-auto ${className}`}>
      <div className="mb-6">
        <Skeleton className="h-10 w-2/3 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-6" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </div>
  );

  const renderCardSkeleton = () => (
    <div
      className={`bg-card border border-border rounded-lg shadow-sm p-6 ${className}`}
    >
      <Skeleton className="h-10 w-64 mb-4" />
      <Skeleton className="h-5 w-96 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-muted/50 border border-border rounded-lg p-6 flex flex-col gap-4"
          >
            <Skeleton className="h-32 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className={`space-y-4 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center space-x-4 p-4 border rounded-lg"
        >
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );

  const variants = {
    dashboard: renderDashboardSkeleton,
    card: renderCardSkeleton,
    list: renderListSkeleton,
  };

  return variants[variant]();
};

export default SkeletonLoader;
