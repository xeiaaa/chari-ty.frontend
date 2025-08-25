import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useApi } from "./use-api";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  setupComplete: boolean;
  isAdmin: boolean;
  bio?: string;
  // Add other user fields as needed
}

export function useUser() {
  const { isSignedIn, isLoaded } = useAuth();
  const api = useApi();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User>({
    queryKey: ["user"],
    queryFn: async () => {
      const response = await api.get("/auth/me");
      return response.data;
    },
    enabled: isSignedIn && isLoaded,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2,
  });

  return {
    user,
    isLoading: !isLoaded || isLoading,
    error,
  };
}
