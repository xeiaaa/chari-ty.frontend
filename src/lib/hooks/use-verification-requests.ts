import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./use-api";
import { toast } from "sonner";

export interface VerificationRequestUpload {
  id: string;
  type: string;
  caption?: string;
  order: number;
  upload: {
    id: string;
    url: string;
    eagerUrl?: string;
    format: string;
    resourceType: string;
    originalFilename: string;
  };
}

export interface VerificationRequestGroup {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: "individual" | "team" | "nonprofit";
  website?: string;
  ein?: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  groupUploads: VerificationRequestUpload[];
}

export interface VerificationRequestUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  accountType: "individual" | "team" | "nonprofit";
}

export interface VerificationRequest {
  id: string;
  groupId: string;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  submittedBy: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  group: VerificationRequestGroup;
  submitter: VerificationRequestUser;
  reviewer?: VerificationRequestUser;
}

export interface VerificationRequestsResponse {
  data: VerificationRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface ListVerificationRequestsParams {
  page?: string;
  limit?: string;
  status?: "pending" | "approved" | "rejected";
  groupName?: string;
}

export function useVerificationRequests(params: ListVerificationRequestsParams = {}) {
  const api = useApi();

  return useQuery({
    queryKey: ["verification-requests", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append("page", params.page);
      if (params.limit) searchParams.append("limit", params.limit);
      if (params.status) searchParams.append("status", params.status);
      if (params.groupName) searchParams.append("groupName", params.groupName);

      const { data } = await api.get<VerificationRequestsResponse>(
        `/admin/group/verification-requests?${searchParams.toString()}`
      );
      return data;
    },
  });
}

interface UpdateVerificationRequestData {
  status: "pending" | "approved" | "rejected";
  reason?: string;
}

export function useUpdateVerificationRequest() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      data,
    }: {
      groupId: string;
      data: UpdateVerificationRequestData;
    }) => {
      const response = await api.patch<VerificationRequest>(
        `/admin/group/${groupId}/verification-request`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate verification requests queries
      queryClient.invalidateQueries({ queryKey: ["verification-requests"] });
      // Also invalidate group queries to update verification status
      queryClient.invalidateQueries({ queryKey: ["group"] });
      toast.success("Verification request updated successfully!");
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to update verification request";
      toast.error(errorMessage);
    },
  });
}