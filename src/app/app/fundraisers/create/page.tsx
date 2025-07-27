"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { Button } from "@/components/ui/button";

import { useApi, getErrorMessage } from "@/lib/api";
import { useAccount } from "@/contexts/account-context";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  FundraiserForm,
  fundraiserSchema,
} from "@/components/fundraisers/FundraiserForm";

type CreateFundraiserForm = z.infer<typeof fundraiserSchema>;

export default function CreateFundraiserPage() {
  const router = useRouter();
  const api = useApi();
  const queryClient = useQueryClient();
  const { selectedAccount } = useAccount();
  const [error, setError] = useState<string | null>(null);

  // Create fundraiser mutation
  const createFundraiserMutation = useMutation({
    mutationFn: async (data: CreateFundraiserForm) => {
      const payload = {
        ...data,
        galleryUrls: data.galleryUrls?.map((g) => g.url).filter(Boolean) || [],
        endDate: data.endDate || undefined,
        groupId: selectedAccount.id,
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Link href="/app/fundraisers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Fundraisers
            </Button>
          </Link>
        </div>
        <div className="mt-4">
          <h1 className="text-3xl font-bold mb-1">Create Fundraiser</h1>
          <p className="text-muted-foreground">
            Create a new fundraiser to start raising money for your cause
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <FundraiserForm
          defaultValues={{}}
          onSubmit={(data) => createFundraiserMutation.mutate(data)}
          submitLabel="Create Fundraiser"
          loading={createFundraiserMutation.isPending}
          error={
            createFundraiserMutation.isError
              ? "Failed to create fundraiser"
              : error
              ? error
              : null
          }
        />
      </div>
    </div>
  );
}
