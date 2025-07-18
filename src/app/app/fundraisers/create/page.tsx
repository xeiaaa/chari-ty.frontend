"use client";

import React, { useState } from "react";
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
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
  coverUrl: z.string().url("Cover URL must be a valid URL"),
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

  // Create fundraiser mutation
  const createFundraiserMutation = useMutation({
    mutationFn: async (data: CreateFundraiserForm) => {
      const payload = {
        ...data,
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

            <FormField<CreateFundraiserForm>
              label="Cover Image URL"
              register={register}
              name="coverUrl"
              type="url"
              required
              placeholder="https://example.com/image.jpg"
              error={getFieldError("coverUrl")}
            />

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
              disabled={!isValid || createFundraiserMutation.isPending}
              className="min-w-[120px]"
            >
              {createFundraiserMutation.isPending
                ? "Creating..."
                : "Create Fundraiser"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
