"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import Link from "next/link";

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
  };
}

interface RecentFundraisersProps {
  limit?: number;
}

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

export const RecentFundraisers = ({ limit = 3 }: RecentFundraisersProps) => {
  const api = useApi();

  const {
    data: fundraisers,
    isLoading,
    error,
  } = useQuery<{ items: Fundraiser[] }>({
    queryKey: ["recent-fundraisers", limit],
    queryFn: async () => {
      const response = await api.get(
        `/public/fundraisers?limit=${limit}&sortBy=createdAt&sortOrder=desc`
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  console.log({ fundraisers });

  if (isLoading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="w-full px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Recent Fundraisers
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover inspiring causes and make a difference in communities
                around the world
              </p>
            </div>
            <div className="relative">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full relative"
              >
                <CarouselContent className="py-4">
                  {Array.from({ length: limit }).map((_, index) => (
                    <CarouselItem
                      key={index}
                      className="basis-full sm:basis-1/2 lg:basis-1/3"
                    >
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <Skeleton className="aspect-[4/3] w-full" />
                        <div className="p-4">
                          <div className="space-y-3 mb-4">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                          </div>
                          <div className="space-y-3">
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
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2" />
                <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2" />
              </Carousel>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !fundraisers?.items || fundraisers.items.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="w-full px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Recent Fundraisers
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                No fundraisers available at the moment. Check back soon!
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50 w-full">
      <div className="w-full px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Recent Fundraisers
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover inspiring causes and make a difference in communities
              around the world
            </p>
          </div>

          <div className="relative">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-4/5 md:w-full relative mx-auto"
            >
              <CarouselContent className="py-4">
                {fundraisers.items.map((fundraiser) => (
                  <CarouselItem
                    key={fundraiser.id}
                    className="basis-full sm:basis-1/2 lg:basis-1/3"
                  >
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
                              {fundraiser.category === "disaster_relief" &&
                                "🚨"}
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
                        </div>
                        {/* BUG */}
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
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute -left-12 md:-left-6 top-1/2 -translate-y-1/2" />
              <CarouselNext className="absolute -right-12 md:-right-6 top-1/2 -translate-y-1/2" />
            </Carousel>
          </div>

          {/* View All Button */}
          <div className="text-center mt-12">
            <Link href="/fundraisers">
              <Button
                size="lg"
                className="px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                View All Fundraisers
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
