import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "../api";

export interface UpdateGroupData {
  name?: string;
  description?: string;
  avatarUrl?: string;
  website?: string;
  ein?: string;
  documentsUrls?: string[];
}

export function useUpdateGroup() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, data }: { slug: string; data: UpdateGroupData }) => {
      const response = await api.patch(`/groups/slug/${slug}`, data);
      return response.data;
    },
    onSuccess: (data, { slug }) => {
      // Invalidate and refetch the specific group
      queryClient.invalidateQueries({ queryKey: ["group", slug] });
      // Also invalidate the groups list
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}