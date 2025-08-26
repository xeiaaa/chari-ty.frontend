"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { api } from "@/lib/utils";
import {
  Calendar,
  Globe,
  Users,
  Share2,
  Building2,
  CheckCircle,
} from "lucide-react";

interface GroupUpload {
  id: string;
  groupId: string;
  uploadId: string;
  type: string;
  caption: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  upload: {
    id: string;
    cloudinaryAssetId: string;
    publicId: string;
    url: string;
    eagerUrl: string;
    format: string;
    resourceType: string;
    size: number;
    pages: number;
    originalFilename: string;
    uploadedAt: string;
    uploadedById: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface Fundraiser {
  id: string;
  title: string;
  summary: string;
  category: string;
  goalAmount: string;
  currency: string;
  coverUrl?: string;
  cover?: {
    eagerUrl: string;
  };
  slug: string;
  progress: {
    totalRaised: string;
    donationCount: number;
    progressPercentage: number;
  };
  createdAt: string;
  isPublic: boolean;
  status: string;
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
    type: string;
    verified: boolean;
    owner: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatarUrl?: string;
    };
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

interface Group {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: "team" | "nonprofit" | "individual";
  avatarUrl?: string;
  website?: string;
  verified: boolean;
  createdAt: string;
  groupUploads: GroupUpload[];
}

export default function PublicGroupPage() {
  const params = useParams();
  const slug = params.slug as string;

  const {
    data: group,
    isLoading,
    error,
  } = useQuery<Group>({
    queryKey: ["public-group", slug],
    queryFn: async () => {
      const response = await api.get(`/public/groups/slug/${slug}`);
      return response.data;
    },
  });

  const {
    data: fundraisersData,
    isLoading: fundraisersLoading,
    error: fundraisersError,
  } = useQuery<FundraisersResponse>({
    queryKey: ["group-fundraisers", slug],
    queryFn: async () => {
      const response = await api.get(`/public/groups/slug/${slug}/fundraisers`);
      return response.data;
    },
    enabled: !!group, // Only fetch when group data is available
  });

  const formatCurrency = (amount: string, currency: string) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const getCategoryBadgeStyle = (category: string) => {
    switch (category) {
      case "education":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "health":
        return "bg-red-100 text-red-800 border-red-200";
      case "disaster_relief":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "environment":
        return "bg-green-100 text-green-800 border-green-200";
      case "animals":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "children":
        return "bg-pink-100 text-pink-800 border-pink-200";
      case "community":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "arts":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "sports":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "food":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "housing":
        return "bg-slate-100 text-slate-800 border-slate-200";
      case "technology":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: group?.name,
          text: group?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        // You could add a toast notification here
      } catch (error) {
        console.error("Error copying to clipboard:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Group Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The group you&apos;re looking for doesn&apos;t exist or is not
            public.
          </p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              {group.avatarUrl ? (
                <img
                  src={group.avatarUrl}
                  alt={group.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {group.name}
                  </h1>
                  {group.verified && (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span className="capitalize">{group.type}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDate(group.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </Button>
          </div>

          {group.description && (
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              {group.description}
            </p>
          )}

          {group.website && (
            <div className="flex items-center space-x-2 text-blue-600">
              <Globe className="w-4 h-4" />
              <a
                href={group.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Visit Website
              </a>
            </div>
          )}
        </div>

        {/* Gallery Section */}
        {group.groupUploads &&
          group.groupUploads.filter((upload) => upload.type === "gallery")
            .length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {group.groupUploads
                  .filter((upload) => upload.type === "gallery")
                  .sort((a, b) => a.order - b.order)
                  .map((upload) => (
                    <div
                      key={upload.id}
                      className="aspect-square bg-muted rounded-lg overflow-hidden group cursor-pointer"
                    >
                      <img
                        src={upload.upload.eagerUrl}
                        alt={upload.caption || upload.upload.originalFilename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      {upload.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-sm">
                          {upload.caption}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

        {/* Fundraisers Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Fundraisers</h2>

          {fundraisersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-muted/50 border border-border rounded-lg overflow-hidden"
                >
                  <Skeleton className="h-48 w-full" />
                  <div className="p-4">
                    <div className="space-y-2 mb-4">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-2 w-full" />
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Skeleton className="h-9 w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : fundraisersError ||
            !fundraisersData?.items ||
            fundraisersData.items.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-muted/50 border border-border rounded-lg p-8">
                <h3 className="text-lg font-semibold mb-2">
                  No fundraisers found
                </h3>
                <p className="text-muted-foreground">
                  This group hasn&apos;t published any fundraisers yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fundraisersData.items.map((fundraiser) => (
                <div
                  key={fundraiser.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {fundraiser.cover?.eagerUrl ? (
                      <img
                        src={fundraiser.cover.eagerUrl}
                        alt={fundraiser.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                        <span className="text-4xl">
                          {fundraiser.category === "education" && "📚"}
                          {fundraiser.category === "health" && "🏥"}
                          {fundraiser.category === "disaster_relief" && "🚨"}
                          {fundraiser.category === "environment" && "🌱"}
                          {fundraiser.category === "animals" && "🐾"}
                          {fundraiser.category === "children" && "👶"}
                          {fundraiser.category === "community" && "🏘️"}
                          {fundraiser.category === "arts" && "🎨"}
                          {fundraiser.category === "sports" && "⚽"}
                          {fundraiser.category === "food" && "🍽️"}
                          {fundraiser.category === "housing" && "🏠"}
                          {fundraiser.category === "technology" && "💻"}
                          {![
                            "education",
                            "health",
                            "disaster_relief",
                            "environment",
                            "animals",
                            "children",
                            "community",
                            "arts",
                            "sports",
                            "food",
                            "housing",
                            "technology",
                          ].includes(fundraiser.category) && "💝"}
                        </span>
                      </div>
                    )}

                    {/* Category badge */}
                    <div
                      className={`absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryBadgeStyle(
                        fundraiser.category
                      )}`}
                    >
                      {fundraiser.category.replace("_", " ").toUpperCase()}
                    </div>

                    {/* Verified badge */}
                    {fundraiser.group?.verified && (
                      <div className="absolute top-3 left-3">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200 cursor-help">
                                ✓ Verified
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                The group who posted is a verified group /
                                individual / nonprofit org.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}

                    {!fundraiser.isPublic && (
                      <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
                        Private
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="space-y-3 mb-4">
                      <h3 className="font-semibold text-lg line-clamp-1 text-gray-900">
                        {fundraiser.title}
                      </h3>
                      <p className="text-sm min-h-12 text-gray-600 line-clamp-2 leading-relaxed">
                        {fundraiser.summary}
                      </p>

                      {/* Creation date and group info */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Created{" "}
                            {new Date(fundraiser.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>
                            {fundraiser.group ? (
                              <div className="flex items-center gap-1">
                                <Link
                                  href={`/groups/${fundraiser.group.slug}`}
                                  className="text-blue-600 hover:underline font-medium"
                                >
                                  {fundraiser.group.type === "individual"
                                    ? `${fundraiser.group.owner.firstName} ${fundraiser.group.owner.lastName}`
                                    : fundraiser.group.name}
                                </Link>
                                {fundraiser.group.verified && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200 cursor-help text-xs px-1 py-0">
                                          ✓
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>
                                          The group who posted is a verified
                                          group / individual / nonprofit org.
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            ) : fundraiser.user ? (
                              <span>
                                {fundraiser.user.firstName}{" "}
                                {fundraiser.user.lastName}
                              </span>
                            ) : (
                              <span>Unknown</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          Goal
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          {formatCurrency(
                            fundraiser.goalAmount,
                            fundraiser.currency
                          )}
                        </span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${fundraiser.progress.progressPercentage}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>
                          {formatCurrency(
                            fundraiser.progress.totalRaised,
                            fundraiser.currency
                          )}{" "}
                          raised
                        </span>
                        <span className="capitalize font-medium">
                          {fundraiser.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Link
                        href={`/fundraisers/${fundraiser.slug}`}
                        className="flex-1"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
                        >
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
