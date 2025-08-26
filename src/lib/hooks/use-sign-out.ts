import { useClerk } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";

export function useSignOut() {
  const { signOut } = useClerk();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    // Clear all React Query cache before signing out
    await queryClient.clear();
    // Also specifically remove user queries
    queryClient.removeQueries({ queryKey: ["user"] });
    signOut();
  };

  return { signOut: handleSignOut };
}
