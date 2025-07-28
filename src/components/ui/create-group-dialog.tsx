"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { FormSelect } from "@/components/ui/form-select";
import { useAccount } from "@/contexts/account-context";
import { useApi } from "@/lib/api";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createGroupSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional(),
  type: z.enum(["team", "nonprofit"]),
  avatarUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  website: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  ein: z.string().optional(),
  documentsUrls: z.array(z.string().url()).optional(),
});

type CreateGroupFormData = z.infer<typeof createGroupSchema>;

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupDialog({
  open,
  onOpenChange,
}: CreateGroupDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const { setSelectedAccount } = useAccount();
  const queryClient = useQueryClient();
  const router = useRouter();
  const api = useApi();

  const form = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "team",
      avatarUrl: "",
      website: "",
      ein: "",
      documentsUrls: [],
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = form;

  const createGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupFormData) => {
      const response = await api.post("/groups", data);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch groups
      queryClient.invalidateQueries({ queryKey: ["groups"] });

      // Set the newly created group as the selected account
      const newAccount = {
        id: data.group.id,
        type: data.group.type as "team" | "nonprofit" | "individual",
        name: data.group.name,
        role: "owner",
        dateActive: new Date().toISOString(),
        slug: data.group.slug,
      };
      setSelectedAccount(newAccount);

      // Close dialog and reset form
      onOpenChange(false);
      form.reset();
      setError(null);

      // Navigate to the new group's dashboard
      router.push(`/app/dashboard`);
    },
    onError: (error: unknown) => {
      console.error("Failed to create group:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create group. Please try again.";
      setError(errorMessage);
    },
  });

  const handleFormSubmit = async (data: CreateGroupFormData) => {
    setError(null);

    // Validate EIN for nonprofit type
    if (data.type === "nonprofit" && (!data.ein || data.ein.trim() === "")) {
      setError("EIN is required for nonprofit groups");
      return;
    }

    // Clean up the data - remove empty strings
    const cleanedData = {
      ...data,
      description: data.description || undefined,
      avatarUrl: data.avatarUrl || undefined,
      website: data.website || undefined,
      ein: data.ein || undefined,
      documentsUrls:
        data.documentsUrls?.filter((url) => url.trim()) || undefined,
    };

    createGroupMutation.mutate(cleanedData);
  };

  const getFieldError = (field: string) =>
    errors[field as keyof typeof errors]?.message;

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form and error state when dialog closes
      form.reset();
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a new team or nonprofit organization to start fundraising
              together.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField<CreateGroupFormData>
              label="Group Name *"
              register={register}
              name="name"
              required
              placeholder="Enter group name"
              error={getFieldError("name")}
            />

            <FormSelect<CreateGroupFormData>
              label="Group Type *"
              name="type"
              options={[
                { value: "team", label: "Team" },
                { value: "nonprofit", label: "Nonprofit" },
              ]}
              register={register}
              error={getFieldError("type")}
            />

            <FormField<CreateGroupFormData>
              label="Description"
              register={register}
              name="description"
              textarea
              placeholder="Describe your group's mission and purpose"
              error={getFieldError("description")}
            />

            <FormField<CreateGroupFormData>
              label="Website"
              register={register}
              name="website"
              placeholder="https://example.com"
              error={getFieldError("website")}
            />

            <FormField<CreateGroupFormData>
              label={`EIN ${watch("type") === "nonprofit" ? "*" : ""}`}
              register={register}
              name="ein"
              placeholder="12-3456789"
              disabled={watch("type") !== "nonprofit"}
              error={getFieldError("ein")}
            />

            {error && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={createGroupMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createGroupMutation.isPending}>
                {createGroupMutation.isPending ? "Creating..." : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
