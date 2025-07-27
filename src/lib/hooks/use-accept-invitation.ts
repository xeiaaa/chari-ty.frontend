import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "../api";

interface AcceptInvitationData {
  groupId: string;
}

interface AcceptInvitationResponse {
  message: string;
  groupMember: {
    id: string;
    userId: string;
    groupId: string;
    role: string;
    status: string;
    joinedAt: string;
    group: {
      id: string;
      name: string;
      type: string;
    };
  };
}

export function useAcceptInvitation() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AcceptInvitationData): Promise<AcceptInvitationResponse> => {
      const response = await api.post<AcceptInvitationResponse>("/auth/accept-invitation", data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch invitations to remove accepted ones
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      // Also invalidate groups to show the newly joined group
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}