import { useQuery } from "@tanstack/react-query";
import { useApi } from "../api";

export interface Invitation {
  id: string;
  type: string;
  name: string;
  role: string;
  dateActive: string;
}

export function useInvitations(enabled: boolean = true) {
  const api = useApi();

  return useQuery({
    queryKey: ["invitations"],
    queryFn: async () => {
      const { data } = await api.get<Invitation[]>("/auth/me/invites");
      return data;
    },
    enabled,
  });
}