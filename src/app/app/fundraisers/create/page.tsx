"use client";

import React, { useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { useApi, getErrorMessage } from "@/lib/api";
import { useAccount } from "@/contexts/account-context";
import { ArrowLeft, Upload, X } from "lucide-react";
import Link from "next/link";
import axios from "axios";

// Enum values from backend
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

// Upload signature response type
interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
}

// Zod schema matching backend CreateFundraiserDto
const createFundraiserSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  summary: z
    .string()
    .min(1, "Summary is required")
    .max(200, "Summary must be less than 200 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description must be less than 5000 characters"),
  category: z.enum([
    "education",
    "health",
    "disaster_relief",
    "environment",
    "animals",
    "children",
    "community",
    "arts",
    "sports",
    "food",
    "housing",
    "technology",
    "other",
  ]),
  goalAmount: z.coerce.number().min(1, "Goal amount must be greater than 0"),
  currency: z.string().min(1, "Currency is required"),
  endDate: z.string().optional(),
  coverUrl: z.string().optional(),
  galleryUrls: z
    .array(z.object({ url: z.string().url("Gallery URL must be a valid URL") }))
    .optional(),
  isPublic: z.boolean().optional(),
});

type CreateFundraiserForm = z.infer<typeof createFundraiserSchema>;

export default function CreateFundraiserPage() {
  const router = useRouter();
  const api = useApi();
  const queryClient = useQueryClient();
  const { selectedAccount, isPersonalAccount } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreateFundraiserForm>({
    resolver: zodResolver(createFundraiserSchema),
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
    append: appendGallery,
    remove: removeGallery,
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
    mutationFn: async ({
      file,
      signature,
    }: {
      file: File;
      signature: UploadSignature;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signature.apiKey);
      formData.append("timestamp", signature.timestamp.toString());
      formData.append("signature", signature.signature);
      formData.append("folder", "fundraisers");

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
  });

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      setCoverImage(file);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      // Get upload signature
      const signature = await getUploadSignatureMutation.mutateAsync();

      // Upload to Cloudinary
      const result = await uploadToCloudinaryMutation.mutateAsync({
        file,
        signature,
      });

      return result.secure_url;
    } catch {
      throw new Error("Failed to upload image");
    }
  };

  // Create fundraiser mutation
  const createFundraiserMutation = useMutation({
    mutationFn: async (data: CreateFundraiserForm) => {
      let coverUrl = data.coverUrl;

      // Upload cover image if selected
      if (coverImage) {
        coverUrl = await handleFileUpload(coverImage);
      }

      const payload = {
        ...data,
        coverUrl,
        galleryUrls: data.galleryUrls?.map((g) => g.url).filter(Boolean) || [],
        endDate: data.endDate || undefined,
        ownerType: isPersonalAccount ? "user" : "group",
        userId: isPersonalAccount ? undefined : undefined, // Will be set by backend from auth
        groupId: isPersonalAccount ? undefined : selectedAccount.id,
      };
      const response = await api.post("/fundraisers", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fundraisers"] });
      router.push("/app/fundraisers");
    },
    onError: (error) => {
      setError(getErrorMessage(error));
    },
  });

  const onSubmit = (data: CreateFundraiserForm) => {
    setError(null);

    // Validate that either coverUrl is provided or coverImage is selected
    if (!data.coverUrl && !coverImage) {
      setError("Cover image is required");
      return;
    }

    createFundraiserMutation.mutate(data);
  };

  const getFieldError = (field: string) => {
    return errors[field as keyof typeof errors]?.message;
  };

  const getArrayFieldError = (
    field: string,
    index: number,
    subField: string
  ) => {
    const fieldErrors = errors[field as keyof typeof errors] as {
      [key: number]: { [key: string]: { message: string } };
    };
    return fieldErrors?.[index]?.[subField]?.message ?? "";
  };

  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
    setValue("coverUrl", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Check if form is valid (including cover image validation)
  const isFormValid = isValid && (coverImage || form.getValues("coverUrl"));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card border border-border rounded-lg shadow-sm p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/app/fundraisers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Fundraisers
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Create Fundraiser</h1>
            <p className="text-muted-foreground">
              Create a new fundraiser to start raising money for your cause
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField<CreateFundraiserForm>
                label="Title"
                register={register}
                name="title"
                required
                placeholder="Enter fundraiser title"
                error={getFieldError("title")}
              />

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  {...register("category")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  {FUNDRAISER_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {getFieldError("category") && (
                  <span className="text-destructive text-xs">
                    {getFieldError("category")}
                  </span>
                )}
              </div>
            </div>

            <FormField<CreateFundraiserForm>
              label="Summary"
              register={register}
              name="summary"
              required
              placeholder="Brief description of your fundraiser"
              error={getFieldError("summary")}
            />

            <FormField<CreateFundraiserForm>
              label="Description"
              register={register}
              name="description"
              textarea
              required
              placeholder="Detailed description of your fundraiser, its purpose, and how funds will be used"
              error={getFieldError("description")}
            />
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Financial Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField<CreateFundraiserForm>
                label="Goal Amount"
                register={register}
                name="goalAmount"
                type="number"
                required
                placeholder="0"
                error={getFieldError("goalAmount")}
              />

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  {...register("currency")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
                {getFieldError("currency") && (
                  <span className="text-destructive text-xs">
                    {getFieldError("currency")}
                  </span>
                )}
              </div>
            </div>

            <FormField<CreateFundraiserForm>
              label="End Date (Optional)"
              register={register}
              name="endDate"
              type="date"
              error={getFieldError("endDate")}
            />
          </div>

          {/* Media */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Media</h2>

            {/* Cover Image Upload */}
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <input type="hidden" {...register("coverUrl")} />

              {coverImagePreview ? (
                <div className="relative">
                  <img
                    src={coverImagePreview}
                    alt="Cover preview"
                    className="w-full h-48 object-cover rounded-lg border border-border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeCoverImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    PNG, JPG, GIF up to 5MB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose Image
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

              {getFieldError("coverUrl") && (
                <span className="text-destructive text-xs">
                  {getFieldError("coverUrl")}
                </span>
              )}
              {!coverImage && !form.getValues("coverUrl") && (
                <span className="text-destructive text-xs">
                  Cover image is required
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label>Gallery Images (Optional)</Label>
              {galleryFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <FormField<CreateFundraiserForm>
                      label={`Gallery Image ${index + 1}`}
                      register={register}
                      name={`galleryUrls.${index}.url` as const}
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      error={getArrayFieldError("galleryUrls", index, "url")}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeGallery(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => appendGallery({ url: "" })}
              >
                Add Gallery Image
              </Button>
            </div>
          </div>

          {/* Owner Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Owner Information</h2>

            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Creating fundraiser for:
                </span>
                <span className="text-sm">{selectedAccount.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({isPersonalAccount ? "Personal" : "Group"})
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                You can change this using the account switcher in the top-left
                corner.
              </p>
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

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              disabled={
                !isFormValid ||
                createFundraiserMutation.isPending ||
                getUploadSignatureMutation.isPending ||
                uploadToCloudinaryMutation.isPending
              }
              className="min-w-[120px]"
            >
              {createFundraiserMutation.isPending ||
              getUploadSignatureMutation.isPending ||
              uploadToCloudinaryMutation.isPending
                ? "Creating..."
                : "Create Fundraiser"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
