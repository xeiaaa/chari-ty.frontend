"use client";

import { PublicTimelineMilestone } from "@/components/fundraisers/public-timeline-milestone-list";
import { useParams } from "next/navigation";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  api,
  formatAchievedTime,
  formatCategory,
  formatDate,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CheckCircle2,
  Milestone,
  User,
  ArrowLeft,
  Building,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface Fundraiser {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  goalAmount: string;
  currency: string;
  endDate?: string;
  coverUrl: string;
  galleryUrls: string[];
  ownerType: "user" | "group";
  userId?: string;
  groupId?: string;
  group?: {
    name: string;
  };
  status: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  progress: {
    totalRaised: string;
    donationCount: number;
    progressPercentage: number;
  };
  milestones: PublicTimelineMilestone[];
  cover?: {
    eagerUrl: string;
  };
}

const MilestoneJourneyPage = () => {
  const params = useParams();
  const slug = params.slug as string;
  const {
    data: fundraiser,
    isLoading,
    error,
  } = useQuery<Fundraiser>({
    queryKey: ["public-fundraiser", slug],
    queryFn: async () => {
      try {
        const response = await api.get(`/public/fundraisers/slug/${slug}`);
        return response.data;
      } catch (error) {
        console.error("Error fetching fundraiser:", error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors, but not for 404s
      if (failureCount >= 3) return false;
      if (error instanceof Error && error.message.includes("404")) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case "education":
        return "📚";
      case "health":
        return "🏥";
      case "disaster_relief":
        return "🚨";
      case "environment":
        return "🌱";
      case "animals":
        return "🐾";
      case "children":
        return "👶";
      case "community":
        return "🏘️";
      case "arts":
        return "🎨";
      case "sports":
        return "⚽";
      case "food":
        return "🍽️";
      case "housing":
        return "🏠";
      case "technology":
        return "💻";
      default:
        return "💝";
    }
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency.toUpperCase()) {
      case "USD":
        return "$";
      case "EUR":
        return "€";
      case "GBP":
        return "£";
      case "JPY":
        return "¥";
      case "CAD":
        return "C$";
      case "AUD":
        return "A$";
      case "CHF":
        return "CHF";
      case "CNY":
        return "¥";
      case "INR":
        return "₹";
      case "BRL":
        return "R$";
      case "MXN":
        return "MX$";
      case "KRW":
        return "₩";
      case "SGD":
        return "S$";
      case "HKD":
        return "HK$";
      case "NZD":
        return "NZ$";
      default:
        return "$";
    }
  };

  const renderMilestoneContent = (milestone: PublicTimelineMilestone) => (
    <article className="mb-12">
      {/* Milestone Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-blue-600">
              Step {milestone.stepNumber}
            </span>
            {milestone.achieved && (
              <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Achieved</span>
              </div>
            )}
          </div>
          <div className="h-px bg-gray-300 flex-1"></div>
          <span className="text-sm text-gray-600">
            {getCategoryEmoji(fundraiser?.category || "")}
          </span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {milestone.title}
        </h2>

        <p className="text-gray-700 leading-relaxed mb-4">
          {milestone.purpose}
        </p>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-semibold text-green-700">
              {getCurrencySymbol(fundraiser?.currency || "USD")}
              {milestone.amount}
            </div>
            {milestone.achieved && milestone.achievedAt && (
              <div className="text-sm text-gray-500">
                Achieved at {formatAchievedTime(milestone.achievedAt)}
              </div>
            )}
          </div>

          {/* Progress Status */}
          {!milestone.achieved && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-yellow-800">
                  Not yet started
                </span>
              </div>
              <div className="text-xs text-yellow-700 mt-1">
                No donations received yet for this milestone
              </div>
            </div>
          )}

          {milestone.achieved && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">
                  Completed
                </span>
              </div>
              <div className="text-xs text-green-700 mt-1">
                Milestone goal achieved successfully
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Image Section */}
      {milestone.proofUrls && milestone.proofUrls.length > 0 && (
        <div className="mb-6">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {milestone.proofUrls.map((url, index) => {
                if (!url) return null;
                return (
                  <CarouselItem key={url} className="md:basis-1/1">
                    <div className="relative">
                      <img
                        src={url}
                        alt={`Milestone ${milestone.stepNumber} - Image ${
                          index + 1
                        }`}
                        className="w-full h-96 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-black/70 text-white px-3 py-2 rounded text-sm">
                          {milestone.title} - Step {milestone.stepNumber}
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            {milestone.proofUrls.length > 1 && (
              <>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </>
            )}
          </Carousel>
        </div>
      )}

      {/* Completion Details */}
      {milestone.achieved && milestone.completionDetails && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Completion Details
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {milestone.completionDetails}
            </p>
          </div>
        </div>
      )}

      {/* Post Details */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          Post Details
        </h4>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Hosted by {formatDate(milestone.createdAt)}</span>
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="w-3 h-3 text-gray-600" />
          </div>
          <span>Fundraiser</span>
        </div>
      </div>
    </article>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto pt-8 px-4">
          <div className="space-y-8">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-32 w-full" />
            <div className="space-y-6">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    // Determine error type and message
    const isNotFound =
      error instanceof Error &&
      (error.message.includes("404") || error.message.includes("not found"));
    const isNetworkError =
      error instanceof Error &&
      (error.message.includes("network") || error.message.includes("fetch"));

    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto pt-8 px-4">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold text-red-600 mb-2">
              {isNotFound ? "Fundraiser Not Found" : "Something Went Wrong"}
            </h1>
            <p className="text-gray-600 mb-4">
              {isNotFound
                ? "The fundraiser you're looking for doesn't exist or is no longer available."
                : isNetworkError
                ? "We're having trouble connecting to our servers. Please check your internet connection and try again."
                : "An unexpected error occurred while loading the fundraiser. Please try again later."}
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button variant="outline">Go Back Home</Button>
              </Link>
              {!isNotFound && (
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              )}
            </div>
            {process.env.NODE_ENV === "development" && (
              <details className="mt-4 text-left max-w-md mx-auto">
                <summary className="text-sm text-gray-500 cursor-pointer">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-gray-600 mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {error instanceof Error ? error.message : String(error)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (fundraiser) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto pt-8 px-4">
          {/* Back Button */}
          <div className="mb-6">
            <Link href={`/fundraisers/${slug}`}>
              <Button
                variant="ghost"
                // className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Fundraiser
              </Button>
            </Link>
          </div>

          {/* Header Section */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
              {fundraiser.title}
            </h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-gray-300 w-8"></div>
              <span className="text-gray-600 font-medium flex items-center gap-2">
                <span>{getCategoryEmoji(fundraiser.category)}</span>
                <span>{formatCategory(fundraiser.category)}</span>
              </span>
            </div>

            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              {fundraiser.description || fundraiser.summary}
            </p>
          </header>

          {/* Main Image */}
          <div className="mb-8">
            {fundraiser.cover?.eagerUrl ? (
              <img
                src={fundraiser.cover.eagerUrl}
                alt={fundraiser.title}
                className="w-full h-96 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-96 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-6xl">
                  {getCategoryEmoji(fundraiser.category)}
                </span>
              </div>
            )}
          </div>

          {/* Fundraiser Info */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Created {formatDate(fundraiser.createdAt)}</span>
              </div>
              {fundraiser.endDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Ends {formatDate(fundraiser.endDate)}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                {fundraiser.ownerType === "group" ? (
                  <Building className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span>
                  {fundraiser.ownerType === "group" ? "Group" : "Personal"}
                </span>
              </div>
            </div>

            {/* Creator Details */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Created by
              </h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  {fundraiser.ownerType === "group" ? (
                    <Building className="w-5 h-5 text-white" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {fundraiser.ownerType === "group"
                      ? fundraiser.group?.name || "Fundraiser Group"
                      : "Individual Fundraiser"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {fundraiser.ownerType === "group"
                      ? "Organized by a group"
                      : "Organized by an individual"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Milestones Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Milestone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div>Our Journey</div>
                  <div className="text-lg font-normal text-gray-600">
                    Milestone Progress & Achievements
                  </div>
                </div>
              </h2>

              {/* Total Completion Percentage */}
              <div className="text-right">
                <div className="text-2xl font-bold text-green-700">
                  {Math.round(fundraiser.progress?.progressPercentage || 0)}%
                </div>
                <div className="text-sm text-gray-600">Total Raised</div>
                <div className="text-xs ">
                  <span className="text-green-700">
                    {getCurrencySymbol(fundraiser?.currency || "USD")}
                    {fundraiser.progress?.totalRaised || "0"}
                  </span>{" "}
                  of {getCurrencySymbol(fundraiser?.currency || "USD")}
                  {fundraiser.goalAmount}
                </div>
              </div>
            </div>

            <div className="space-y-12">
              {fundraiser.milestones?.map((milestone, idx) => {
                return (
                  <div key={milestone.id || idx}>
                    {renderMilestoneContent(milestone)}
                    {idx < (fundraiser.milestones?.length || 0) - 1 && (
                      <div className="border-t border-gray-200 mt-12 pt-8"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Footer Content */}
          <footer className="mt-12 py-8 border-t border-gray-200">
            <p className="text-gray-600 leading-relaxed text-sm italic">
              This fundraiser represents a journey of progress and achievement.
              Each milestone marks a significant step forward in reaching our
              goals and making a positive impact. Thank you for being part of
              this meaningful journey.
            </p>
          </footer>
        </div>
      </div>
    );
  }
};

export default MilestoneJourneyPage;
