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
  getDateParts,
} from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CheckCircle2,
  Globe,
  Link,
  Users,
  CheckCheck,
  Milestone,
  CircleDashed,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
      const response = await api.get(`/public/fundraisers/slug/${slug}`);
      return response.data;
    },
  });

  const rendeMilestoneJourney = (milestone: PublicTimelineMilestone) => (
    <div className="timeline-card w-full flex flex-row gap-4">
      <div className="flex mb-2">
        {/* Date block */}
        <div className="timeline-date-block">
          <div className="timeline-date-month">
            {getDateParts(milestone.achievedAt || milestone.createdAt).month}
          </div>
          <div className="timeline-date-day">
            {getDateParts(milestone.achievedAt || milestone.createdAt).day}
          </div>
          <div className="timeline-date-year">
            {getDateParts(milestone.achievedAt || milestone.createdAt).year}
          </div>
        </div>
      </div>
      <div className="flex-1">
        {/* Step number and achievement status */}
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-semibold text-blue-500">
            Step {milestone.stepNumber}
          </div>
          {milestone.achieved && (
            <div className="flex items-center gap-1 text-xs font-medium text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>Achieved</span>
            </div>
          )}
        </div>
        <div className="timeline-card-title">{milestone.title}</div>
        <div className="timeline-card-subtext">{milestone.purpose}</div>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-green-700 mb-1">
            ${milestone.amount}
          </div>
          {milestone.achieved && milestone.achievedAt && (
            <div className="text-xs text-muted-foreground">
              Achieved at {formatAchievedTime(milestone.achievedAt)}
            </div>
          )}
        </div>
        {milestone.achieved && (
          <div className="my-4">
            <p className="font-bold mb-2">Completion details:</p>
            <pre className="whitespace-pre-wrap">
              {milestone.completionDetails}
            </pre>
          </div>
        )}
        <div className="flex justify-center items-center relative px-12">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="relative"
          >
            <CarouselContent>
              {milestone.proofUrls.map((url) => {
                if (!url) return;
                return (
                  <CarouselItem
                    key={url}
                    className="md:basis-1/2 lg:basis-1/3 p-1 my-auto"
                  >
                    <div className="rounded-md overflow-hidden w-full">
                      <img
                        src={url}
                        alt={url}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious
              className={`${milestone.proofUrls.length < 4 && "lg:hidden"} ${
                milestone.proofUrls.length < 3 && "md:hidden"
              } ${milestone.proofUrls.length < 2 && "hidden"}`}
            />
            <CarouselNext
              className={`${milestone.proofUrls.length < 4 && "lg:hidden"} ${
                milestone.proofUrls.length < 3 && "md:hidden"
              } ${milestone.proofUrls.length < 2 && "hidden"}`}
            />
          </Carousel>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto pt-8 px-4">
          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <Skeleton className="h-64 w-full" />
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto pt-8 px-4">
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

  if (fundraiser) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto pt-8 px-4">
          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            {/* Cover Photo */}
            <div className="h-64 bg-muted relative">
              <img
                src={fundraiser.coverUrl}
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
            {/* Fundraiser content */}
            <div className="p-6">
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
              </div>
            </div>

            {/* Milestones */}
            <div className="bg-[#f9fafb] pt-4">
              <div className="px-6 flex items-center gap-6 justify-between">
                <div className="flex items-center gap-1">
                  <Milestone className="w-6 h-6" />
                  <h1 className="text-2xl font-bold ">Milestone Journey</h1>
                </div>
                <div className="gap-6 justify-center items-center p-2 sm:flex hidden">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground font-bold">
                      {
                        fundraiser.milestones.filter(
                          (milestone) => milestone.achieved
                        ).length
                      }
                    </span>
                    <CheckCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground font-bold">
                      {
                        fundraiser.milestones.filter(
                          (milestone) => !milestone.achieved
                        ).length
                      }
                    </span>
                    <CircleDashed className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Milestones */}
              <div className="timeline-root flex pt-4!">
                {/* <div className="timeline-line left-6!" /> */}
                <div className="timeline-list w-full p-2 ml-1 gap-0!">
                  {fundraiser.milestones.map((milestone, idx) => {
                    console.log({ milestone });
                    return (
                      <div
                        className={`w-full flex justify-center items-center gap-3 relative ${
                          idx + 1 !== fundraiser.milestones.length && "pb-8"
                        }`}
                        key={idx}
                      >
                        <div className="flex justify-center">
                          {milestone.achieved ? (
                            <CheckCircle2 className="rounded-full w-6 h-6 bg-white text-green-600" />
                          ) : (
                            <div
                              className="flex justify-center items-center w-6 h-6 rounded-full border-2 bg-white
                            "
                            />
                          )}
                        </div>
                        {/* Render milestone */}
                        {rendeMilestoneJourney(milestone)}
                        <div
                          className={`absolute left-3 w-[2px] -z-2 h-full top-0 ${
                            milestone.achieved ? "bg-green-600" : "bg-[#d3d3d3]"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default MilestoneJourneyPage;
