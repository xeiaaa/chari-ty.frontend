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
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Recent Fundraisers
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover inspiring causes and make a difference in communities
              around the world
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: limit }).map((_, index) => (
              <div
                key={index}
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
        </div>
      </section>
    );
  }

  if (error || !fundraisers?.items || fundraisers.items.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Recent Fundraisers
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              No fundraisers available at the moment. Check back soon!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Recent Fundraisers
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover inspiring causes and make a difference in communities
            around the world
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full pl-4 relative"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {fundraisers.items.map((fundraiser) => (
                <CarouselItem
                  key={fundraiser.id}
                  className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3"
                >
                  <div className="bg-muted/50 border border-border rounded-lg overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-300 group">
                    <div className="h-48 bg-muted relative overflow-hidden">
                      {fundraiser.cover?.eagerUrl ? (
                        <img
                          src={fundraiser.cover.eagerUrl}
                          alt={fundraiser.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
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
                      {/* Category overlay */}
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-[10px] font-medium">
                        {fundraiser.category.replace("_", " ").toUpperCase()}
                      </div>
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
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {fundraiser.summary}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Goal</span>
                          <span className="text-sm font-semibold">
                            {formatCurrency(
                              fundraiser.goalAmount,
                              fundraiser.currency
                            )}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${fundraiser.progress.progressPercentage}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>
                            {formatCurrency(
                              fundraiser.progress.totalRaised,
                              fundraiser.currency
                            )}{" "}
                            raised
                          </span>
                          <span className="capitalize">
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
                            className="w-full"
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
            <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2" />
            <CarouselNext className="absolute right-8 top-1/2 -translate-y-1/2" />
          </Carousel>
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link href="/fundraisers">
            <Button size="lg" className="px-8">
              View All Fundraisers
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
