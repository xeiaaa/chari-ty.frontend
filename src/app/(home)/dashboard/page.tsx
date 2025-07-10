"use client";

import { useUser } from "@/lib/hooks/use-user";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <Skeleton className="h-10 w-2/3 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-muted/50 border border-border rounded-lg p-6 flex flex-col gap-4"
              >
                <div className="h-32 bg-muted rounded-md animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-card border border-border rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold mb-4">Welcome, {user.firstName}!</h1>
        <div className="text-muted-foreground space-y-2 mb-8">
          <p>Email: {user.email}</p>
          {user.bio && <p>Bio: {user.bio}</p>}
        </div>

        <h2 className="text-xl font-semibold mb-4">Your Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-muted/50 border border-border rounded-lg p-6">
            <h3 className="font-medium mb-2">Fundraisers</h3>
            <p className="text-2xl font-bold">0</p>
            <p className="text-muted-foreground text-sm">Active campaigns</p>
          </div>
          <div className="bg-muted/50 border border-border rounded-lg p-6">
            <h3 className="font-medium mb-2">Donations</h3>
            <p className="text-2xl font-bold">$0</p>
            <p className="text-muted-foreground text-sm">Total contributed</p>
          </div>
          <div className="bg-muted/50 border border-border rounded-lg p-6">
            <h3 className="font-medium mb-2">Impact</h3>
            <p className="text-2xl font-bold">0</p>
            <p className="text-muted-foreground text-sm">People helped</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="bg-muted/50 border border-border rounded-lg p-6 text-center text-muted-foreground">
            No recent activity to show
          </div>
        </div>
      </div>
    </div>
  );
}
