"use client";

import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../ui/button";
import { FormField } from "../ui/form-field";
import { Skeleton } from "../ui/skeleton";
import { Textarea } from "../ui/textarea";
import { Card, CardContent } from "../ui/card";
import { useApi } from "@/lib/api";
import {
  Target,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Upload,
  Image as ImageIcon,
  Edit3,
  Save,
  Loader2,
  GripVertical,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Snackbar, useSnackbar } from "../ui/snackbar";
import { toast } from "sonner";
import axios from "axios";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

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

// Upload signature response type
interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
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
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, boolean>>(
    new Map()
  );
  const [filePreviews, setFilePreviews] = useState<Map<string, string>>(
    new Map()
  );
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [deletingUploadId, setDeletingUploadId] = useState<string | null>(null);
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  // Get upload signature mutation
  const getUploadSignatureMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/uploads/signature", {
        folder: "milestone-proof",
      });
      return response.data as UploadSignature;
    },
  });

  // Add milestone uploads mutation
  const addMilestoneUploadsMutation = useMutation({
    mutationFn: async ({
      milestoneId,
      items,
    }: {
      milestoneId: string;
      items: { publicId: string; caption?: string }[];
    }) => {
      const payload = {
        items: items.map((item) => ({
          publicId: item.publicId,
          caption: item.caption,
        })),
      };
      const response = await api.post(
        `/milestones/${milestoneId}/uploads`,
        payload
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Optimistically update the local state with the new uploads
      if (completingMilestone && data) {
        const newUploads = Array.isArray(data) ? data : [data];
        setCompletingMilestone({
          ...completingMilestone,
          milestoneUploads: [
            ...(completingMilestone.milestoneUploads || []),
            ...newUploads.map((upload, index) => ({
              ...upload,
              order:
                (completingMilestone.milestoneUploads?.length || 0) + index,
            })),
          ],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["milestones", fundraiserId] });
      toast.success("Uploads added successfully!");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to add uploads";
      toast.error(message);
    },
  });

  // Update milestone upload mutation
  const updateMilestoneUploadMutation = useMutation({
    mutationFn: async ({
      milestoneId,
      uploadItemId,
      caption,
    }: {
      milestoneId: string;
      uploadItemId: string;
      caption?: string;
    }) => {
      const response = await api.patch(
        `/milestones/${milestoneId}/uploads/${uploadItemId}`,
        { caption }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", fundraiserId] });
      toast.success("Upload updated successfully!");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to update upload";
      toast.error(message);
    },
  });

  // Delete milestone upload mutation
  const deleteMilestoneUploadMutation = useMutation({
    mutationFn: async ({
      milestoneId,
      uploadItemId,
    }: {
      milestoneId: string;
      uploadItemId: string;
    }) => {
      await api.delete(`/milestones/${milestoneId}/uploads/${uploadItemId}`);
    },
    onSuccess: () => {
      toast.success("Upload deleted successfully!");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to delete upload";
      toast.error(message);
    },
  });

  // Reorder milestone uploads mutation
  const reorderMilestoneUploadsMutation = useMutation({
    mutationFn: async ({
      milestoneId,
      orderMap,
    }: {
      milestoneId: string;
      orderMap: { milestoneUploadId: string; order: number }[];
    }) => {
      const response = await api.patch(
        `/milestones/${milestoneId}/uploads/reorder`,
        { orderMap }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", fundraiserId] });
      toast.success("Upload order updated successfully!");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to reorder uploads";
      toast.error(message);
    },
  });

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

  // Upload file to Cloudinary
  const uploadToCloudinary = async (file: File): Promise<CloudinaryAsset> => {
    try {
      // Get upload signature
      const signature = await getUploadSignatureMutation.mutateAsync();

      // Prepare form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signature.apiKey);
      formData.append("timestamp", signature.timestamp.toString());
      formData.append("signature", signature.signature);
      formData.append("folder", "milestone-proof");
      formData.append("eager", "q_auto,f_auto");
      formData.append("use_filename", "true");
      formData.append("unique_filename", "true");

      // Upload to Cloudinary
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      return {
        cloudinaryAssetId: response.data.public_id,
        publicId: response.data.public_id,
        url: response.data.secure_url,
        eagerUrl: response.data.eager?.[0]?.secure_url,
        format: response.data.format,
        resourceType: response.data.resource_type,
        size: response.data.bytes,
        originalFilename: response.data.original_filename,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Failed to upload file:", file.name, error);
      throw new Error(`Failed to upload ${file.name}`);
    }
  };

  // Handle file upload with specific fileId
  const handleFileUploadWithId = useCallback(
    async (file: File, fileId: string) => {
      if (!completingMilestone) {
        toast.error("Please open the completion dialog first");
        return;
      }

      setUploadingFiles((prev) => new Map(prev).set(fileId, true));

      try {
        const asset = await uploadToCloudinary(file);

        // Add to milestone uploads immediately using the new API
        const response = await addMilestoneUploadsMutation.mutateAsync({
          milestoneId: completingMilestone.id,
          items: [
            {
              publicId: asset.publicId,
              caption: "",
            },
          ],
        });

        console.log("Add milestone uploads response:", response);

        // Remove preview after successful upload
        setFilePreviews((prev) => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });
        toast.success(`${file.name} uploaded successfully!`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Upload failed";
        toast.error(`${file.name}: ${message}`);
      } finally {
        setUploadingFiles((prev) => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });
      }
    },
    [completingMilestone, addMilestoneUploadsMutation]
  );

  // Handle file upload (legacy function for drag and drop)
  const handleFileUpload = useCallback(
    async (file: File) => {
      const fileId = `${file.name}-${Date.now()}`;
      await handleFileUploadWithId(file, fileId);
    },
    [handleFileUploadWithId]
  );

  // Handle file drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      if (imageFiles.length === 0) {
        toast.error("Please drop image files only");
        return;
      }

      // Validate file sizes
      const oversizedFiles = imageFiles.filter(
        (file) => file.size > 10 * 1024 * 1024
      );
      if (oversizedFiles.length > 0) {
        toast.error(
          `Files over 10MB: ${oversizedFiles.map((f) => f.name).join(", ")}`
        );
        return;
      }

      // Upload each file
      imageFiles.forEach(handleFileUpload);
    },
    [handleFileUpload]
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.target.files || []);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      if (imageFiles.length === 0) {
        toast.error("Please select image files only");
        return;
      }

      // Validate file sizes
      const oversizedFiles = imageFiles.filter(
        (file) => file.size > 10 * 1024 * 1024
      );
      if (oversizedFiles.length > 0) {
        toast.error(
          `Files over 10MB: ${oversizedFiles.map((f) => f.name).join(", ")}`
        );
        return;
      }

      // Create immediate previews and upload files
      imageFiles.forEach((file) => {
        const fileId = `${file.name}-${Date.now()}`;

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreviews((prev) =>
            new Map(prev).set(fileId, e.target?.result as string)
          );
        };
        reader.readAsDataURL(file);

        // Upload file with the same fileId
        handleFileUploadWithId(file, fileId);
      });
      e.target.value = ""; // Reset input
    },
    [handleFileUploadWithId]
  );

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // Handle drag and drop reorder
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !completingMilestone) return;

    const fromIndex = result.source.index;
    const toIndex = result.destination.index;

    if (fromIndex === toIndex) return;

    const uploads = completingMilestone.milestoneUploads || [];
    const newItems = [...uploads];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);

    // Update order numbers
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      order: index,
    }));

    // Optimistically update the UI immediately
    setCompletingMilestone({
      ...completingMilestone,
      milestoneUploads: updatedItems,
    });

    // Prepare order map for the API
    const orderMap = updatedItems.map((item, index) => ({
      milestoneUploadId: item.id,
      order: index,
    }));

    // Send the reorder request to the backend
    reorderMilestoneUploadsMutation.mutate({
      milestoneId: completingMilestone.id,
      orderMap,
    });
  };

  // Handle caption edit
  const handleCaptionEdit = (uploadId: string, caption: string) => {
    if (!completingMilestone) return;

    setCompletingMilestone({
      ...completingMilestone,
      milestoneUploads: completingMilestone.milestoneUploads?.map((upload) =>
        upload.id === uploadId ? { ...upload, caption } : upload
      ),
    });
  };

  // Handle caption save
  const handleCaptionSave = (uploadId: string) => {
    if (!completingMilestone) return;

    const upload = completingMilestone.milestoneUploads?.find(
      (u) => u.id === uploadId
    );
    if (upload) {
      updateMilestoneUploadMutation.mutate({
        milestoneId: completingMilestone.id,
        uploadItemId: uploadId,
        caption: upload.caption,
      });
    }
    setEditingCaption(null);
  };

  // Handle upload delete
  const handleUploadDelete = (uploadId: string) => {
    if (!completingMilestone) return;

    setDeletingUploadId(uploadId);

    // Optimistically remove from local state for immediate UI feedback
    setCompletingMilestone({
      ...completingMilestone,
      milestoneUploads: completingMilestone.milestoneUploads?.filter(
        (upload) => upload.id !== uploadId
      ),
    });

    deleteMilestoneUploadMutation.mutate(
      {
        milestoneId: completingMilestone.id,
        uploadItemId: uploadId,
      },
      {
        onSuccess: () => {
          setDeletingUploadId(null);
        },
        onError: () => {
          // Revert optimistic update on error
          setDeletingUploadId(null);
          queryClient.invalidateQueries({
            queryKey: ["milestones", fundraiserId],
          });
        },
      }
    );
  };

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
    setEditingCaption(null);
    setDeletingUploadId(null);
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
          if (!open) {
            setEditingCaption(null);
            setDeletingUploadId(null);
          }
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

            {/* Upload Area */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Upload Proof (Images)
                </label>
                <Card
                  className={`border-2 border-dashed transition-colors ${
                    isDragOver
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                      <h4 className="text-base font-medium mb-2">
                        Upload Images
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Drag and drop images here, or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Supported formats: JPG, PNG, GIF, WebP. Max 10MB per
                        file.
                      </p>
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          document
                            .getElementById("milestone-proof-upload")
                            ?.click();
                        }}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Browse Files
                      </Button>
                      {uploadingFiles.size > 0 && (
                        <div className="mt-3 p-2 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-xs font-medium">
                              Uploading {uploadingFiles.size} file
                              {uploadingFiles.size > 1 ? "s" : ""}...
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            You can continue adding more files while these
                            upload
                          </p>
                        </div>
                      )}
                      <input
                        id="milestone-proof-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Proof Uploads */}
              {(completingMilestone?.milestoneUploads &&
                completingMilestone.milestoneUploads.length > 0) ||
              uploadingFiles.size > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Proof Uploads</h4>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="milestone-uploads">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2"
                        >
                          {/* Existing Uploads */}
                          {completingMilestone?.milestoneUploads
                            ?.sort((a, b) => a.order - b.order)
                            .map((upload, index) => (
                              <Draggable
                                key={upload.id}
                                draggableId={upload.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex items-center gap-3 p-3 border rounded-lg bg-card ${
                                      snapshot.isDragging ? "shadow-lg" : ""
                                    }`}
                                  >
                                    {/* Drag Handle */}
                                    <div
                                      {...provided.dragHandleProps}
                                      className="flex-shrink-0 cursor-grab active:cursor-grabbing"
                                    >
                                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </div>

                                    {/* Image Preview */}
                                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                      <img
                                        src={
                                          upload.upload.eagerUrl ||
                                          upload.upload.url
                                        }
                                        alt={upload.upload.originalFilename}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>

                                    {/* Caption */}
                                    <div className="flex-1 min-w-0">
                                      {editingCaption === upload.id ? (
                                        <div className="space-y-2">
                                          <Textarea
                                            value={upload.caption || ""}
                                            onChange={(e) =>
                                              handleCaptionEdit(
                                                upload.id,
                                                e.target.value
                                              )
                                            }
                                            placeholder="Add a caption..."
                                            className="min-h-[50px]"
                                          />
                                          <div className="flex gap-2">
                                            <Button
                                              size="sm"
                                              onClick={() =>
                                                handleCaptionSave(upload.id)
                                              }
                                              disabled={
                                                updateMilestoneUploadMutation.isPending
                                              }
                                            >
                                              {updateMilestoneUploadMutation.isPending ? (
                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                              ) : (
                                                <Save className="h-3 w-3 mr-1" />
                                              )}
                                              Save
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() =>
                                                setEditingCaption(null)
                                              }
                                            >
                                              Cancel
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="space-y-1">
                                          <p className="text-xs font-medium truncate">
                                            {upload.upload.originalFilename}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {upload.caption || "No caption"}
                                          </p>
                                          <div className="flex items-center gap-2">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() =>
                                                setEditingCaption(upload.id)
                                              }
                                            >
                                              <Edit3 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Delete Button */}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        handleUploadDelete(upload.id)
                                      }
                                      disabled={deletingUploadId === upload.id}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      {deletingUploadId === upload.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </Draggable>
                            ))}

                          {/* Uploading Files */}
                          {Array.from(uploadingFiles.keys()).map((fileId) => {
                            const preview = filePreviews.get(fileId);
                            return (
                              <div
                                key={fileId}
                                className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                              >
                                {/* Image Preview */}
                                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                  {preview ? (
                                    <img
                                      src={preview}
                                      alt="Uploading preview"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Skeleton className="w-full h-full" />
                                  )}
                                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                  </div>
                                </div>

                                <div className="flex-1">
                                  <p className="text-xs font-medium">
                                    Uploading...
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {fileId.split("-")[0]} {/* Show filename */}
                                  </p>
                                </div>
                              </div>
                            );
                          })}

                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCompletionDialogOpen(false);
                  setEditingCaption(null);
                  setDeletingUploadId(null);
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
