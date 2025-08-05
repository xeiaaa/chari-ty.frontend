"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../ui/button";
import { FormField } from "../ui/form-field";
import { Skeleton } from "../ui/skeleton";
import { useApi } from "@/lib/api";
import { Target, CheckCircle, Plus, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Snackbar, useSnackbar } from "../ui/snackbar";
import { GalleryUpload, UploadType } from "@/components/ui/gallery-upload";

// Schema for milestone completion form
const completeMilestoneSchema = z.object({
  completionDetails: z
    .string()
    .min(1, "Completion details are required")
    .max(1000, "Completion details must be less than 1000 characters"),
});

type CompleteMilestoneForm = z.infer<typeof completeMilestoneSchema>;

interface CloudinaryAsset {
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
}

interface MilestoneUpload {
  id: string;
  upload: CloudinaryAsset;
  caption?: string;
  order: number;
}

export interface Milestone {
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
  completionDetails?: string;
  milestoneUploads?: MilestoneUpload[];
}

interface MilestoneListProps {
  fundraiserId: string;
  currency: string;
  onAddMilestone?: () => void;
  onEditMilestone?: (milestone: Milestone) => void;
  onDeleteMilestone?: (milestone: Milestone) => void;
}

export function MilestoneList({
  fundraiserId,
  currency,
  onAddMilestone,
  onEditMilestone,
}: MilestoneListProps) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Milestone | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completingMilestone, setCompletingMilestone] =
    useState<Milestone | null>(null);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  const completionForm = useForm<CompleteMilestoneForm>({
    resolver: zodResolver(completeMilestoneSchema),
    defaultValues: {
      completionDetails: "",
    },
  });

  const { data: milestones, isLoading: isLoadingMilestones } = useQuery<
    Milestone[]
  >({
    queryKey: ["milestones", fundraiserId],
    queryFn: async () => {
      const response = await api.get(`/fundraisers/${fundraiserId}/milestones`);
      return response.data;
    },
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: async (milestone: Milestone) => {
      await api.delete(
        `/fundraisers/${fundraiserId}/milestones/${milestone.id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", fundraiserId] });
      setDeleteTarget(null);
      setConfirmOpen(false);
      showSnackbar("Milestone deleted successfully!", "success");
    },
    onError: (error) => {
      showSnackbar(
        error instanceof Error ? error.message : "Failed to delete milestone",
        "error"
      );
    },
  });

  const completeMilestoneMutation = useMutation({
    mutationFn: async (data: {
      milestoneId: string;
      completionDetails: string;
    }) => {
      const response = await api.patch(
        `/fundraisers/${fundraiserId}/milestones/${data.milestoneId}/complete`,
        {
          completionDetails: data.completionDetails,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", fundraiserId] });
      setCompletingMilestone(null);
      setCompletionDialogOpen(false);
      completionForm.reset();
      showSnackbar("Completion details saved successfully!", "success");
    },
    onError: (error) => {
      showSnackbar(
        error instanceof Error
          ? error.message
          : "Failed to save completion details",
        "error"
      );
    },
  });

  const handleCompleteMilestone = (data: CompleteMilestoneForm) => {
    if (!completingMilestone) return;

    completeMilestoneMutation.mutate({
      milestoneId: completingMilestone.id,
      completionDetails: data.completionDetails,
    });
  };

  const openCompletionDialog = (milestone: Milestone) => {
    setCompletingMilestone(milestone);
    setCompletionDialogOpen(true);
    completionForm.reset({
      completionDetails: milestone.completionDetails || "",
    });
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
      month: "short",
      day: "numeric",
    });
  };

  if (isLoadingMilestones) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-muted/50 border border-border rounded-lg p-4"
          >
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!milestones || milestones.length === 0) {
    return (
      <div className="text-center py-8 bg-muted/50 border border-border rounded-lg">
        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No milestones yet</h3>
        <p className="text-muted-foreground mb-4">
          Add milestones to track your fundraising progress and goals.
        </p>
        {onAddMilestone && (
          <Button variant="outline" onClick={onAddMilestone}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Milestone
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {milestones.map((milestone) => (
        <div
          key={milestone.id}
          className={`border rounded-lg p-4 ${
            milestone.achieved
              ? "bg-green-50 border-green-200"
              : "bg-muted/50 border-border"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  milestone.achieved
                    ? "bg-green-100 text-green-600"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {milestone.achieved ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Target className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{milestone.title}</h3>
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    Step {milestone.stepNumber}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {milestone.purpose}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium">
                    {formatCurrency(milestone.amount, currency)}
                  </span>
                  {milestone.achieved && milestone.achievedAt && (
                    <span className="text-green-600">
                      Achieved {formatDate(milestone.achievedAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex items-center gap-2 ml-4">
              {milestone.achieved ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCompletionDialog(milestone)}
                    className="h-8 px-3 text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    Add Details
                  </Button>
                </>
              ) : (
                <>
                  {onEditMilestone && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditMilestone(milestone)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeleteTarget(milestone);
                      setConfirmOpen(true);
                    }}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    disabled={
                      deleteMilestoneMutation.isPending &&
                      deleteTarget?.id === milestone.id
                    }
                  >
                    {deleteMilestoneMutation.isPending &&
                    deleteTarget?.id === milestone.id ? (
                      <span className="animate-spin h-4 w-4 block border-2 border-destructive border-t-transparent rounded-full" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Completion Dialog */}
      <Dialog
        open={completionDialogOpen}
        onOpenChange={(open) => {
          setCompletionDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add Completion Details</DialogTitle>
            <DialogDescription>
              Add details about how you completed &ldquo;
              {completingMilestone?.title}&rdquo; and upload proof (images) of
              your work.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={completionForm.handleSubmit(handleCompleteMilestone)}
            className="space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]"
          >
            <FormField<CompleteMilestoneForm>
              label="Completion Details"
              register={completionForm.register}
              name="completionDetails"
              textarea
              placeholder="Describe how you completed this milestone. What did you do? What items did you purchase? Any challenges you faced?"
              error={completionForm.formState.errors.completionDetails?.message}
              rows={4}
            />

            {/* Proof Uploads */}
            {completingMilestone && (
              <div className="space-y-4">
                <label className="block text-sm font-medium">
                  Upload Proof (Images)
                </label>
                <GalleryUpload
                  type={UploadType.MILESTONE_PROOF}
                  entityId={completingMilestone.id}
                  existingItems={completingMilestone.milestoneUploads?.map(
                    (upload) => ({
                      id: upload.id,
                      asset: upload.upload,
                      caption: upload.caption,
                      order: upload.order,
                    })
                  )}
                  uploadEndpoint={`/milestones/${completingMilestone.id}/uploads`}
                  updateEndpoint={`/milestones/${completingMilestone.id}/uploads/{id}`}
                  deleteEndpoint={`/milestones/${completingMilestone.id}/uploads/{id}`}
                  reorderEndpoint={`/milestones/${completingMilestone.id}/uploads/reorder`}
                  queryKeys={["milestones", fundraiserId]}
                  showDragDrop={true}
                  showCaptions={true}
                  showReorder={true}
                  title="Proof Uploads"
                  description="Upload images as proof of your milestone completion."
                />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCompletionDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={completeMilestoneMutation.isPending}
              >
                {completeMilestoneMutation.isPending
                  ? "Saving..."
                  : "Save Details"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete Milestone</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the milestone{" "}
              <span className="font-semibold">{deleteTarget?.title}</span>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteTarget && deleteMilestoneMutation.mutate(deleteTarget)
              }
              disabled={deleteMilestoneMutation.isPending}
            >
              {deleteMilestoneMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
