"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

import { useApi } from "@/lib/api";
import { Snackbar, useSnackbar } from "@/components/ui/snackbar";
import {
  MilestoneForm,
  EditMilestoneForm,
} from "@/components/ui/milestone-form";
import { MilestoneList } from "@/components/ui/milestone-list";
import {
  LinkForm,
  EditLinkForm,
  type Link as LinkType,
} from "@/components/ui/link-form";
import { LinkList } from "@/components/ui/link-list";
import { ArrowLeft, Calendar, Globe, Lock, Users } from "lucide-react";

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
}

interface Milestone {
  id: string;
  fundraiserId: string;
  stepNumber: number;
  amount: string;
  title: string;
  purpose: string;
  achieved: boolean;
  achievedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function FundraiserDetailPage() {
  const params = useParams();
  const fundraiserId = params.fundraiserId as string;
  const api = useApi();
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null
  );
  const [editingLink, setEditingLink] = useState<LinkType | null>(null);

  const {
    data: fundraiser,
    isLoading,
    error,
  } = useQuery<Fundraiser>({
    queryKey: ["fundraiser", fundraiserId],
    queryFn: async () => {
      const response = await api.get(`/fundraisers/${fundraiserId}`);
      return response.data;
    },
  });

  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCategory = (category: string) => {
    return category.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/app/fundraisers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back to Fundraisers
              </Button>
            </Link>
          </div>
          <div className="text-center py-8">
            <p className="text-destructive text-lg">
              Failed to load fundraiser
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/app/fundraisers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back to Fundraisers
              </Button>
            </Link>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!fundraiser) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/app/fundraisers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back to Fundraisers
              </Button>
            </Link>
          </div>
          <div className="text-center py-8">
            <p className="text-lg">Fundraiser not found</p>
            <p className="text-sm text-muted-foreground mt-2">
              The fundraiser you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have access to it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/app/fundraisers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back to Fundraisers
              </Button>
            </Link>
            <div className="flex items-center gap-2 ml-auto">
              <Link href={`/fundraisers/${fundraiser.slug}`}>
                <Button variant="ghost" size="sm">
                  View Public Page
                </Button>
              </Link>
              <Link href={`/app/fundraisers/${fundraiser.id}/edit`}>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Cover Image */}
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
              {!fundraiser.isPublic && (
                <span className="bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Private
                </span>
              )}
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
                <h1 className="text-3xl font-bold mb-2">{fundraiser.title}</h1>
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
                    {fundraiser.ownerType === "group" ? (
                      <Users className="h-4 w-4" />
                    ) : (
                      <Users className="h-4 w-4" />
                    )}
                    <span>
                      {fundraiser.ownerType === "group" ? "Group" : "Personal"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">
                    {fundraiser.description}
                  </p>
                </div>
              </div>

              {/* Milestones */}
              <div>
                {editingMilestone ? (
                  <EditMilestoneForm
                    fundraiserId={fundraiserId}
                    milestone={editingMilestone}
                    onSuccess={() => {
                      showSnackbar(
                        "Milestone updated successfully!",
                        "success"
                      );
                      setEditingMilestone(null);
                    }}
                    onError={(error) => showSnackbar(error, "error")}
                    onCancel={() => setEditingMilestone(null)}
                  />
                ) : (
                  <MilestoneForm
                    fundraiserId={fundraiserId}
                    onSuccess={() =>
                      showSnackbar("Milestone created successfully!", "success")
                    }
                    onError={(error) => showSnackbar(error, "error")}
                  />
                )}
                <MilestoneList
                  fundraiserId={fundraiserId}
                  currency={fundraiser.currency}
                  onEditMilestone={setEditingMilestone}
                />
              </div>

              {/* Links */}
              <div className="mt-12">
                {editingLink ? (
                  <EditLinkForm
                    fundraiserId={fundraiserId}
                    link={editingLink}
                    onSuccess={() => {
                      showSnackbar("Link updated successfully!", "success");
                      setEditingLink(null);
                    }}
                    onError={(error) => showSnackbar(error, "error")}
                    onCancel={() => setEditingLink(null)}
                  />
                ) : (
                  <LinkForm
                    fundraiserId={fundraiserId}
                    onSuccess={() =>
                      showSnackbar("Link created successfully!", "success")
                    }
                    onError={(error) => showSnackbar(error, "error")}
                  />
                )}
                <LinkList
                  fundraiserId={fundraiserId}
                  onEditLink={setEditingLink}
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
                          className="w-full h-full object-cover"
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
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Goal</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        fundraiser.goalAmount,
                        fundraiser.currency
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full"
                      style={{ width: "0%" }} // TODO: Calculate actual progress when donations are implemented
                    />
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>$0 raised</span>
                    <span>0% of goal</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button className="w-full" size="lg">
                  Donate Now
                </Button>
                <Button variant="outline" className="w-full">
                  Share
                </Button>
              </div>

              {/* Details */}
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <h3 className="font-semibold mb-4">Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="capitalize">{fundraiser.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Visibility</span>
                    <div className="flex items-center gap-1">
                      {fundraiser.isPublic ? (
                        <Globe className="h-3 w-3" />
                      ) : (
                        <Lock className="h-3 w-3" />
                      )}
                      <span>{fundraiser.isPublic ? "Public" : "Private"}</span>
                    </div>
                  </div>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        onClose={hideSnackbar}
        message={snackbar.message}
        type={snackbar.type}
      />
    </div>
  );
}
