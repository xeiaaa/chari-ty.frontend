"use client";

import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormSelect } from "@/components/ui/form-select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { useApi } from "@/lib/api";
import type { FormSelectOption } from "@/components/ui/form-select";
import axios from "axios";
import { toast } from "sonner";

const FUNDRAISER_CATEGORIES = [
  { value: "education", label: "Education" },
  { value: "health", label: "Health" },
  { value: "disaster_relief", label: "Disaster Relief" },
  { value: "environment", label: "Environment" },
  { value: "animals", label: "Animals" },
  { value: "children", label: "Children" },
  { value: "community", label: "Community" },
  { value: "arts", label: "Arts" },
  { value: "sports", label: "Sports" },
  { value: "food", label: "Food" },
  { value: "housing", label: "Housing" },
  { value: "technology", label: "Technology" },
  { value: "other", label: "Other" },
] as const;

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "CAD", label: "CAD ($)" },
] as const;

export enum FundraiserCategory {
  EDUCATION = "education",
  HEALTH = "health",
  DISASTER_RELIEF = "disaster_relief",
  ENVIRONMENT = "environment",
  ANIMALS = "animals",
  CHILDREN = "children",
  COMMUNITY = "community",
  ARTS = "arts",
  SPORTS = "sports",
  FOOD = "food",
  HOUSING = "housing",
  TECHNOLOGY = "technology",
  OTHER = "other",
}

export const fundraiserSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  summary: z.string().min(1, "Summary is required").max(200),
  description: z.string().min(1, "Description is required").max(5000),
  category: z.enum(Object.values(FundraiserCategory) as [string, ...string[]]),
  goalAmount: z.coerce.number().min(1, "Goal amount must be greater than 0"),
  currency: z.string().min(1, "Currency is required"),
  endDate: z.string().optional(),
  coverPublicId: z.string().optional(),
  removeCover: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

export type FundraiserFormData = z.infer<typeof fundraiserSchema>;

interface FundraiserFormProps {
  defaultValues?: Partial<FundraiserFormData>;
  onSubmit: (data: FundraiserFormData) => void;
  submitLabel?: string;
  loading?: boolean;
  error?: string | null;
  existingCoverUrl?: string;
}

interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
}

interface CloudinaryAsset {
  cloudinaryAssetId: string;
  publicId: string;
  url: string;
  eagerUrl?: string;
  format: string;
  resourceType: string;
  size: number;
  originalFilename: string;
  uploadedAt: string;
}

