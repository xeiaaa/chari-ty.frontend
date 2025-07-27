import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "../api";

interface RemoveMemberData {
  groupId: string;
  memberId: string;
}

interface RemoveMemberResponse {
  message: string;
}

import { GroupDetails } from "./use-group-by-slug";

export function useRemoveMember() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RemoveMemberData): Promise<RemoveMemberResponse> => {
      const response = await api.delete<RemoveMemberResponse>(
        `/groups/${data.groupId}/members/${data.memberId}`
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
          members: old.members.filter((member) => member.id !== data.memberId),
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