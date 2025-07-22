import { useQuery } from "@tanstack/react-query";
import { useApi } from "../api";

export interface GroupDetails {
  id: string;
  name: string;
  type: string;
  slug: string;
  stripeId?: string;
  createdAt: string;
  updatedAt: string;
  members: Array<{
    id: string;
    userId: string;
    role: string;
    status: string;
    createdAt: string;
  }>;
}

export function useGroupBySlug(slug: string, enabled: boolean = true) {
  const api = useApi();

  return useQuery({
    queryKey: ["group", slug],
    queryFn: async () => {
      const { data } = await api.get<GroupDetails>(`/groups/slug/${slug}`);
      return data;
    },
    enabled: enabled && !!slug,
  });
}