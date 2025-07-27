import { useQuery } from "@tanstack/react-query";
import { useApi } from "../api";
import { useDebounce } from "./use-debounce";

export interface SearchUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string | null;
}

interface SearchUsersParams {
  q: string;
  limit?: number;
  groupId?: string;
}

export function useSearchUsers(params: SearchUsersParams) {
  const api = useApi();
  const debouncedQuery = useDebounce(params.q, 500);

  return useQuery({
    queryKey: ["search-users", debouncedQuery, params.limit, params.groupId],
    queryFn: async () => {
      if (!debouncedQuery.trim()) {
        return [];
      }

      const searchParams = new URLSearchParams({
        q: debouncedQuery.trim(),
        ...(params.limit && { limit: params.limit.toString() }),
        ...(params.groupId && { groupId: params.groupId }),
      });

      const { data } = await api.get<SearchUser[]>(`/users/search?${searchParams}`);
      return data;
    },
    enabled: !!debouncedQuery.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}