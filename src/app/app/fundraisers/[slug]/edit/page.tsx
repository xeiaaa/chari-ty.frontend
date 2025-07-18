"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { useApi, getErrorMessage } from "@/lib/api";
import { Snackbar, useSnackbar } from "@/components/ui/snackbar";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  MilestoneForm,
  EditMilestoneForm,
} from "@/components/fundraisers/milestone-form";
import { MilestoneList } from "@/components/fundraisers/milestone-list";
import type { Milestone } from "@/components/fundraisers/milestone-list";
import {
  LinkForm,
  EditLinkForm,
  type Link as LinkType,
} from "@/components/fundraisers/link-form";
import { LinkList } from "@/components/fundraisers/link-list";
import { Fundraiser } from "../page";

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

// Zod schema matching backend UpdateFundraiserDto
const updateFundraiserSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters")
    .optional(),
  summary: z
    .string()
    .min(1, "Summary is required")
    .max(200, "Summary must be less than 200 characters")
    .optional(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description must be less than 5000 characters")
    .optional(),
  category: z
    .enum([
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
    ])
    .optional(),
  goalAmount: z.coerce
    .number()
    .min(1, "Goal amount must be greater than 0")
    .optional(),
  currency: z.string().min(1, "Currency is required").optional(),
  endDate: z.string().optional(),
  coverUrl: z.string().url("Cover URL must be a valid URL").optional(),
  galleryUrls: z
    .array(z.object({ url: z.string().url("Gallery URL must be a valid URL") }))
    .optional(),
  isPublic: z.boolean().optional(),
});

type UpdateFundraiserForm = z.infer<typeof updateFundraiserSchema>;

