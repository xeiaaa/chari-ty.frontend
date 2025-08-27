"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { Button } from "../ui/button";
import { FormField } from "../ui/form-field";
import { useApi, getErrorMessage } from "@/lib/api";
import { Plus } from "lucide-react";

// Zod schema matching backend CreateMilestoneDto
const createMilestoneSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  purpose: z
    .string()
    .min(1, "Purpose is required")
    .max(500, "Purpose must be less than 500 characters"),
});

// Zod schema matching backend UpdateMilestoneDto
const updateMilestoneSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be greater than 0").optional(),
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters")
    .optional(),
  purpose: z
    .string()
    .min(1, "Purpose is required")
    .max(500, "Purpose must be less than 500 characters")
    .optional(),
});

type CreateMilestoneForm = z.infer<typeof createMilestoneSchema>;
type UpdateMilestoneForm = z.infer<typeof updateMilestoneSchema>;

interface Milestone {
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
}

interface MilestoneFormProps {
  fundraiserId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface EditMilestoneFormProps {
  slug: string;
  fundraiserId: string;
  milestone: Milestone;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export function MilestoneForm({
  fundraiserId,
  onSuccess,
  onError,
}: MilestoneFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();
  const queryClient = useQueryClient();
  console.log("fundraiserId", fundraiserId);
  const form = useForm<CreateMilestoneForm>({
    resolver: zodResolver(createMilestoneSchema),
    defaultValues: {
      amount: 0,
      title: "",
      purpose: "",
    },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = form;

  // Create milestone mutation
  const createMilestoneMutation = useMutation({
    mutationFn: async (data: CreateMilestoneForm) => {
      const response = await api.post(
        `/fundraisers/${fundraiserId}/milestones`,
        data
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", fundraiserId] });
      reset();
      setShowForm(false);
      setError(null);
      onSuccess?.();
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      onError?.(errorMessage);
    },
  });

  const onSubmit = (data: CreateMilestoneForm) => {
    setError(null);
    createMilestoneMutation.mutate(data);
  };

  const getFieldError = (field: string) => {
    return errors[field as keyof typeof errors]?.message;
  };

  const handleCancel = () => {
    setShowForm(false);
    reset();
    setError(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Milestones</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      {/* Add Milestone Form */}
      {showForm && (
        <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-4">Add New Milestone</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField<CreateMilestoneForm>
                label="Amount"
                register={register}
                name="amount"
                type="number"
                placeholder="0"
                error={getFieldError("amount")}
              />

              <FormField<CreateMilestoneForm>
                label="Title"
                register={register}
                name="title"
                placeholder="Milestone title"
                error={getFieldError("title")}
              />
            </div>

            <FormField<CreateMilestoneForm>
              label="Purpose"
              register={register}
              name="purpose"
              textarea
              placeholder="What will this milestone achieve?"
              error={getFieldError("purpose")}
            />

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isValid || createMilestoneMutation.isPending}
              >
                {createMilestoneMutation.isPending
                  ? "Adding..."
                  : "Add Milestone"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export function EditMilestoneForm({
  slug,
  fundraiserId,
  milestone,
  onSuccess,
  onError,
  onCancel,
}: EditMilestoneFormProps) {
  const [error, setError] = useState<string | null>(null);
  const api = useApi();
  const queryClient = useQueryClient();

  const form = useForm<UpdateMilestoneForm>({
    resolver: zodResolver(updateMilestoneSchema),
    defaultValues: {
      amount: parseFloat(milestone.amount),
      title: milestone.title,
      purpose: milestone.purpose,
    },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = form;

  // Update milestone mutation
  const updateMilestoneMutation = useMutation({
    mutationFn: async (data: UpdateMilestoneForm) => {
      const response = await api.patch(
        `/fundraisers/${fundraiserId}/milestones/${milestone.id}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones", slug] });
      setError(null);
      onSuccess?.();
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      onError?.(errorMessage);
    },
  });

  const onSubmit = (data: UpdateMilestoneForm) => {
    setError(null);
    updateMilestoneMutation.mutate(data);
  };

  const getFieldError = (field: string) => {
    return errors[field as keyof typeof errors]?.message;
  };

  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
      <h3 className="font-semibold mb-4">Edit Milestone</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField<UpdateMilestoneForm>
            label="Amount"
            register={register}
            name="amount"
            type="number"
            placeholder="0"
            error={getFieldError("amount")}
          />

          <FormField<UpdateMilestoneForm>
            label="Title"
            register={register}
            name="title"
            placeholder="Milestone title"
            error={getFieldError("title")}
          />
        </div>

        <FormField<UpdateMilestoneForm>
          label="Purpose"
          register={register}
          name="purpose"
          textarea
          placeholder="What will this milestone achieve?"
          error={getFieldError("purpose")}
        />

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isValid || updateMilestoneMutation.isPending}
          >
            {updateMilestoneMutation.isPending
              ? "Updating..."
              : "Update Milestone"}
          </Button>
        </div>
      </form>
    </div>
  );
}
