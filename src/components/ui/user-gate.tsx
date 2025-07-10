"use client";
import { useUser } from "@/lib/hooks/use-user";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface UserGateProps {
  children: React.ReactNode;
  requireSetup?: boolean;
}

export function UserGate({ children, requireSetup = true }: UserGateProps) {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/");
      } else if (requireSetup && !user.setupComplete) {
        router.push("/onboarding");
      }
    }
  }, [user, isLoading, router, requireSetup]);

  if (isLoading) {
    return <div>Loading...</div>; // Consider using a proper loading spinner
  }

  if (!user) {
    return null;
  }

  if (requireSetup && !user.setupComplete) {
    return null;
  }

  return <>{children}</>;
}