export default function EditFundraiserPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const api = useApi();
  const queryClient = useQueryClient();

  const [error, setError] = useState<string | null>(null);
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();

  // Fetch existing fundraiser data
  const {
    data: fundraiser,
    isLoading: isLoadingFundraiser,
    error: fetchError,
  } = useQuery<Fundraiser>({
    queryKey: ["fundraiser", slug],
    queryFn: async () => {
      const response = await api.get(`/fundraisers/${slug}`);
      return response.data;
    },
  });

  const form = useForm<UpdateFundraiserForm>({
    resolver: zodResolver(updateFundraiserSchema),
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
    reset,
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

  // Milestone edit state
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null
  );
  // Link edit state
  const [editingLink, setEditingLink] = useState<LinkType | null>(null);

  // Update form when fundraiser data is loaded
  React.useEffect(() => {
    if (fundraiser) {
      reset({
        title: fundraiser.title,
        summary: fundraiser.summary,
        description: fundraiser.description,
        category: fundraiser.category as
          | "education"
          | "health"
          | "disaster_relief"
          | "environment"
          | "animals"
          | "children"
          | "community"
          | "arts"
          | "sports"
          | "food"
          | "housing"
          | "technology"
          | "other",
        goalAmount: parseFloat(fundraiser.goalAmount),
        currency: fundraiser.currency,
        endDate: fundraiser.endDate || "",
        coverUrl: fundraiser.coverUrl,
        galleryUrls: fundraiser.galleryUrls.map((url: string) => ({ url })),
        isPublic: fundraiser.isPublic,
      });
    }
  }, [fundraiser, reset]);

  // Update fundraiser mutation
  const updateFundraiserMutation = useMutation({
    mutationFn: async (data: UpdateFundraiserForm) => {
      const payload = {
        ...data,
        galleryUrls: data.galleryUrls?.map((g) => g.url).filter(Boolean) || [],
        endDate: data.endDate || undefined,
      };
      const response = await api.patch(
        `/fundraisers/${fundraiser!.id}`,
        payload
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fundraisers"] });
      queryClient.invalidateQueries({ queryKey: ["fundraiser", slug] });
      showSnackbar("Fundraiser updated successfully!", "success");
      // Delay navigation to allow snackbar to be seen
      setTimeout(() => {
        router.push(`/app/fundraisers/${slug}`);
      }, 1500);
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      showSnackbar(errorMessage, "error");
    },
  });

  const onSubmit = (data: UpdateFundraiserForm) => {
    setError(null);
    updateFundraiserMutation.mutate(data);
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

  if (fetchError) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/app/fundraisers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back to Fundraisers
              </Button>
            </Link>
          </div>
          <div className="text-center py-8">
            <p className="text-destructive text-lg">
              Failed to load fundraiser
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {fetchError instanceof Error
                ? fetchError.message
                : "Unknown error"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingFundraiser) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/app/fundraisers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back to Fundraisers
              </Button>
            </Link>
          </div>
          <div className="space-y-6">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="space-y-4">
              <div className="h-6 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-6 bg-muted animate-pulse rounded w-1/2" />
              <div className="h-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!fundraiser) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/app/fundraisers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back to Fundraisers
              </Button>
            </Link>
          </div>
          <div className="text-center py-8">
            <p className="text-lg">Fundraiser not found</p>
            <p className="text-sm text-muted-foreground mt-2">
              The fundraiser you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have access to it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card border border-border rounded-lg shadow-sm p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <Link href={`/app/fundraisers/${slug}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Fundraiser
            </Button>
          </Link>
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Edit {fundraiser.title}</h1>
            <p className="text-muted-foreground">
              Update your fundraiser information
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField<UpdateFundraiserForm>
                label="Title"
                register={register}
                name="title"
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

            <FormField<UpdateFundraiserForm>
              label="Summary"
              register={register}
              name="summary"
              placeholder="Brief description of your fundraiser"
              error={getFieldError("summary")}
            />

            <FormField<UpdateFundraiserForm>
              label="Description"
              register={register}
              name="description"
              textarea
              placeholder="Detailed description of your fundraiser, its purpose, and how funds will be used"
              error={getFieldError("description")}
            />
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Financial Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField<UpdateFundraiserForm>
                label="Goal Amount"
                register={register}
                name="goalAmount"
                type="number"
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

            <FormField<UpdateFundraiserForm>
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

            <FormField<UpdateFundraiserForm>
              label="Cover Image URL"
              register={register}
              name="coverUrl"
              type="url"
              placeholder="https://example.com/image.jpg"
              error={getFieldError("coverUrl")}
            />

            <div className="space-y-2">
              <Label>Gallery Images (Optional)</Label>
              {galleryFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <FormField<UpdateFundraiserForm>
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
              disabled={!isValid || updateFundraiserMutation.isPending}
              className="min-w-[120px]"
            >
              {updateFundraiserMutation.isPending
                ? "Updating..."
                : "Update Fundraiser"}
            </Button>
          </div>
        </form>

        {/* Milestones Section */}
        <div className="mt-12">
          {fundraiser && (
            <>
              {editingMilestone ? (
                <EditMilestoneForm
                  slug={slug}
                  milestone={editingMilestone}
                  onSuccess={() => {
                    showSnackbar("Milestone updated successfully!", "success");
                    setEditingMilestone(null);
                  }}
                  onError={(error) => showSnackbar(error, "error")}
                  onCancel={() => setEditingMilestone(null)}
                />
              ) : (
                <MilestoneForm
                  slug={slug}
                  onSuccess={() =>
                    showSnackbar("Milestone created successfully!", "success")
                  }
                  onError={(error) => showSnackbar(error, "error")}
                />
              )}
              <MilestoneList
                fundraiserId={slug}
                currency={fundraiser.currency}
                onEditMilestone={setEditingMilestone}
              />
            </>
          )}
        </div>

        {/* Links Section */}
        <div className="mt-12">
          {fundraiser && (
            <>
              {editingLink ? (
                <EditLinkForm
                  fundraiserId={fundraiser.id}
                  link={editingLink}
                  onSuccess={() => {
                    showSnackbar("Link updated successfully!", "success");
                    setEditingLink(null);
                  }}
                  onError={(error) => showSnackbar(error, "error")}
                  onCancel={() => setEditingLink(null)}
                />
              ) : (
                <LinkForm
                  fundraiserId={fundraiser.id}
                  onSuccess={() =>
                    showSnackbar("Link created successfully!", "success")
                  }
                  onError={(error) => showSnackbar(error, "error")}
                />
              )}
              <LinkList fundraiser={fundraiser} onEditLink={setEditingLink} />
            </>
          )}
        </div>
      </div>
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
