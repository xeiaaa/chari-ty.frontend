import { useQuery } from "@tanstack/react-query";
import { useApi } from "../api";

export interface GroupDetails {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: "individual" | "team" | "nonprofit";
  avatarUrl?: string;
  website?: string;
  ein?: string;
  documentsUrls?: string[];
  verified: boolean;
  createdAt: string;
  updatedAt: string;
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