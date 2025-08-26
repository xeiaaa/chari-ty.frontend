import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useApi } from "./use-api";
import { useEffect } from "react";

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
  const { isSignedIn, isLoaded, userId } = useAuth();
  const api = useApi();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User>({
    queryKey: ["user", userId],
    queryFn: async () => {
      const response = await api.get("/auth/me");
      return response.data;
    },
    enabled: isSignedIn && isLoaded && !!userId,
    staleTime: 0, // No cache - always fetch fresh data
    retry: 2,
  });

  // Clear user cache when not signed in
  useEffect(() => {
    if (!isSignedIn && isLoaded) {
      queryClient.removeQueries({ queryKey: ["user"] });
    }
  }, [isSignedIn, isLoaded, queryClient]);

  return {
    user,
    isLoading: !isLoaded || isLoading,
    error,
  };
}
