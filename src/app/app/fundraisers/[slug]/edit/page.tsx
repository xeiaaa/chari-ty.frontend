"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Snackbar, useSnackbar } from "@/components/ui/snackbar";
import { ArrowLeft } from "lucide-react";
import { useApi, getErrorMessage } from "@/lib/api";

import { Fundraiser } from "../page";
import {
  MilestoneForm,
  EditMilestoneForm,
} from "@/components/fundraisers/milestone-form";
import {
  MilestoneList,
  Milestone,
} from "@/components/fundraisers/milestone-list";
import {
  LinkForm,
  EditLinkForm,
  Link as LinkType,
} from "@/components/fundraisers/link-form";
import { LinkList } from "@/components/fundraisers/link-list";
import {
  FundraiserForm,
  FundraiserFormData,
} from "@/components/fundraisers/FundraiserForm";
import { GalleryForm } from "@/components/fundraisers/gallery-form";
import SkeletonLoader from "@/components/common/skeleton-loader";

export default function EditFundraiserPage() {
  const { slug } = useParams() as { slug: string };
  const api = useApi();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  // State for editing milestones and links
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null
  );
  const [editingLink, setEditingLink] = useState<LinkType | null>(null);

  // Fetch existing fundraiser
  const {
    data: fundraiser,
    isLoading: isLoadingFundraiser,
    error: fetchError,
  } = useQuery<Fundraiser>({
    queryKey: ["fundraiser", slug],
    queryFn: async () => {
      const response = await api.get(`/fundraisers/slug/${slug}`);
      return response.data;
    },
  });

  // Update fundraiser mutation
  const updateFundraiserMutation = useMutation({
    mutationFn: async (data: FundraiserFormData) => {
      const payload = {
        ...data,
        endDate: data.endDate || undefined,
        removeCover: data.removeCover || undefined,
      };
      const response = await api.patch(
        `/fundraisers/${fundraiser!.id}`,
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fundraisers"] });
      queryClient.invalidateQueries({ queryKey: ["fundraiser", slug] });
      showSnackbar("Fundraiser updated successfully!", "success");
      setTimeout(() => router.push(`/app/fundraisers/${slug}`), 1500);
    },
    onError: (err) => {
      const message = getErrorMessage(err);
      setError(message);
      showSnackbar(message, "error");
    },
  });

  if (fetchError) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/app/fundraisers/${slug}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back to Fundraiser
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
              {fetchError instanceof Error
                ? fetchError.message
                : "Unknown error"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingFundraiser) {
    return <SkeletonLoader variant="list" />;
  }

  if (!fundraiser) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/app/fundraisers/${slug}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back to Fundraiser
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

  // Default values for FundraiserForm
  const defaultValues: FundraiserFormData = {
    title: fundraiser.title,
    summary: fundraiser.summary,
    description: fundraiser.description,
    category: fundraiser.category,
    goalAmount: parseFloat(fundraiser.goalAmount),
    currency: fundraiser.currency,
    endDate: fundraiser.endDate
      ? new Date(fundraiser.endDate).toISOString().split("T")[0]
      : "",
    coverPublicId: fundraiser.cover?.publicId || "",
    removeCover: false,
    isPublic: fundraiser.isPublic,
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/app/fundraisers/${slug}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Fundraiser
            </Button>
          </Link>
        </div>
        <div className="mt-4">
          <h1 className="text-3xl font-bold mb-1">Edit {fundraiser.title}</h1>
          <p className="text-muted-foreground">
            Update your fundraiser information
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* FundraiserForm */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <FundraiserForm
            defaultValues={defaultValues}
            onSubmit={(data) => updateFundraiserMutation.mutate(data)}
            submitLabel="Update Fundraiser"
            loading={updateFundraiserMutation.isPending}
            error={error}
            existingCoverUrl={fundraiser.cover?.eagerUrl || fundraiser.coverUrl}
          />
        </div>

        {/* Gallery Section */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <GalleryForm
            fundraiserId={fundraiser.id}
            slug={slug}
            existingGallery={fundraiser.fundraiserGallery}
            onSuccess={() =>
              showSnackbar("Gallery updated successfully!", "success")
            }
            onError={(err) => showSnackbar(err, "error")}
          />
        </div>

        {/* Milestones Section */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          {editingMilestone ? (
            <EditMilestoneForm
              slug={slug}
              milestone={editingMilestone}
              onSuccess={() => {
                showSnackbar("Milestone updated successfully!", "success");
                setEditingMilestone(null);
              }}
              onError={(err) => showSnackbar(err, "error")}
              onCancel={() => setEditingMilestone(null)}
            />
          ) : (
            <MilestoneForm
              fundraiserId={fundraiser.id}
              onSuccess={() => showSnackbar("Milestone created!", "success")}
              onError={(err) => showSnackbar(err, "error")}
            />
          )}
          <MilestoneList
            fundraiserId={fundraiser.id}
            currency={fundraiser.currency}
            onEditMilestone={setEditingMilestone}
          />
        </div>

        {/* Links Section */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          {editingLink ? (
            <EditLinkForm
              fundraiserId={fundraiser.id}
              link={editingLink}
              onSuccess={() => {
                showSnackbar("Link updated successfully!", "success");
                setEditingLink(null);
              }}
              onError={(err) => showSnackbar(err, "error")}
              onCancel={() => setEditingLink(null)}
            />
          ) : (
            <LinkForm
              fundraiserId={fundraiser.id}
              onSuccess={() => showSnackbar("Link created!", "success")}
              onError={(err) => showSnackbar(err, "error")}
            />
          )}
          <LinkList fundraiser={fundraiser} onEditLink={setEditingLink} />
        </div>
      </div>

      <Snackbar
        open={snackbar.open}
        onClose={hideSnackbar}
        message={snackbar.message}
        type={snackbar.type}
      />
    </div>
  );
}
