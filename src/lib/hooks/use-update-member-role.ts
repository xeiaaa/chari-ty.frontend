import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "../api";
import { GroupDetails } from "./use-group-by-slug";

interface UpdateMemberRoleData {
  groupId: string;
  memberId: string;
  role: string;
}

interface UpdateMemberRoleResponse {
  id: string;
  userId: string;
  groupId: string;
  role: string;
  status: string;
  updatedAt: string;
}

export function useUpdateMemberRole() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateMemberRoleData): Promise<UpdateMemberRoleResponse> => {
      const response = await api.patch<UpdateMemberRoleResponse>(
        `/groups/${data.groupId}/members/${data.memberId}`,
        { role: data.role }
      );
      return response.data;
    },
    onMutate: async (data) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["group"] });

      // Snapshot the previous value
      const previousGroups = queryClient.getQueriesData({ queryKey: ["group"] });

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: ["group"] }, (old: GroupDetails | undefined) => {
        if (!old) return old;
        return {
          ...old,
          members: old.members.map((member) =>
            member.id === data.memberId
              ? { ...member, role: data.role as "admin" | "editor" | "viewer" }
              : member
          ),
        };
      });

      // Return a context object with the snapshotted value
      return { previousGroups };
    },
    onError: (err, data, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousGroups) {
        queryClient.setQueriesData({ queryKey: ["group"] }, context.previousGroups);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["group"] });
    },
  });
}