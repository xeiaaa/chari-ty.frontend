"use client";

import { PublicTimelineMilestone } from "@/components/fundraisers/public-timeline-milestone-list";
import { useParams } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  api,
  formatAchievedDateTime,
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
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
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

  console.log({ fundraiser });

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

  // Custom Image Carousel Component
  interface ImageCarouselProps {
    images: Array<{ id: string; eagerUrl: string }>;
    title: string;
    stepNumber: number;
  }

  const ImageCarousel: React.FC<ImageCarouselProps> = ({
    images,
    title,
    stepNumber,
  }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const thumbnailContainerRef = useRef<HTMLDivElement>(null);

    const goToNext = () => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const goToPrevious = () => {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const goToImage = (index: number) => {
      setCurrentIndex(index);
    };

    const openLightbox = () => {
      setIsLightboxOpen(true);
    };

    const closeLightbox = () => {
      setIsLightboxOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;

      switch (e.key) {
        case "Escape":
          closeLightbox();
          break;
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
      }
    };

    useEffect(() => {
      if (isLightboxOpen) {
        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "unset";
      };
    }, [isLightboxOpen]);

    if (!images || images.length === 0) return null;

    return (
      <>
        {/* Main Image Section */}
        <div
          className="relative mb-4"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <img
            src={images[currentIndex].eagerUrl}
            alt={`${title} - Step ${stepNumber} - Image ${currentIndex + 1}`}
            className="w-full h-96 object-cover rounded-lg cursor-pointer transition-all duration-300 hover:scale-[1.02]"
            onClick={openLightbox}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />

          {/* Image overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/70 text-white px-3 py-2 rounded text-sm">
              {title} - Step {stepNumber}
            </div>
          </div>

          {/* Navigation arrows - only visible on hover */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-300 ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-300 ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Navigation */}
        {images.length > 1 && (
          <div className="relative">
            <div
              ref={thumbnailContainerRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide"
            >
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => goToImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    index === currentIndex
                      ? "border-green-500 shadow-lg scale-105"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={image.eagerUrl}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox */}
        {isLightboxOpen && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-4xl max-h-full">
              {/* Close button */}
              <button
                onClick={closeLightbox}
                className="absolute -top-12 right-0 w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-all duration-300"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Main lightbox image */}
              <img
                src={images[currentIndex].eagerUrl}
                alt={`${title} - Step ${stepNumber} - Image ${
                  currentIndex + 1
                }`}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />

              {/* Lightbox navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-300"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-300"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Lightbox thumbnail navigation */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <div className="flex gap-2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
                    {images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => goToImage(index)}
                        className={`w-12 h-12 rounded overflow-hidden border-2 transition-all duration-300 ${
                          index === currentIndex
                            ? "border-white"
                            : "border-white/30 hover:border-white/60"
                        }`}
                      >
                        <img
                          src={image.eagerUrl}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Image counter */}
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded text-sm">
                {currentIndex + 1} / {images.length}
              </div>
            </div>
          </div>
        )}
      </>
    );
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
                Achieved at {formatAchievedDateTime(milestone.achievedAt)}
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
        </div>
      </div>

      {/* Main Image Section */}
      {milestone.milestoneUploads && milestone.milestoneUploads.length > 0 && (
        <div className="mb-6">
          <ImageCarousel
            images={milestone.milestoneUploads.map((upload) => ({
              id: upload.id,
              eagerUrl: upload.upload.eagerUrl,
            }))}
            title={milestone.title}
            stepNumber={milestone.stepNumber}
          />
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
                Group
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
                    {fundraiser.group?.name}
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
