"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/api";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  cover?: {
    eagerUrl: string;
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

interface FundraisersResponse {
  items: Fundraiser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const categories = [
  "All",
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
  "other",
];

const statusOptions = ["All", "pending", "in_progress", "completed"];

const getCategoryTheme = (category: string) => {
  switch (category) {
    case "education":
      return "from-blue-500 to-indigo-600";
    case "health":
      return "from-red-500 to-pink-600";
    case "disaster_relief":
      return "from-orange-500 to-red-600";
    case "environment":
      return "from-green-500 to-emerald-600";
    case "animals":
      return "from-purple-500 to-violet-600";
    case "children":
      return "from-pink-500 to-rose-600";
    case "community":
      return "from-teal-500 to-cyan-600";
    case "arts":
      return "from-yellow-500 to-orange-600";
    case "sports":
      return "from-blue-500 to-cyan-600";
    case "food":
      return "from-orange-500 to-yellow-600";
    case "housing":
      return "from-gray-500 to-slate-600";
    case "technology":
      return "from-indigo-500 to-purple-600";
    default:
      return "from-blue-500 to-purple-600";
  }
};

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

const TruncatedText = ({
  text,
  className,
}: {
  text: string;
  className: string;
}) => {
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        const element = textRef.current;
        setIsTruncated(element.scrollHeight > element.clientHeight);
      }
    };

    checkTruncation();
    window.addEventListener("resize", checkTruncation);
    return () => window.removeEventListener("resize", checkTruncation);
  }, [text]);

  if (!isTruncated) {
    return (
      <p ref={textRef} className={className}>
        {text}
      </p>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          <p ref={textRef} className={className}>
            {text}
          </p>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default function FundraisersPage() {
  const api = useApi();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Check for category query parameter on component mount
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam && categories.includes(categoryParam)) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

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

  const getFundraiserStatus = (fundraiser: Fundraiser) => {
    const goalAmount = parseFloat(fundraiser.goalAmount);
    const totalRaised = parseFloat(fundraiser.progress?.totalRaised || "0");

    if (goalAmount <= totalRaised) {
      return "completed";
    } else if (totalRaised > 0 && totalRaised < goalAmount) {
      return "in_progress";
    } else {
      return "pending";
    }
  };

  const filteredFundraisers =
    data?.items?.filter((fundraiser) => {
      const categoryMatch =
        selectedCategory === "All" || fundraiser.category === selectedCategory;
      const calculatedStatus = getFundraiserStatus(fundraiser);
      const statusMatch =
        selectedStatus === "All" || calculatedStatus === selectedStatus;
      return categoryMatch && statusMatch;
    }) || [];

  console.log({ data });

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-3">Support a Cause</h1>
        <p className="text-muted-foreground mt-1 italic">
          Explore a variety of fundraisers created by individuals and
          communities working to make a positive impact. Find a cause that
          speaks to you and offer your support.
        </p>
      </div>

      {/* Filters - Accordion on mobile, inline on medium screens, sidebar on large screens */}
      <div className="mb-8 md:hidden">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="filters" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 text-left">
              <span className="font-medium">Filters</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={
                        selectedCategory === category ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={`text-sm transition-all duration-200 ${
                        selectedCategory === category
                          ? category === "All"
                            ? "bg-primary hover:bg-primary/90"
                            : `bg-gradient-to-r ${getCategoryTheme(
                                category
                              )} hover:opacity-90`
                          : "hover:scale-105"
                      }`}
                    >
                      {category === "All"
                        ? "All Categories"
                        : category.replace("_", " ")}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Status
                </h3>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <Button
                      key={status}
                      variant={
                        selectedStatus === status ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedStatus(status)}
                      className="text-sm transition-all duration-200 hover:scale-105"
                    >
                      {status === "All"
                        ? "All Status"
                        : status.replace("_", " ")}
                    </Button>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Filters - Inline on medium screens only */}
      <div className="mb-8 hidden md:block lg:hidden">
        {/* Category Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Categories
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`text-sm transition-all duration-200 ${
                  selectedCategory === category
                    ? category === "All"
                      ? "bg-primary hover:bg-primary/90"
                      : `bg-gradient-to-r ${getCategoryTheme(
                          category
                        )} hover:opacity-90`
                    : "hover:scale-105"
                }`}
              >
                {category === "All"
                  ? "All Categories"
                  : category.replace("_", " ")}
              </Button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Status
          </h3>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => (
              <Button
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(status)}
                className="text-sm transition-all duration-200 hover:scale-105"
              >
                {status === "All" ? "All Status" : status.replace("_", " ")}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters - Only visible on large screens */}
        <div className="hidden lg:block lg:w-64 flex-shrink-0">
          <div className="sticky top-8 space-y-6">
            {/* Category Filter */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Categories
              </h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={
                      selectedCategory === category ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full justify-start text-sm transition-all duration-200 ${
                      selectedCategory === category
                        ? category === "All"
                          ? "bg-primary hover:bg-primary/90"
                          : `bg-gradient-to-r ${getCategoryTheme(
                              category
                            )} hover:opacity-90`
                        : "hover:scale-105"
                    }`}
                  >
                    {category === "All"
                      ? "All Categories"
                      : category.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Status
              </h3>
              <div className="space-y-2">
                {statusOptions.map((status) => (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus(status)}
                    className="w-full justify-start text-sm transition-all duration-200 hover:scale-105"
                  >
                    {status === "All" ? "All Status" : status.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fundraisers List */}
        <div className="flex-1">
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
          ) : !filteredFundraisers.length ? (
            <div className="text-center py-12">
              <div className="bg-muted/50 border border-border rounded-lg p-8">
                <h3 className="text-lg font-semibold mb-2">
                  No fundraisers found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {selectedCategory === "All"
                    ? "No fundraisers are available at the moment. Check back soon!"
                    : `No fundraisers found in the "${selectedCategory.replace(
                        "_",
                        " "
                      )}" category.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFundraisers.map((fundraiser) => (
                <div
                  key={fundraiser.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden md:hover:shadow-lg md:hover:scale-105 transition-all duration-300 group"
                >
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
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
                      <div
                        className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getCategoryTheme(
                          fundraiser.category
                        )}`}
                      >
                        <span className="text-4xl">
                          {getCategoryEmoji(fundraiser.category)}
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
                      <h3 className="font-semibold text-lg line-clamp-1 text-gray-900 md:hover:text-blue-600 transition-all duration-300">
                        {fundraiser.title}
                      </h3>
                      <TruncatedText
                        text={fundraiser.summary}
                        className="text-sm text-gray-600 line-clamp-2 leading-relaxed min-h-10 max-h-10"
                      />
                      <div className="text-xs text-gray-500">
                        group:{" "}
                        {fundraiser.group ? (
                          <Link
                            href={`/groups/${fundraiser.group.slug}`}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {fundraiser.group.name}
                          </Link>
                        ) : fundraiser.user ? (
                          <Link
                            href={`/users/${fundraiser.user.username}`}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {fundraiser.user.firstName}{" "}
                            {fundraiser.user.lastName}
                          </Link>
                        ) : (
                          "Unknown"
                        )}
                      </div>
                    </div>
                    <div className="space-y-3 mt-auto">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          Goal
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          {formatCurrency(
                            parseFloat(fundraiser.goalAmount),
                            fundraiser.currency
                          )}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              fundraiser.progress?.progressPercentage || 0
                            }%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>
                          {formatCurrency(
                            parseFloat(fundraiser.progress?.totalRaised || "0"),
                            fundraiser.currency
                          )}{" "}
                          raised
                        </span>
                        {/* <span className="capitalize">
                      {getFundraiserStatus(fundraiser)}
                    </span> */}
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

          {filteredFundraisers.length > 0 && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Showing {filteredFundraisers.length} of {data?.meta?.total ?? 0}{" "}
              fundraisers
              {selectedCategory !== "All" &&
                ` in "${selectedCategory.replace("_", " ")}" category`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
