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

// Zod schemas matching backend DTOs
const createLinkSchema = z.object({
  alias: z
    .string()
    .min(1, "Alias is required")
    .max(50, "Alias must be at most 50 characters"),
  note: z.string().max(500, "Note must be at most 500 characters").optional(),
});

const updateLinkSchema = z.object({
  alias: z
    .string()
    .min(1, "Alias is required")
    .max(50, "Alias must be at most 50 characters")
    .optional(),
  note: z.string().max(500, "Note must be at most 500 characters").optional(),
});

type CreateLinkFormType = z.infer<typeof createLinkSchema>;
type UpdateLinkFormType = z.infer<typeof updateLinkSchema>;

export interface Link {
  id: string;
  fundraiserId: string;
  alias: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

interface LinkFormProps {
  fundraiserId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function LinkForm({ fundraiserId, onSuccess, onError }: LinkFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();
  const queryClient = useQueryClient();

  const form = useForm<CreateLinkFormType>({
    resolver: zodResolver(createLinkSchema),
    defaultValues: {
      alias: "",
      note: "",
    },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = form;

  const createLinkMutation = useMutation({
    mutationFn: async (data: CreateLinkFormType) => {
      const response = await api.post(
        `/fundraisers/${fundraiserId}/links`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links", fundraiserId] });
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

  const onSubmit = (data: CreateLinkFormType) => {
    setError(null);
    createLinkMutation.mutate(data);
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
        <h2 className="text-xl font-semibold">Links</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Link
        </Button>
      </div>
      {showForm && (
        <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-4">Add New Link</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField<CreateLinkFormType>
              label="Alias"
              register={register}
              name="alias"
              required
              placeholder="Enter alias"
              error={getFieldError("alias")}
            />
            <FormField<CreateLinkFormType>
              label="Note (optional)"
              register={register}
              name="note"
              textarea
              placeholder="Add a note (optional)"
              error={getFieldError("note")}
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
                disabled={!isValid || createLinkMutation.isPending}
              >
                {createLinkMutation.isPending ? "Adding..." : "Add Link"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

interface EditLinkFormProps {
  fundraiserId: string;
  link: Link;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export function EditLinkForm({
  fundraiserId,
  link,
  onSuccess,
  onError,
  onCancel,
}: EditLinkFormProps) {
  const [error, setError] = useState<string | null>(null);
  const api = useApi();
  const queryClient = useQueryClient();

  const form = useForm<UpdateLinkFormType>({
    resolver: zodResolver(updateLinkSchema),
    defaultValues: {
      alias: link.alias,
      note: link.note || "",
    },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = form;

  const updateLinkMutation = useMutation({
    mutationFn: async (data: UpdateLinkFormType) => {
      const response = await api.patch(
        `/fundraisers/${fundraiserId}/links/${link.id}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links", fundraiserId] });
      setError(null);
      onSuccess?.();
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      onError?.(errorMessage);
    },
  });

  const onSubmit = (data: UpdateLinkFormType) => {
    setError(null);
    updateLinkMutation.mutate(data);
  };

  const getFieldError = (field: string) => {
    return errors[field as keyof typeof errors]?.message;
  };

  return (
    <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
      <h3 className="font-semibold mb-4">Edit Link</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField<UpdateLinkFormType>
          label="Alias"
          register={register}
          name="alias"
          placeholder="Enter alias"
          error={getFieldError("alias")}
        />
        <FormField<UpdateLinkFormType>
          label="Note (optional)"
          register={register}
          name="note"
          textarea
          placeholder="Add a note (optional)"
          error={getFieldError("note")}
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
            disabled={!isValid || updateLinkMutation.isPending}
          >
            {updateLinkMutation.isPending ? "Updating..." : "Update Link"}
          </Button>
        </div>
      </form>
    </div>
  );
}
