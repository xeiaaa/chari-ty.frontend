import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApi } from "./use-api";
import { toast } from "sonner";

interface SubmitVerificationRequestData {
  reason?: string;
}

interface VerificationRequestResponse {
  id: string;
  groupId: string;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  createdAt: string;
  updatedAt: string;
  group: {
    id: string;
    name: string;
    slug: string;
  };
  submitter: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function useSubmitVerificationRequest() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitVerificationRequest = async (
    groupId: string,
    data: SubmitVerificationRequestData
  ): Promise<VerificationRequestResponse | null> => {
    setIsSubmitting(true);

    try {
      const response = await api.post<VerificationRequestResponse>(
        `/groups/${groupId}/verification-request`,
        data
      );

      // Invalidate group queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: ["group"] });

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit verification request";
      toast.error(errorMessage);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitVerificationRequest,
    isSubmitting,
  };
}