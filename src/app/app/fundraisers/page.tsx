"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/contexts/account-context";
import { useApi } from "@/lib/api";
import SkeletonLoader from "@/components/common/skeleton-loader";
import PageHeader from "@/components/common/page-header";

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
  cover?: {
    cloudinaryAssetId: string;
    createdAt: string;
    eagerUrl: string;
    format: string;
    id: string;
    originalFilename: string;
    pages: number;
    publicId: string;
    resourceType: string;
    size: number;
    updatedAt: string;
    uploadedAt: string;
    uploadedById: string;
  };
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
  const { selectedAccount } = useAccount();
  const api = useApi();

  const isPersonalAccount = selectedAccount.type === "individual";

  const { data, isLoading, error } = useQuery<FundraisersResponse>({
    queryKey: ["fundraisers", selectedAccount.id],
    queryFn: async () => {
      const params = new URLSearchParams();

      // For personal accounts, don't send groupId (will show user's personal fundraisers)
      // For group accounts, send the groupId to filter by that specific group
      params.append("groupId", selectedAccount.id);

      const response = await api.get(`/fundraisers?${params.toString()}`);
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
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Fundraisers"
          message="Manage your fundraising campaigns"
        />
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-start flex-col md:flex-row">
          <PageHeader
            title="Fundraisers"
            message={
              isPersonalAccount
                ? "Your personal fundraisers"
                : `${selectedAccount.name} fundraisers`
            }
          />

          {data?.items && data.items.length > 0 && (
            <Link href="/app/fundraisers/create">
              <Button className="text-sm px-3 py-2 md:text-base md:px-4 md:py-2">
                Create Fundraiser
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <SkeletonLoader variant="list" />
        ) : !data?.items?.length ? (
          <div className="bg-card border border-border rounded-lg shadow-sm p-6">
            <div className="text-center py-12">
              <div className="bg-muted/50 border border-border rounded-lg p-8">
                <h3 className="text-lg font-semibold mb-2">
                  No fundraisers found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {isPersonalAccount
                    ? "You haven't created any fundraisers yet."
                    : `${selectedAccount.name} doesn't have any fundraisers yet.`}
                </p>
                <Link href="/app/fundraisers/create">
                  <Button>Create Your First Fundraiser</Button>
                </Link>
              </div>
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
                  <div className="flex gap-2 mt-4">
                    <Link
                      href={`/app/fundraisers/${fundraiser.slug}`}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        View
                      </Button>
                    </Link>
                    <Link
                      href={`/app/fundraisers/${fundraiser.slug}/edit`}
                      className="flex-1"
                    >
                      <Button variant="secondary" size="sm" className="w-full">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {data?.items?.length && data.items.length > 0 ? (
          <div className="text-center text-sm text-muted-foreground">
            Showing {data?.items?.length ?? 0} of {data?.meta?.total ?? 0}{" "}
            fundraisers
          </div>
        ) : null}
      </div>
    </div>
  );
}
