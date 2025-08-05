"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useApi } from "@/lib/api";
import { Snackbar, useSnackbar } from "@/components/ui/snackbar";
import {
  MilestoneForm,
  EditMilestoneForm,
} from "@/components/fundraisers/milestone-form";
import { MilestoneList } from "@/components/fundraisers/milestone-list";
import {
  LinkForm,
  EditLinkForm,
  type Link as LinkType,
} from "@/components/fundraisers/link-form";
import { LinkList } from "@/components/fundraisers/link-list";
import { ArrowLeft, Calendar, Globe, Lock, Users } from "lucide-react";
import SkeletonLoader from "@/components/common/skeleton-loader";

export interface Fundraiser {
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
  cover?: {
    cloudinaryAssetId: string;
    createdAt: string;
    eagerUrl: string;
    format: string;
    id: string;
    originalFilename: string;
    pages: number;
    publicId: string;
    resourceType: string;
    size: number;
    updatedAt: string;
    uploadedAt: string;
    uploadedById: string;
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
  fundraiserGallery?: Array<{
    id: string;
    upload: {
      cloudinaryAssetId: string;
      publicId: string;
      url: string;
      eagerUrl?: string;
      format: string;
      resourceType: string;
      size: number;
      pages?: number;
      originalFilename: string;
      uploadedAt: string;
    };
    caption?: string;
    order: number;
  }>;
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
  const slug = params.slug as string;
  const api = useApi();
  const queryClient = useQueryClient();
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null
  );
  const [editingLink, setEditingLink] = useState<LinkType | null>(null);
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    data: fundraiser,
    isLoading,
    error,
  } = useQuery<Fundraiser>({
    queryKey: ["fundraiser", slug],
    queryFn: async () => {
      const response = await api.get(`/fundraisers/slug/${slug}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const publishMutation = useMutation({
    mutationFn: async ({ published }: { published: boolean }) => {
      const response = await api.patch(
        `/fundraisers/${fundraiser!.id}/publish`,
        {
          published,
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      const action = variables.published ? "published" : "unpublished";
      showSnackbar(`Fundraiser ${action} successfully!`, "success");
      // Refetch the fundraiser data to get updated status
      queryClient.invalidateQueries({ queryKey: ["fundraiser", slug] });
    },
    onError: (error) => {
      showSnackbar(
        error instanceof Error
          ? error.message
          : "Failed to update fundraiser status",
        "error"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/fundraisers/${fundraiser!.id}`);
    },
    onSuccess: () => {
      showSnackbar("Fundraiser deleted successfully!", "success");
      router.push("/app/fundraisers");
    },
    onError: (error) => {
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete fundraiser"
      );
    },
  });

  const handlePublishToggle = () => {
    if (!fundraiser) return;

    const isCurrentlyPublished = fundraiser.status === "published";
    const newPublishedStatus = !isCurrentlyPublished;

    publishMutation.mutate({ published: newPublishedStatus });
  };

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
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Link href="/app/fundraisers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back to Fundraisers
              </Button>
            </Link>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
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
    return <SkeletonLoader variant="list" />;
  }

  if (!fundraiser) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Link href="/app/fundraisers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back to Fundraisers
              </Button>
            </Link>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Link href="/app/fundraisers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Fundraisers
            </Button>
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Link
                    href={
                      fundraiser.status === "published"
                        ? `/fundraisers/${fundraiser.slug}`
                        : "#"
                    }
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={fundraiser.status !== "published"}
                      className={
                        fundraiser.status !== "published"
                          ? "cursor-not-allowed"
                          : ""
                      }
                      onClick={
                        fundraiser.status !== "published"
                          ? (e) => e.preventDefault()
                          : undefined
                      }
                    >
                      View Public Page
                    </Button>
                  </Link>
                </span>
              </TooltipTrigger>
              {fundraiser.status !== "published" && (
                <TooltipContent side="top">
                  Fundraiser must be published to view the public page
                </TooltipContent>
              )}
            </Tooltip>
            <Link href={`/app/fundraisers/${slug}/edit`}>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setDeleteDialogOpen(true);
                      setDeleteInput("");
                      setDeleteError(null);
                    }}
                    disabled={
                      fundraiser.status === "published" ||
                      (fundraiser.progress?.donationCount ?? 0) > 0
                    }
                    style={{ pointerEvents: "auto" }}
                    className={
                      fundraiser.status === "published" ||
                      (fundraiser.progress?.donationCount ?? 0) > 0
                        ? "cursor-not-allowed"
                        : ""
                    }
                  >
                    Delete
                  </Button>
                </span>
              </TooltipTrigger>
              {((fundraiser.progress?.donationCount ?? 0) > 0 ||
                fundraiser.status === "published") && (
                <TooltipContent side="top">
                  {fundraiser.status === "published"
                    ? "You can only delete an unpublished fundraiser."
                    : "You cannot delete a fundraiser that has received donations."}
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>
        <div className="mt-4">
          <h1 className="text-3xl font-bold mb-1">{fundraiser.title}</h1>
          <p className="text-muted-foreground">{fundraiser.summary}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Cover Image */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
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
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
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

              <div>
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">
                    {fundraiser.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div className="bg-card border border-border rounded-lg shadow-sm p-6">
              {editingMilestone ? (
                <EditMilestoneForm
                  slug={slug}
                  milestone={editingMilestone}
                  onSuccess={() => {
                    showSnackbar("Milestone updated successfully!", "success");
                    setEditingMilestone(null);
                  }}
                  onError={(error) => showSnackbar(error, "error")}
                  onCancel={() => setEditingMilestone(null)}
                />
              ) : (
                <MilestoneForm
                  fundraiserId={fundraiser.id}
                  onSuccess={() =>
                    showSnackbar("Milestone created successfully!", "success")
                  }
                  onError={(error) => showSnackbar(error, "error")}
                />
              )}
              <MilestoneList
                fundraiserId={fundraiser.id}
                currency={fundraiser.currency}
                onEditMilestone={setEditingMilestone}
              />
            </div>

            {/* Links */}
            <div className="bg-card border border-border rounded-lg shadow-sm p-6">
              {editingLink ? (
                <EditLinkForm
                  fundraiserId={fundraiser.id}
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
                  fundraiserId={fundraiser.id}
                  onSuccess={() =>
                    showSnackbar("Link created successfully!", "success")
                  }
                  onError={(error) => showSnackbar(error, "error")}
                />
              )}
              <LinkList onEditLink={setEditingLink} fundraiser={fundraiser} />
            </div>

            {/* Gallery */}
            {fundraiser.galleryUrls.length > 0 && (
              <div className="bg-card border border-border rounded-lg shadow-sm p-6">
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
            <div className="bg-card border border-border rounded-lg shadow-sm p-6">
              <h3 className="font-semibold mb-4">Fundraising Goal</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Goal</span>
                  <span className="font-semibold">
                    {formatCurrency(fundraiser.goalAmount, fundraiser.currency)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full"
                    style={{
                      width: `${fundraiser.progress?.progressPercentage || 0}%`,
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
                    ).toString()}
                    % of goal
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-card border border-border rounded-lg shadow-sm p-6">
              <div className="space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePublishToggle}
                  disabled={publishMutation.isPending}
                >
                  {publishMutation.isPending
                    ? "Updating..."
                    : fundraiser?.status === "published"
                    ? "Unpublish"
                    : "Publish"}
                </Button>
              </div>
            </div>

            {/* Details */}
            <div className="bg-card border border-border rounded-lg shadow-sm p-6">
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

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        onClose={hideSnackbar}
        message={snackbar.message}
        type={snackbar.type}
      />
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent showCloseButton={!deleteMutation.isPending}>
          <DialogHeader>
            <DialogTitle>Delete Fundraiser</DialogTitle>
            <div className="text-muted-foreground text-sm">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={fundraiser.coverUrl}
                  alt={fundraiser.title}
                  className="w-20 h-20 object-cover rounded border border-border bg-muted"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <div>
                  <div className="font-semibold text-lg">
                    {fundraiser.title}
                  </div>
                  <div className="text-muted-foreground text-sm mt-1">
                    {fundraiser.summary}
                  </div>
                </div>
              </div>
              <div>
                This action{" "}
                <span className="font-semibold text-destructive">
                  cannot be undone
                </span>
                .<br />
                This will permanently delete the fundraiser{" "}
                <span className="font-semibold">{fundraiser.title}</span> and
                all its data.
                <br />
                Please type{" "}
                <span className="font-semibold">{fundraiser.title}</span> to
                confirm.
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="delete-confirm-input">Fundraiser Title</Label>
            <Input
              id="delete-confirm-input"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              disabled={deleteMutation.isPending}
              autoFocus
              placeholder={fundraiser.title}
              aria-invalid={deleteError ? true : undefined}
            />
            {deleteError && (
              <div className="text-destructive text-sm">{deleteError}</div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={
                deleteInput !== fundraiser.title || deleteMutation.isPending
              }
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
