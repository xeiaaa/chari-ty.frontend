"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { api } from "@/lib/utils";
import {
  Calendar,
  Globe,
  Users,
  Share2,
  Building2,
  CheckCircle,
} from "lucide-react";

interface GroupFundraiser {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  goalAmount: string;
  currency: string;
  endDate?: string;
  coverUrl: string;
  createdAt: string;
}

interface Group {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: "team" | "nonprofit";
  avatarUrl?: string;
  website?: string;
  verified: boolean;
  createdAt: string;
  fundraisers: GroupFundraiser[];
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
        <div className="max-w-4xl mx-auto px-4 py-8">
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
      <div className="max-w-4xl mx-auto px-4 py-8">
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
      </div>
    </div>
  );
}
