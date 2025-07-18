"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "./button";
import { Skeleton } from "./skeleton";
import { useApi } from "@/lib/api";
import { Target, CheckCircle, Plus, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./dialog";
import { Snackbar, useSnackbar } from "./snackbar";

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
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

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
            {/* Action buttons - only show for non-achieved milestones */}
            {!milestone.achieved && (
              <div className="flex items-center gap-2 ml-4">
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
              </div>
            )}
          </div>
        </div>
      ))}

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
