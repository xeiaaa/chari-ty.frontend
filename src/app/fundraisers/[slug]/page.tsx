"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DonationDialog } from "@/components/ui/donation-dialog";
import { api, formatCategory, formatCurrency, formatDate } from "@/lib/utils";
import { Calendar, Globe, Users, Share2, Heart } from "lucide-react";
import {
  PublicTimelineMilestone,
  PublicTimelineMilestoneList,
} from "@/components/fundraisers/public-timeline-milestone-list";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import SkeletonLoader from "@/components/common/skeleton-loader";

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

export default function PublicFundraiserPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const [isDonationDialogOpen, setIsDonationDialogOpen] = useState(false);
  const [donationStatus, setDonationStatus] = useState<string | null>(null);

  const [, setPageAliases] = useLocalStorage<Record<string, string>>(
    "fundraiserAliasMap",
    {}
  );

  useEffect(() => {
    const alias = searchParams.get("alias");
    console.info({ alias });
    if (alias && slug) {
      setPageAliases((prev) => ({
        ...prev,
        [slug]: alias,
      }));
    }
  }, [searchParams]);

  const {
    data: fundraiser,
    isLoading,
    error,
  } = useQuery<Fundraiser>({
    queryKey: ["public-fundraiser", slug],
    queryFn: async () => {
      const response = await api.get(`/public/fundraisers/slug/${slug}`);
      return response.data;
    },
  });

  // Check for donation status in URL parameters
  useEffect(() => {
    const donation = searchParams.get("donation");
    if (donation) {
      setDonationStatus(donation);
      // Clear the URL parameter after showing the message
      const url = new URL(window.location.href);
      url.searchParams.delete("donation");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: fundraiser?.title,
          text: fundraiser?.summary,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto pt-8 px-4">
          <div className="bg-card border border-border rounded-lg shadow-sm p-6">
            <div className="text-center py-8">
              <h1 className="text-2xl font-bold text-destructive mb-2">
                Fundraiser Not Found
              </h1>
              <p className="text-muted-foreground mb-4">
                The fundraiser you&apos;re looking for doesn&apos;t exist or is
                no longer available.
              </p>
              <Link href="/">
                <Button variant="outline">Go Back Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <SkeletonLoader variant="card" />;
  }

  if (!fundraiser) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto pt-8 px-4">
          <div className="bg-card border border-border rounded-lg shadow-sm p-6">
            <div className="text-center py-8">
              <h1 className="text-2xl font-bold mb-2">Fundraiser Not Found</h1>
              <p className="text-muted-foreground mb-4">
                The fundraiser you&apos;re looking for doesn&apos;t exist or is
                no longer available.
              </p>
              <Link href="/">
                <Button variant="outline">Go Back Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto pt-8 px-4">
        {/* Donation Status Notification */}
        {donationStatus && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              donationStatus === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-yellow-50 border-yellow-200 text-yellow-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              <span className="font-medium">
                {donationStatus === "success"
                  ? "Thank you for your donation!"
                  : "Your donation was cancelled."}
              </span>
            </div>
            <p className="text-sm mt-1">
              {donationStatus === "success"
                ? "Your support makes a real difference!"
                : "No worries, you can donate anytime."}
            </p>
          </div>
        )}

        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          {/* Cover Image */}
          <div className="h-64 bg-muted relative">
            <img
              src={fundraiser.cover?.eagerUrl}
              alt={fundraiser.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-4 left-6 right-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-black/70 text-white px-2 py-1 rounded text-xs">
                  {formatCategory(fundraiser.category)}
                </span>
                <span className="bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Public
                </span>
                <span className="bg-black/70 text-white px-2 py-1 rounded text-xs capitalize">
                  {fundraiser.status}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {fundraiser.title}
                  </h1>
                  <p className="text-lg text-muted-foreground mb-4">
                    {fundraiser.summary}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                      <Users className="h-4 w-4" />
                      <span>
                        {fundraiser.ownerType === "group"
                          ? "Group"
                          : "Personal"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    About this fundraiser
                  </h2>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                      {fundraiser.description}
                    </p>
                  </div>
                </div>

                {/* Milestones Timeline */}
                <div className="mt-12">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Milestones</h2>
                    <Link
                      href={`/fundraisers/${fundraiser.slug}/milestones`}
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      See Milestone Journey →
                    </Link>
                  </div>
                  <PublicTimelineMilestoneList
                    milestones={fundraiser.milestones}
                  />
                </div>

                {/* Gallery */}
                {fundraiser.galleryUrls.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Gallery</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {fundraiser.galleryUrls.map((url, index) => (
                        <div
                          key={index}
                          className="aspect-square bg-muted rounded-lg overflow-hidden"
                        >
                          <img
                            src={url}
                            alt={`Gallery image ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Goal Progress */}
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Fundraising Goal</h3>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {formatCurrency(
                          fundraiser.goalAmount,
                          fundraiser.currency
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">goal</div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full"
                        style={{
                          width: `${
                            fundraiser.progress?.progressPercentage || 0
                          }%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>
                        {formatCurrency(
                          fundraiser.progress?.totalRaised || "0",
                          fundraiser.currency
                        )}{" "}
                        raised
                      </span>
                      <span>
                        {Math.round(
                          fundraiser.progress?.progressPercentage || 0
                        )}
                        % of goal
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setIsDonationDialogOpen(true)}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Donate Now
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>

                {/* Call to Action */}
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-primary">
                    Want to start your own fundraiser?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Create your own fundraiser and start raising money for
                    causes you care about.
                  </p>

                  <SignedIn>
                    <Link href="/app/dashboard">
                      <Button variant="outline" size="sm" className="w-full">
                        Start Fundraising
                      </Button>
                    </Link>
                  </SignedIn>
                  <SignedOut>
                    <Link href="/signin">
                      <Button variant="outline" size="sm" className="w-full">
                        Start Fundraising
                      </Button>
                    </Link>
                  </SignedOut>
                </div>

                {/* Details */}
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <span>{formatCategory(fundraiser.category)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>{formatDate(fundraiser.createdAt)}</span>
                    </div>
                    {fundraiser.endDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">End Date</span>
                        <span>{formatDate(fundraiser.endDate)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Visibility</span>
                      <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        <span>Public</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-8 mb-8 text-center">
          <div className="bg-muted/50 border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">
              Inspired by this fundraiser?
            </h3>
            <p className="text-muted-foreground mb-4">
              Join thousands of people who are making a difference by starting
              their own fundraisers.
            </p>
            <Link href="/app/fundraisers/create">
              <Button>Create Your Fundraiser</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Donation Dialog */}
      {fundraiser && (
        <DonationDialog
          fundraiser={{
            id: fundraiser.id,
            slug: fundraiser.slug,
            title: fundraiser.title,
            currency: fundraiser.currency,
          }}
          isOpen={isDonationDialogOpen}
          onClose={() => setIsDonationDialogOpen(false)}
        />
      )}
    </div>
  );
}
