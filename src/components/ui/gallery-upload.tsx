"use client";

import { useState, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import axios from "axios";
import {
  Upload,
  Image as ImageIcon,
  Edit3,
  Save,
  Trash2,
  Loader2,
  GripVertical,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

export enum UploadType {
  FUNDRAISER_GALLERY = "fundraiser-gallery",
  GROUP_GALLERY = "group-gallery",
  GROUP_VERIFICATION = "group-verification",
  MILESTONE_PROOF = "milestone-proof",
  COVER_IMAGE = "cover-image",
}

export interface CloudinaryAsset {
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

export interface GalleryItem {
  id: string;
  asset: CloudinaryAsset;
  caption?: string;
  order: number;
}

interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
}

interface GalleryUploadProps {
  // Core configuration
  type: UploadType;
  entityId: string; // fundraiserId, groupId, milestoneId, etc.
  entitySlug?: string; // for cache invalidation

  // Display configuration
  title?: string;
  description?: string;
  maxFileSize?: number; // in bytes
  acceptTypes?: string; // for file input

  // Data
  existingItems?: GalleryItem[];

  // API endpoints
  uploadEndpoint: string;
  updateEndpoint?: string;
  deleteEndpoint?: string;
  reorderEndpoint?: string;

  // Callbacks
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onItemAdded?: (item: GalleryItem) => void;
  onItemUpdated?: (item: GalleryItem) => void;
  onItemDeleted?: (itemId: string) => void;
  onReorder?: (items: GalleryItem[]) => void;

  // Special modes
  singleFile?: boolean; // for cover images
  showDragDrop?: boolean;
  showCaptions?: boolean;
  showReorder?: boolean;

  // Custom folder for Cloudinary
  cloudinaryFolder?: string;

  // Query keys for cache invalidation
  queryKeys?: string[];
}

export function GalleryUpload({
  type,
  entitySlug,
  title,
  description,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptTypes = "image/*",
  existingItems = [],
  uploadEndpoint,
  updateEndpoint,
  deleteEndpoint,
  reorderEndpoint,
  onSuccess,
  onError,
  onItemAdded,
  onItemUpdated,
  onItemDeleted,
  onReorder,
  singleFile = false,
  showDragDrop = true,
  showCaptions = true,
  showReorder = true,
  cloudinaryFolder,
  queryKeys = [],
}: GalleryUploadProps) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, boolean>>(
    new Map()
  );
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [filePreviews, setFilePreviews] = useState<Map<string, string>>(
    new Map()
  );
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderTimeout, setReorderTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Initialize gallery items from existing data
  useEffect(() => {
    if (existingItems && galleryItems.length === 0) {
      // Only initialize from existingItems if we don't have any local items
      // This prevents reordered items from being reset to their original order
      const items: GalleryItem[] = existingItems.map((item, index) => ({
        id: item.id || `existing-${index}`,
        asset: item.asset,
        caption: item.caption || "",
        order: item.order || index,
      }));
      setGalleryItems(items);
    } else if (!existingItems && galleryItems.length === 0) {
      // Clear items only if we don't have any local items and no existing items
      setGalleryItems([]);
    }
  }, [existingItems, galleryItems.length]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (reorderTimeout) {
        clearTimeout(reorderTimeout);
      }
    };
  }, [reorderTimeout]);

  // Get upload signature mutation
  const getUploadSignatureMutation = useMutation({
    mutationFn: async () => {
      const folder = cloudinaryFolder || getDefaultFolder(type);
      const response = await api.post("/uploads/signature", { folder });
      return response.data as UploadSignature;
    },
  });

  // Add items mutation
  const addItemsMutation = useMutation({
    mutationFn: async (items: { publicId: string; caption?: string }[]) => {
      const payload = {
        items: items.map((item) => ({
          publicId: item.publicId,
          caption: item.caption,
          ...(type === UploadType.GROUP_GALLERY ||
          type === UploadType.GROUP_VERIFICATION
            ? {
                type:
                  type === UploadType.GROUP_VERIFICATION
                    ? "verification"
                    : "gallery",
              }
            : {}),
        })),
      };
      const response = await api.post(uploadEndpoint, payload);
      return response.data;
    },
    onSuccess: (data) => {
      // Don't invalidate queries to avoid reverting optimistic updates
      // The server data will be synced on the next page load or manual refresh

      // Update local state with the new items
      if (data) {
        const newItems = Array.isArray(data) ? data : [data];
        setGalleryItems((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const itemsToAdd = newItems
            .filter((item) => !existingIds.has(item.id))
            .map((item) => ({
              id: item.id,
              asset: {
                cloudinaryAssetId:
                  item.upload?.cloudinaryAssetId ||
                  item.upload?.publicId ||
                  item.publicId,
                publicId: item.upload?.publicId || item.publicId,
                url: item.upload?.url || item.upload?.secureUrl || item.url,
                eagerUrl:
                  item.upload?.eagerUrl ||
                  item.upload?.url ||
                  item.upload?.secureUrl ||
                  item.url,
                format: item.upload?.format || "jpg",
                resourceType: item.upload?.resourceType || "image",
                size: item.upload?.size || 0,
                originalFilename:
                  item.upload?.originalFilename || "uploaded-file",
                uploadedAt: item.upload?.uploadedAt || new Date().toISOString(),
              },
              caption: item.caption || "",
              order: item.order || prev.length,
            }));
          return [...prev, ...itemsToAdd];
        });
      }

      // Call custom callback if provided
      if (onItemAdded && data) {
        const newItems = Array.isArray(data) ? data : [data];
        newItems.forEach((item) => onItemAdded(item));
      }

      toast.success("Items added successfully!");
      onSuccess?.();
    },
    onError: (error) => {
      // Only invalidate queries on error to revert optimistic updates
      if (entitySlug) {
        queryClient.invalidateQueries({
          queryKey: [getEntityKey(type), entitySlug],
        });
      }
      queryKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      const message =
        error instanceof Error ? error.message : "Failed to add items";
      toast.error(message);
      onError?.(message);
    },
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({
      itemId,
      caption,
    }: {
      itemId: string;
      caption?: string;
    }) => {
      if (!updateEndpoint) throw new Error("Update endpoint not configured");
      const response = await api.patch(updateEndpoint.replace("{id}", itemId), {
        caption,
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Don't invalidate queries to avoid reverting optimistic updates
      // The server data will be synced on the next page load or manual refresh

      // Find the updated item from local state and call onItemUpdated
      const updatedItem = galleryItems.find(
        (item) => item.id === variables.itemId
      );
      if (updatedItem) {
        onItemUpdated?.(updatedItem);
      }

      toast.success("Item updated successfully!");
      onSuccess?.();
    },
    onError: (error) => {
      // Only invalidate queries on error to revert optimistic updates
      if (entitySlug) {
        queryClient.invalidateQueries({
          queryKey: [getEntityKey(type), entitySlug],
        });
      }
      queryKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      const message =
        error instanceof Error ? error.message : "Failed to update item";
      toast.error(message);
      onError?.(message);
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!deleteEndpoint) throw new Error("Delete endpoint not configured");
      await api.delete(deleteEndpoint.replace("{id}", itemId));
    },
    onSuccess: (_, itemId) => {
      // Optimistically remove from local state
      setGalleryItems((prev) => prev.filter((item) => item.id !== itemId));

      // Don't invalidate queries to avoid reverting optimistic updates
      // The server data will be synced on the next page load or manual refresh

      toast.success("Item deleted successfully!");
      onSuccess?.();
      onItemDeleted?.(itemId);
      setDeletingItemId(null);
    },
    onError: (error) => {
      // Revert optimistic update on error
      queryClient.invalidateQueries({
        queryKey: [getEntityKey(type), entitySlug],
      });
      queryKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      const message =
        error instanceof Error ? error.message : "Failed to delete item";
      toast.error(message);
      onError?.(message);
      setDeletingItemId(null);
    },
  });

  // Reorder items mutation
  const reorderItemsMutation = useMutation({
    mutationFn: async (orderMap: { id: string; order: number }[]) => {
      if (!reorderEndpoint) throw new Error("Reorder endpoint not configured");

      // Transform the orderMap to use the correct field name based on upload type
      const transformedOrderMap = orderMap.map(({ id, order }) => {
        switch (type) {
          case UploadType.FUNDRAISER_GALLERY:
            return { fundraiserGalleryId: id, order };
          case UploadType.GROUP_GALLERY:
          case UploadType.GROUP_VERIFICATION:
            return { groupUploadId: id, order };
          case UploadType.MILESTONE_PROOF:
            return { milestoneUploadId: id, order };
          default:
            return { id, order };
        }
      });

      const response = await api.patch(reorderEndpoint, {
        orderMap: transformedOrderMap,
      });
      return response.data;
    },
    onSuccess: () => {
      // Don't invalidate queries to avoid flickering
      // The optimistic update already shows the correct order
      // The server data will be synced on the next page load or manual refresh
      toast.success("Order updated successfully!");
      onSuccess?.();
    },
    onError: (error) => {
      // Only invalidate queries on error to revert the optimistic update
      queryClient.invalidateQueries({
        queryKey: [getEntityKey(type), entitySlug],
      });
      queryKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      const message =
        error instanceof Error ? error.message : "Failed to reorder items";
      toast.error(message);
      onError?.(message);
    },
    onSettled: () => {
      // Clear loading state when mutation completes (success or error)
      setIsReordering(false);
    },
  });

  // Upload file to Cloudinary
  const uploadToCloudinary = async (file: File): Promise<CloudinaryAsset> => {
    try {
      const signature = await getUploadSignatureMutation.mutateAsync();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signature.apiKey);
      formData.append("timestamp", signature.timestamp.toString());
      formData.append("signature", signature.signature);
      formData.append("folder", cloudinaryFolder || getDefaultFolder(type));
      formData.append("eager", "q_auto,f_auto");
      formData.append("use_filename", "true");
      formData.append("unique_filename", "true");

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
  const handleFileUploadWithId = async (file: File, fileId: string) => {
    setUploadingFiles((prev) => new Map(prev).set(fileId, true));

    try {
      const asset = await uploadToCloudinary(file);

      // Add to gallery immediately
      await addItemsMutation.mutateAsync([
        {
          publicId: asset.publicId,
          caption: "",
        },
      ]);

      // Remove preview after successful upload
      setFilePreviews((prev) => {
        const newMap = new Map(prev);
        newMap.delete(fileId);
        return newMap;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(`${file.name}: ${message}`);
      onError?.(message);
    } finally {
      setUploadingFiles((prev) => {
        const newMap = new Map(prev);
        newMap.delete(fileId);
        return newMap;
      });
    }
  };

  // Handle file upload (legacy function for drag and drop)
  const handleFileUpload = async (file: File) => {
    const fileId = `${file.name}-${Date.now()}`;
    await handleFileUploadWithId(file, fileId);
  };

  // Handle file drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const allowedFiles = getFilteredFiles(files, type);

      if (allowedFiles.length === 0) {
        toast.error(getFileTypeErrorMessage(type));
        return;
      }

      // Validate file sizes
      const oversizedFiles = allowedFiles.filter(
        (file) => file.size > maxFileSize
      );
      if (oversizedFiles.length > 0) {
        toast.error(
          `Files over ${formatFileSize(maxFileSize)}: ${oversizedFiles
            .map((f) => f.name)
            .join(", ")}`
        );
        return;
      }

      // Upload each file
      allowedFiles.forEach(handleFileUpload);
    },
    [type, maxFileSize]
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const allowedFiles = getFilteredFiles(files, type);

      if (allowedFiles.length === 0) {
        toast.error(getFileTypeErrorMessage(type));
        return;
      }

      // Validate file sizes
      const oversizedFiles = allowedFiles.filter(
        (file) => file.size > maxFileSize
      );
      if (oversizedFiles.length > 0) {
        toast.error(
          `Files over ${formatFileSize(maxFileSize)}: ${oversizedFiles
            .map((f) => f.name)
            .join(", ")}`
        );
        return;
      }

      // Create immediate previews and upload files
      allowedFiles.forEach((file) => {
        const fileId = `${file.name}-${Date.now()}`;

        // Create preview (only for images)
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setFilePreviews((prev) =>
              new Map(prev).set(fileId, e.target?.result as string)
            );
          };
          reader.readAsDataURL(file);
        }

        // Upload file with the same fileId
        handleFileUploadWithId(file, fileId);
      });
      e.target.value = ""; // Reset input
    },
    [type, maxFileSize]
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
    if (!result.destination || !showReorder) return;

    const fromIndex = result.source.index;
    const toIndex = result.destination.index;

    if (fromIndex === toIndex) return;

    // Reset any transform styles from drag start
    const draggedElement = result.draggableId;
    const element = document.querySelector(
      `[data-rbd-draggable-id="${draggedElement}"]`
    ) as HTMLElement;
    if (element) {
      element.style.transform = "";
      element.style.transition = "";
    }

    const newItems = [...galleryItems];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);

    // Update order numbers
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      order: index,
    }));

    // Optimistically update the UI immediately
    setGalleryItems(updatedItems);
    onReorder?.(updatedItems);

    // Prepare order map for the API
    const orderMap = updatedItems.map((item, index) => ({
      id: item.id,
      order: index,
    }));

    // Clear any existing timeout
    if (reorderTimeout) {
      clearTimeout(reorderTimeout);
    }

    // Debounce the reorder request to prevent multiple rapid calls
    const timeout = setTimeout(() => {
      reorderItemsMutation.mutate(orderMap);
    }, 300); // 300ms delay

    setReorderTimeout(timeout);
  };

  // Handle drag start to prevent dialog closing
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    // Add a subtle visual feedback that reordering is starting
    const target = e.currentTarget as HTMLElement;
    target.style.transform = "scale(1.02)";
    target.style.transition = "transform 0.1s ease";

    // Show immediate feedback that reordering is starting
    setIsReordering(true);
  }, []);

  // Handle caption edit
  const handleCaptionEdit = (itemId: string, caption: string) => {
    setGalleryItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, caption } : item))
    );
  };

  // Handle caption save
  const handleCaptionSave = (itemId: string) => {
    const item = galleryItems.find((g) => g.id === itemId);
    if (item) {
      updateItemMutation.mutate({
        itemId: itemId,
        caption: item.caption,
      });
    }
    setEditingCaption(null);
  };

  // Handle item delete
  const handleItemDelete = (itemId: string) => {
    setDeletingItemId(itemId);
    deleteItemMutation.mutate(itemId);
  };

  // Helper functions
  const getDefaultFolder = (uploadType: UploadType): string => {
    switch (uploadType) {
      case UploadType.FUNDRAISER_GALLERY:
        return "fundraisers";
      case UploadType.GROUP_GALLERY:
      case UploadType.GROUP_VERIFICATION:
        return "groups";
      case UploadType.MILESTONE_PROOF:
        return "milestone-proof";
      case UploadType.COVER_IMAGE:
        return "covers";
      default:
        return "uploads";
    }
  };

  const getEntityKey = (uploadType: UploadType): string => {
    switch (uploadType) {
      case UploadType.FUNDRAISER_GALLERY:
        return "fundraiser";
      case UploadType.GROUP_GALLERY:
      case UploadType.GROUP_VERIFICATION:
        return "group";
      case UploadType.MILESTONE_PROOF:
        return "milestones";
      default:
        return "entity";
    }
  };

  const getFilteredFiles = (files: File[], uploadType: UploadType): File[] => {
    switch (uploadType) {
      case UploadType.GROUP_VERIFICATION:
        return files.filter(
          (file) =>
            file.type.startsWith("image/") || file.type === "application/pdf"
        );
      default:
        return files.filter((file) => file.type.startsWith("image/"));
    }
  };

  const getFileTypeErrorMessage = (uploadType: UploadType): string => {
    switch (uploadType) {
      case UploadType.GROUP_VERIFICATION:
        return "Please select image or PDF files only";
      default:
        return "Please select image files only";
    }
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb}MB`;
  };

  const getDefaultTitle = (uploadType: UploadType): string => {
    switch (uploadType) {
      case UploadType.FUNDRAISER_GALLERY:
        return "Gallery";
      case UploadType.GROUP_GALLERY:
        return "Group Gallery";
      case UploadType.GROUP_VERIFICATION:
        return "Verification Documents";
      case UploadType.MILESTONE_PROOF:
        return "Proof Uploads";
      case UploadType.COVER_IMAGE:
        return "Cover Image";
      default:
        return "Uploads";
    }
  };

  const getDefaultDescription = (uploadType: UploadType): string => {
    switch (uploadType) {
      case UploadType.FUNDRAISER_GALLERY:
        return "Add images to showcase your fundraiser. Drag and drop or click to browse.";
      case UploadType.GROUP_GALLERY:
        return "Add images to showcase your group. Drag and drop or click to browse.";
      case UploadType.GROUP_VERIFICATION:
        return "Add verification documents for your group. Drag and drop or click to browse.";
      case UploadType.MILESTONE_PROOF:
        return "Upload proof images of your milestone completion.";
      case UploadType.COVER_IMAGE:
        return "Upload a cover image for your fundraiser.";
      default:
        return "Upload files by dragging and dropping or clicking to browse.";
    }
  };

  const getSupportedFormats = (uploadType: UploadType): string => {
    switch (uploadType) {
      case UploadType.GROUP_VERIFICATION:
        return "Supported formats: PDF, JPG, PNG, GIF, WebP. Max 10MB per file.";
      default:
        return "Supported formats: JPG, PNG, GIF, WebP. Max 10MB per file.";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {title || getDefaultTitle(type)}
          </h3>
          <p className="text-sm text-muted-foreground">
            {description || getDefaultDescription(type)}
          </p>
        </div>
      </div>

      {/* Upload Area */}
      {showDragDrop && (
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
          <CardContent className="p-8">
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h4 className="text-lg font-medium mb-2">
                {type === UploadType.COVER_IMAGE
                  ? "Upload Image"
                  : "Upload Files"}
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {getSupportedFormats(type)}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  document.getElementById("gallery-upload")?.click();
                }}
                disabled={uploadingFiles.size > 0}
              >
                {uploadingFiles.size > 0 ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Browse Files
                  </>
                )}
              </Button>
              {uploadingFiles.size > 0 && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">
                      Uploading {uploadingFiles.size} file
                      {uploadingFiles.size > 1 ? "s" : ""}...
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can continue adding more files while these upload
                  </p>
                </div>
              )}
              <input
                id="gallery-upload"
                type="file"
                multiple={!singleFile}
                accept={acceptTypes}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gallery Items */}
      {galleryItems.length > 0 && (
        <div className="space-y-4 relative ">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium">Items</h4>
            {isReordering && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Updating order...</span>
              </div>
            )}
          </div>
          {showReorder ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable
                droppableId="gallery-items"
                isDropDisabled={isReordering}
              >
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {galleryItems.map((item, index) => (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                        isDragDisabled={isReordering}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            onDragStart={handleDragStart}
                            className={`flex items-center gap-4 p-4 border rounded-lg bg-card ${
                              snapshot.isDragging ? "shadow-lg" : ""
                            } ${isReordering ? "opacity-75" : ""}`}
                          >
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className={`flex-shrink-0 ${
                                isReordering
                                  ? "cursor-not-allowed opacity-50"
                                  : "cursor-grab active:cursor-grabbing"
                              }`}
                            >
                              {isReordering ? (
                                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                              ) : (
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>

                            {/* Image Preview */}
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              <img
                                src={item.asset.eagerUrl || item.asset.url}
                                alt={item.asset.originalFilename}
                                className="w-full h-full object-cover"
                              />
                              {uploadingFiles.has(item.id) && (
                                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                  <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                              )}
                            </div>

                            {/* Caption */}
                            {showCaptions && (
                              <div className="flex-1 min-w-0">
                                {editingCaption === item.id ? (
                                  <div className="space-y-2">
                                    <Textarea
                                      value={item.caption || ""}
                                      onChange={(e) =>
                                        handleCaptionEdit(
                                          item.id,
                                          e.target.value
                                        )
                                      }
                                      placeholder="Add a caption..."
                                      className="min-h-[60px]"
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleCaptionSave(item.id)
                                        }
                                        disabled={updateItemMutation.isPending}
                                      >
                                        {updateItemMutation.isPending ? (
                                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        ) : (
                                          <Save className="h-3 w-3 mr-1" />
                                        )}
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditingCaption(null)}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium truncate">
                                      {item.asset.originalFilename}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {item.caption || "No caption"}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                          setEditingCaption(item.id)
                                        }
                                      >
                                        <Edit3 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Delete Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleItemDelete(item.id)}
                              disabled={deletingItemId === item.id}
                              className="text-destructive hover:text-destructive"
                            >
                              {deletingItemId === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="space-y-3">
              {galleryItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 border rounded-lg bg-card"
                >
                  {/* Image Preview */}
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={item.asset.eagerUrl || item.asset.url}
                      alt={item.asset.originalFilename}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Caption */}
                  {showCaptions && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.asset.originalFilename}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.caption || "No caption"}
                      </p>
                    </div>
                  )}

                  {/* Delete Button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleItemDelete(item.id)}
                    disabled={deletingItemId === item.id}
                    className="text-destructive hover:text-destructive"
                  >
                    {deletingItemId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Uploading Files with Previews */}
      {Array.from(uploadingFiles.keys()).map((fileId) => {
        const preview = filePreviews.get(fileId);
        return (
          <div
            key={fileId}
            className="flex items-center gap-4 p-4 border rounded-lg bg-card"
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
              <p className="text-sm font-medium">Uploading...</p>
              <p className="text-xs text-muted-foreground">
                {fileId.split("-")[0]} {/* Show filename */}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
