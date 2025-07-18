"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { useApi } from "@/lib/api";
import { Edit, Trash2, Plus, Copy } from "lucide-react";
import { Snackbar, useSnackbar } from "../ui/snackbar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import type { Link } from "./link-form";
import { Fundraiser } from "@/app/app/fundraisers/[slug]/page";

interface LinkListProps {
  fundraiser: Fundraiser;
  onEditLink?: (link: Link) => void;
}

export function LinkList({ fundraiser, onEditLink }: LinkListProps) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Link | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  const { data: links, isLoading } = useQuery<Link[]>({
    queryKey: ["links", fundraiser.id],
    queryFn: async () => {
      const response = await api.get(`/fundraisers/${fundraiser.id}/links`);
      return response.data;
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (link: Link) => {
      await api.delete(`/fundraisers/${fundraiser.id}/links/${link.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links", fundraiser.id] });
      setDeleteTarget(null);
      setConfirmOpen(false);
      showSnackbar("Link deleted successfully!", "success");
    },
    onError: (error) => {
      showSnackbar(
        error instanceof Error ? error.message : "Failed to delete link",
        "error"
      );
    },
  });

  const handleCopyLink = async (alias: string) => {
    const url = `${
      process.env.NEXT_FRONTEND_URL ?? "http://localhost:3001"
    }/fundraisers/${fundraiser.slug}?alias=${encodeURIComponent(alias)}`;
    try {
      await navigator.clipboard.writeText(url);
      showSnackbar("Link copied to clipboard!", "success");
    } catch {
      showSnackbar("Failed to copy link", "error");
    }
  };

  if (isLoading) {
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
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!links || links.length === 0) {
    return (
      <div className="text-center py-8 bg-muted/50 border border-border rounded-lg">
        <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No links yet</h3>
        <p className="text-muted-foreground mb-4">
          Add links to provide more information or resources for your
          fundraiser.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {links.map((link) => (
        <div
          key={link.id}
          className="border rounded-lg p-4 bg-muted/50 border-border flex items-center justify-between"
        >
          <div>
            <div className="font-semibold text-base mb-1">{link.alias}</div>
            {link.note && (
              <div className="text-sm text-muted-foreground">{link.note}</div>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            {/* Copy Link Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyLink(link.alias)}
              className="h-8 w-8 p-0"
              title="Copy link"
            >
              <Copy className="h-4 w-4" />
            </Button>
            {onEditLink && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditLink(link)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDeleteTarget(link);
                setConfirmOpen(true);
              }}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              disabled={
                deleteLinkMutation.isPending && deleteTarget?.id === link.id
              }
            >
              {deleteLinkMutation.isPending && deleteTarget?.id === link.id ? (
                <span className="animate-spin h-4 w-4 block border-2 border-destructive border-t-transparent rounded-full" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ))}

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete Link</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the link{" "}
              <span className="font-semibold">{deleteTarget?.alias}</span>? This
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
                deleteTarget && deleteLinkMutation.mutate(deleteTarget)
              }
              disabled={deleteLinkMutation.isPending}
            >
              {deleteLinkMutation.isPending ? "Deleting..." : "Delete"}
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
