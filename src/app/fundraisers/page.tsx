"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/api";

interface Fundraiser {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  goalAmount: string; // Backend returns as string
  currency: string;
  endDate?: string;
  coverUrl: string;
  galleryUrls: string[];
  ownerType: "user" | "group";
  userId?: string;
  groupId?: string;
  status: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  progress: {
    totalRaised: string;
    donationCount: number;
    progressPercentage: number;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
  };
  group?: {
    id: string;
    name: string;
    description: string;
    slug: string;
  };
  cover?: {
    eagerUrl: string;
  };
}

interface FundraisersResponse {
  items: Fundraiser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function FundraisersPage() {
  const api = useApi();

  const { data, isLoading, error } = useQuery<FundraisersResponse>({
    queryKey: ["public-fundraisers"],
    queryFn: async () => {
      const response = await api.get("/public/fundraisers");
      return response.data;
    },
  });

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Fundraisers</h1>
          </div>
          <div className="text-center py-8">
            <p className="text-destructive">Failed to load fundraisers</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto my-12">
      <div className="bg-card border border-border rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Fundraisers</h1>
          <p className="text-muted-foreground mt-1">
            Discover inspiring causes and make a difference
          </p>
        </div>

        {isLoading ? (
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
        ) : !data?.items?.length ? (
          <div className="text-center py-12">
            <div className="bg-muted/50 border border-border rounded-lg p-8">
              <h3 className="text-lg font-semibold mb-2">
                No fundraisers found
              </h3>
              <p className="text-muted-foreground mb-4">
                No fundraisers are available at the moment. Check back soon!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((fundraiser) => (
              <div
                key={fundraiser.id}
                className="bg-muted/50 border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-48 bg-muted relative">
                  <img
                    src={fundraiser.cover?.eagerUrl}
                    alt={fundraiser.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  {!fundraiser.isPublic && (
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      Private
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="space-y-2 mb-4">
                    <h3 className="font-semibold text-lg line-clamp-1">
                      {fundraiser.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {fundraiser.summary}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">
                        {fundraiser.category.replace("_", " ")}
                      </span>
                      <span>•</span>
                      <span>{formatDate(fundraiser.createdAt)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      by{" "}
                      {fundraiser.group ? (
                        <Link
                          href={`/groups/${fundraiser.group.slug}`}
                          className="text-primary hover:underline"
                        >
                          {fundraiser.group.name}
                        </Link>
                      ) : fundraiser.user ? (
                        <Link
                          href={`/users/${fundraiser.user.username}`}
                          className="text-primary hover:underline"
                        >
                          {fundraiser.user.firstName} {fundraiser.user.lastName}
                        </Link>
                      ) : (
                        "Unknown"
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Goal</span>
                      <span className="text-sm font-semibold">
                        {formatCurrency(
                          parseFloat(fundraiser.goalAmount),
                          fundraiser.currency
                        )}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${
                            fundraiser.progress?.progressPercentage || 0
                          }%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>
                        {formatCurrency(
                          parseFloat(fundraiser.progress?.totalRaised || "0"),
                          fundraiser.currency
                        )}{" "}
                        raised
                      </span>
                      <span className="capitalize">{fundraiser.status}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/fundraisers/${fundraiser.slug}`}
                      className="w-full"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {data?.items?.length && data.items.length > 0 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Showing {data?.items?.length ?? 0} of {data?.meta?.total ?? 0}{" "}
            fundraisers
          </div>
        )}
      </div>
    </div>
  );
}
