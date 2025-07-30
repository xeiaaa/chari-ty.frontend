"use client";

import React, { useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import * as z from "zod";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormSelect } from "@/components/ui/form-select";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { useApi } from "@/lib/api";
import type { FormSelectOption } from "@/components/ui/form-select";

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

interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
}

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
  coverUrl: z.string().optional(),
  galleryUrls: z
    .array(z.object({ url: z.string().url("Gallery URL must be a valid URL") }))
    .optional(),
  isPublic: z.boolean().optional(),
});

export type FundraiserFormData = z.infer<typeof fundraiserSchema>;

interface FundraiserFormProps {
  defaultValues?: Partial<FundraiserFormData>;
  onSubmit: (data: FundraiserFormData) => void;
  submitLabel?: string;
  loading?: boolean;
  error?: string | null;
  onRemoveCover?: () => void;
}

export function FundraiserForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save",
  loading = false,
  error,
  onRemoveCover,
}: FundraiserFormProps) {
  const api = useApi();
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      coverUrl: "",
      galleryUrls: [],
      isPublic: true,
      ...defaultValues,
    },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isValid },
  } = form;

  // Gallery URLs field array
  const {
    fields: galleryFields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "galleryUrls",
  });

  // Get upload signature mutation
  const getUploadSignatureMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/uploads/signature", {
        folder: "fundraisers",
      });
      return response.data as UploadSignature;
    },
  });

  // Upload to Cloudinary mutation
  const uploadToCloudinaryMutation = useMutation({
    mutationFn: async (file: File): Promise<CloudinaryAsset> => {
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
    },
  });

  // Handle file selection and immediate upload
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setLocalError("Please select an image file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setLocalError("Image size must be less than 10MB");
        return;
      }

      setLocalError(null);
      setIsUploadingCover(true);

      // Create immediate preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      try {
        // Upload immediately
        const result = await uploadToCloudinaryMutation.mutateAsync(file);
        setValue("coverUrl", result.url);
        // File is now uploaded and URL is set in form
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to upload image";
        setLocalError(message);
        setCoverImagePreview(null);
      } finally {
        setIsUploadingCover(false);
      }
    }
  };

  const internalSubmit = async (data: FundraiserFormData) => {
    setLocalError(null);
    if (!data.coverUrl) {
      setLocalError("Cover image is required");
      return;
    }

    onSubmit({ ...data, coverUrl: data.coverUrl });
  };

  const getFieldError = (field: string) =>
    errors[field as keyof typeof errors]?.message;

  const getArrayFieldError = (field: string, index: number, subField: string) =>
    (
      errors[field as keyof typeof errors] as {
        [key: number]: { [key: string]: { message: string } };
      }
    )?.[index]?.[subField]?.message ?? "";

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
          <input type="hidden" {...register("coverUrl")} />
          {coverImagePreview ? (
            <div className="relative">
              <img
                src={coverImagePreview}
                alt="Cover preview"
                className="w-full h-48 object-cover rounded-lg border"
              />
              {isUploadingCover && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">
                      Uploading...
                    </p>
                  </div>
                </div>
              )}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setCoverImagePreview(null);
                  setValue("coverUrl", "");
                  onRemoveCover?.();
                }}
                disabled={isUploadingCover}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed p-6 text-center rounded-lg">
              <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingCover}
              >
                {isUploadingCover ? "Uploading..." : "Choose Image"}
              </Button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div className="space-y-2">
          <Label>Gallery Images (Optional)</Label>
          {galleryFields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-end">
              <FormField<FundraiserFormData>
                label={`Gallery Image ${index + 1}`}
                register={register}
                name={`galleryUrls.${index}.url` as const}
                type="url"
                placeholder="https://example.com/image.jpg"
                error={getArrayFieldError("galleryUrls", index, "url")}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => remove(index)}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ url: "" })}
          >
            Add Gallery Image
          </Button>
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
        <Button
          type="submit"
          disabled={loading || uploadToCloudinaryMutation.isPending || !isValid}
        >
          {loading || uploadToCloudinaryMutation.isPending
            ? "Saving..."
            : submitLabel}
        </Button>
      </div>
    </form>
  );
}
