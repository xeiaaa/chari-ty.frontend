import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "../api";
import { toast } from "sonner";

interface InviteUserData {
  userId?: string;
  email?: string;
  role: "viewer" | "editor" | "admin";
}

interface InviteUserParams {
  groupId: string;
  data: InviteUserData;
}

export function useInviteUser() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, data }: InviteUserParams) => {
      const { data: response } = await api.post(`/groups/${groupId}/invites`, data);
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch group details to show updated members
      queryClient.invalidateQueries({ queryKey: ["group"] });
      toast.success("Invitation sent successfully!");
    },
    onError: (error) => {
      // Show error toast with user-friendly message
      const errorMessage = error instanceof Error ? error.message : "Failed to send invitation";
      toast.error(errorMessage);
      console.error("Error inviting user:", error);
    },
  });
}