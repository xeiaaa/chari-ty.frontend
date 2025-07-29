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

interface GalleryItem {
  id: string;
  asset: CloudinaryAsset;
  caption?: string;
  order: number;
}

interface ExistingGalleryItem {
  id: string;
  upload: CloudinaryAsset;
  caption?: string;
  order: number;
}

interface GalleryFormProps {
  fundraiserId: string;
  slug: string;
  existingGallery?: ExistingGalleryItem[]; // Gallery items from the fundraiser
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
}

export function GalleryForm({
  fundraiserId,
  slug,
  existingGallery,
  onSuccess,
  onError,
}: GalleryFormProps) {
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

  // Initialize gallery items from existing data
  useEffect(() => {
    if (existingGallery) {
      const items: GalleryItem[] = existingGallery.map((item, index) => ({
        id: item.id || `existing-${index}`,
        asset: item.upload,
        caption: item.caption || "",
        order: item.order || index,
      }));
      setGalleryItems(items);
    } else {
      setGalleryItems([]);
    }
  }, [existingGallery]);

  // Get upload signature mutation
  const getUploadSignatureMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/uploads/signature", {
        folder: "fundraisers",
      });
      return response.data as UploadSignature;
    },
  });

  // Add gallery items mutation
  const addGalleryItemsMutation = useMutation({
    mutationFn: async (items: { publicId: string; caption?: string }[]) => {
      const payload = {
        items: items.map((item) => ({
          publicId: item.publicId,
          caption: item.caption,
        })),
      };
      const response = await api.post(
        `/fundraisers/${fundraiserId}/gallery`,
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fundraiser", slug] });
      toast.success("Gallery items added successfully!");
      onSuccess?.();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to add gallery items";
      toast.error(message);
      onError?.(message);
    },
  });

  // Update gallery item mutation
  const updateGalleryItemMutation = useMutation({
    mutationFn: async ({
      galleryItemId,
      caption,
    }: {
      galleryItemId: string;
      caption?: string;
    }) => {
      const response = await api.patch(
        `/fundraisers/${fundraiserId}/gallery/${galleryItemId}`,
        { caption }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fundraiser", slug] });
      toast.success("Gallery item updated successfully!");
      onSuccess?.();
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update gallery item";
      toast.error(message);
      onError?.(message);
    },
  });

  // Delete gallery item mutation
  const deleteGalleryItemMutation = useMutation({
    mutationFn: async (galleryItemId: string) => {
      await api.delete(`/fundraisers/${fundraiserId}/gallery/${galleryItemId}`);
    },
    onSuccess: (_, galleryItemId) => {
      // Optimistically remove from local state for immediate UI feedback
      setGalleryItems((prev) =>
        prev.filter((item) => item.id !== galleryItemId)
      );
      queryClient.invalidateQueries({ queryKey: ["fundraiser", slug] });
      toast.success("Gallery item deleted successfully!");
      onSuccess?.();
    },
    onError: (error) => {
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ["fundraiser", slug] });
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete gallery item";
      toast.error(message);
      onError?.(message);
    },
  });

  // Reorder gallery items mutation
  const reorderGalleryItemsMutation = useMutation({
    mutationFn: async (
      orderMap: { fundraiserGalleryId: string; order: number }[]
    ) => {
      const response = await api.patch(
        `/fundraisers/${fundraiserId}/gallery/reorder`,
        { orderMap }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fundraiser", slug] });
      toast.success("Gallery order updated successfully!");
      onSuccess?.();
    },
    onError: (error) => {
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ["fundraiser", slug] });
      const message =
        error instanceof Error
          ? error.message
          : "Failed to reorder gallery items";
      toast.error(message);
      onError?.(message);
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
      formData.append("folder", "fundraisers");
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
  const handleFileUploadWithId = async (file: File, fileId: string) => {
    setUploadingFiles((prev) => new Map(prev).set(fileId, true));

    try {
      const asset = await uploadToCloudinary(file);

      // Add to gallery immediately using the new API
      await addGalleryItemsMutation.mutateAsync([
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
      toast.success(`${file.name} uploaded successfully!`);
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
  const handleDrop = useCallback((e: React.DragEvent) => {
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
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
    []
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
    if (!result.destination) return;

    const fromIndex = result.source.index;
    const toIndex = result.destination.index;

    if (fromIndex === toIndex) return;

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

    // Prepare order map for the API
    const orderMap = updatedItems.map((item, index) => ({
      fundraiserGalleryId: item.id,
      order: index,
    }));

    // Send the reorder request to the backend
    reorderGalleryItemsMutation.mutate(orderMap);
  };

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
      updateGalleryItemMutation.mutate({
        galleryItemId: itemId,
        caption: item.caption,
      });
    }
    setEditingCaption(null);
  };

  // Handle item delete
  const handleItemDelete = (itemId: string) => {
    deleteGalleryItemMutation.mutate(itemId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gallery</h3>
          <p className="text-sm text-muted-foreground">
            Add images to showcase your fundraiser. Drag and drop or click to
            browse.
          </p>
        </div>
      </div>

      {/* Upload Area */}
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
            <h4 className="text-lg font-medium mb-2">Upload Images</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop images here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Supported formats: JPG, PNG, GIF, WebP. Max 10MB per file.
            </p>
            <Button
              variant="outline"
              onClick={() => document.getElementById("gallery-upload")?.click()}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Browse Files
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
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Gallery Items */}
      {galleryItems.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-medium">Gallery Items</h4>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="gallery-items">
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
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-4 p-4 border rounded-lg bg-card ${
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
                          <div className="flex-1 min-w-0">
                            {editingCaption === item.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={item.caption || ""}
                                  onChange={(e) =>
                                    handleCaptionEdit(item.id, e.target.value)
                                  }
                                  placeholder="Add a caption..."
                                  className="min-h-[60px]"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleCaptionSave(item.id)}
                                    disabled={
                                      updateGalleryItemMutation.isPending
                                    }
                                  >
                                    {updateGalleryItemMutation.isPending ? (
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
                                    onClick={() => setEditingCaption(item.id)}
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
                            onClick={() => handleItemDelete(item.id)}
                            disabled={deleteGalleryItemMutation.isPending}
                            className="text-destructive hover:text-destructive"
                          >
                            {deleteGalleryItemMutation.isPending ? (
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
