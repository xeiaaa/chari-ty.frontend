import { useQuery } from "@tanstack/react-query";
import { useApi } from "../api";

export interface Group {
  id: string;
  type: string;
  name: string;
  role: string;
  dateActive: string;
  slug: string;
}

export function useGroups(enabled: boolean = true) {
  const api = useApi();

  return useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const { data } = await api.get<Group[]>("/auth/me/groups");
      return data;
    },
    enabled,
  });
}