export function FundraiserForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save",
  loading = false,
  error,
  existingCoverUrl,
}: FundraiserFormProps) {
  const api = useApi();
  const [localError, setLocalError] = useState<string | null>(null);
  const [coverPublicId, setCoverPublicId] = useState<string | null>(
    defaultValues?.coverPublicId || null
  );
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    existingCoverUrl || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const form = useForm<FundraiserFormData>({
    resolver: zodResolver(fundraiserSchema),
    defaultValues: {
      title: "",
      summary: "",
      description: "",
      category: "other",
      goalAmount: 0,
      currency: "USD",
      endDate: "",
      coverPublicId: "",
      removeCover: false,
      isPublic: true,
      ...defaultValues,
    },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = form;

  // Get upload signature mutation
  const getUploadSignatureMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/uploads/signature", {
        folder: "covers",
      });
      return response.data as UploadSignature;
    },
  });

  // Upload to Cloudinary function
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
      formData.append("folder", "covers");
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

  // Handle file upload
  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setLocalError("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setLocalError("Image size must be less than 5MB");
        return;
      }

      setLocalError(null);
      setIsUploading(true);

      try {
        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (e) => {
          setCoverImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to Cloudinary
        const asset = await uploadToCloudinary(file);
        setCoverImagePreview(asset.eagerUrl || asset.url);
        setCoverPublicId(asset.publicId);
        setValue("coverPublicId", asset.publicId);
        toast.success("Cover image uploaded successfully!");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Upload failed";
        setLocalError(message);
        setCoverImagePreview(null);
        toast.error(message);
      } finally {
        setIsUploading(false);
      }
    },
    [setValue]
  );

  // Handle file drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
      e.target.value = ""; // Reset input
    },
    [handleFileUpload]
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

  const internalSubmit = async (data: FundraiserFormData) => {
    setLocalError(null);

    // If there's no coverPublicId and no existing cover, require an image
    if (!data.coverPublicId && !existingCoverUrl) {
      setLocalError("Cover image is required");
      return;
    }

    // Determine if we should remove the cover
    const shouldRemoveCover =
      existingCoverUrl && !data.coverPublicId && !coverPublicId;

    // If there's an existing cover but no new coverPublicId and we're not removing, keep the existing one
    let finalCoverPublicId = data.coverPublicId;
    if (
      !data.coverPublicId &&
      existingCoverUrl &&
      defaultValues?.coverPublicId &&
      !shouldRemoveCover
    ) {
      finalCoverPublicId = defaultValues.coverPublicId;
    }

    onSubmit({
      ...data,
      coverPublicId: finalCoverPublicId,
      removeCover: shouldRemoveCover || undefined,
    });
  };

  const getFieldError = (field: string) =>
    errors[field as keyof typeof errors]?.message;

  return (
    <form onSubmit={handleSubmit(internalSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField<FundraiserFormData>
            label="Title"
            register={register}
            name="title"
            required
            placeholder="Enter fundraiser title"
            error={getFieldError("title")}
          />
          <FormSelect
            label="Category"
            name="category"
            options={FUNDRAISER_CATEGORIES as unknown as FormSelectOption[]}
            register={register}
            error={getFieldError("category")}
          />
        </div>
        <FormField<FundraiserFormData>
          label="Summary"
          register={register}
          name="summary"
          required
          placeholder="Brief description"
          error={getFieldError("summary")}
        />
        <FormField<FundraiserFormData>
          label="Description"
          register={register}
          name="description"
          textarea
          required
          placeholder="Detailed description"
          error={getFieldError("description")}
        />
      </div>

      {/* Financial Information */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Financial Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField<FundraiserFormData>
            label="Goal Amount"
            register={register}
            name="goalAmount"
            type="number"
            required
            placeholder="0"
            error={getFieldError("goalAmount")}
          />
          <FormSelect
            label="Currency"
            name="currency"
            options={CURRENCIES as unknown as FormSelectOption[]}
            register={register}
            error={getFieldError("currency")}
          />
        </div>
        <FormField<FundraiserFormData>
          label="End Date (Optional)"
          register={register}
          name="endDate"
          type="date"
          error={getFieldError("endDate")}
        />
      </div>

      {/* Media Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Media</h2>
        <div className="space-y-2">
          <Label>Cover Image</Label>
          <input type="hidden" {...register("coverPublicId")} />
          <input type="hidden" {...register("removeCover")} />

          {coverImagePreview ? (
            <div className="relative">
              <img
                src={coverImagePreview}
                alt="Cover preview"
                className="w-full h-48 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setCoverImagePreview(null);
                  setCoverPublicId(null);
                  setValue("coverPublicId", "");
                  if (existingCoverUrl) {
                    setValue("removeCover", true);
                  }
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
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
                    Upload Cover Image
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop an image here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Supported formats: JPG, PNG, GIF, WebP. Max 5MB.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("cover-upload")?.click()
                    }
                    disabled={isUploading}
                  >
                    {isUploading ? (
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
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Privacy */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Privacy</h2>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isPublic"
            {...register("isPublic")}
            className="rounded border-input"
          />
          <Label htmlFor="isPublic">Make this fundraiser public</Label>
        </div>
      </div>

      {/* Error Messages */}
      {localError && (
        <div className="text-destructive text-sm">{localError}</div>
      )}
      {error && <div className="text-destructive text-sm">{error}</div>}

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={loading || !isValid}>
          {loading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
