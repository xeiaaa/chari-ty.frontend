"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { useState, useRef, useEffect } from "react";

interface Fundraiser {
  id: string;
  category: string;
}

interface FundraisersResponse {
  items: Fundraiser[];
  meta: {
    total: number;
  };
}

// Categories from fundraisers page with proper mapping
const categories = [
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

const getCategoryName = (category: string) => {
  switch (category) {
    case "education":
      return "Education & Learning";
    case "health":
      return "Medical & Healing";
    case "disaster_relief":
      return "Disaster Relief";
    case "environment":
      return "Environment";
    case "animals":
      return "Animals & Pets";
    case "children":
      return "Children";
    case "community":
      return "Community";
    case "arts":
      return "Arts & Creative";
    case "sports":
      return "Sports";
    case "food":
      return "Food & Nutrition";
    case "housing":
      return "Housing";
    case "technology":
      return "Technology";
    case "other":
      return "Other Funding";
    default:
      return category;
  }
};

export function CategoryCards() {
  const api = useApi();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const { data, isLoading } = useQuery<FundraisersResponse>({
    queryKey: ["public-fundraisers"],
    queryFn: async () => {
      const response = await api.get("/public/fundraisers");
      return response.data;
    },
  });

  // Calculate campaign counts for each category
  const getCategoryCount = (categoryId: string) => {
    if (!data?.items) return 0;
    return data.items.filter((fundraiser) => fundraiser.category === categoryId)
      .length;
  };

  // Auto-scroll functionality
  useEffect(() => {
    if (!scrollContainerRef.current || isHovered || isDragging) return;

    const scrollContainer = scrollContainerRef.current;
    const scrollWidth = scrollContainer.scrollWidth;
    const clientWidth = scrollContainer.clientWidth;
    const maxScroll = scrollWidth - clientWidth;

    const autoScroll = () => {
      if (scrollContainer.scrollLeft >= maxScroll) {
        scrollContainer.scrollLeft = 0;
      } else {
        scrollContainer.scrollLeft += 1;
      }
    };

    const interval = setInterval(autoScroll, 30);
    return () => clearInterval(interval);
  }, [isHovered, isDragging]);

  // Mouse event handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2; // Scroll speed multiplier
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeaveContainer = () => {
    setIsHovered(false);
    setIsDragging(false);
  };

  return (
    <section className="w-full py-16 bg-gray-50/30">
      <div className="w-full px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              Fundraising Categories
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Discover causes that matter to you across various categories
            </p>
          </div>

          <div
            className="relative overflow-hidden"
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeaveContainer}
            onMouseEnter={handleMouseEnter}
          >
            <div className="flex gap-6 w-max py-2">
              {/* First set of categories */}
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/fundraisers?category=${category}`}
                  className={`bg-gradient-to-br ${getCategoryTheme(
                    category
                  )} rounded-xl p-6 shadow-lg border border-gray-100 min-w-[200px] text-center hover:shadow-xl transition-all duration-300 hover:scale-105 select-none flex-shrink-0`}
                  draggable={false}
                  onClick={(e) => {
                    if (isDragging) {
                      e.preventDefault();
                    }
                  }}
                >
                  <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <span className="text-2xl">
                      {getCategoryEmoji(category)}
                    </span>
                  </div>
                  <h3 className="font-bold text-white mb-2 drop-shadow-sm">
                    {getCategoryName(category)}
                  </h3>
                  <p className="text-sm text-white/90 drop-shadow-sm">
                    {isLoading
                      ? "..."
                      : `${getCategoryCount(
                          category
                        ).toLocaleString()} campaigns`}
                  </p>
                </Link>
              ))}

              {/* Duplicate set for seamless loop */}
              {categories.map((category) => (
                <Link
                  key={`${category}-duplicate`}
                  href={`/fundraisers?category=${category}`}
                  className={`bg-gradient-to-br ${getCategoryTheme(
                    category
                  )} rounded-xl p-6 shadow-lg border border-gray-100 min-w-[200px] text-center hover:shadow-xl transition-all duration-300 hover:scale-105  select-none flex-shrink-0`}
                  draggable={false}
                  onClick={(e) => {
                    if (isDragging) {
                      e.preventDefault();
                    }
                  }}
                >
                  <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <span className="text-2xl">
                      {getCategoryEmoji(category)}
                    </span>
                  </div>
                  <h3 className="font-bold text-white mb-2 drop-shadow-sm">
                    {getCategoryName(category)}
                  </h3>
                  <p className="text-sm text-white/90 drop-shadow-sm">
                    {isLoading
                      ? "..."
                      : `${getCategoryCount(
                          category
                        ).toLocaleString()} campaigns`}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
