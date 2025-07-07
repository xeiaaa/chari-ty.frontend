"use client";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface UserGateProps {
  children: React.ReactNode;
}

export function UserGate({ children }: UserGateProps) {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  const fetchUser = async () => {
    const token = await getToken();
    if (!token) throw new Error("No token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL not set");
    const res = await axios.get(`${apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  };

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["me"],
    queryFn: fetchUser,
    enabled: isLoaded && isSignedIn,
    retry: false,
  });

  useEffect(() => {
    if (user && isSignedIn && isLoaded && user.setupComplete === false) {
      router.replace("/onboarding");
    }
  }, [user, isSignedIn, isLoaded, router]);

  if (!isLoaded) return null;
  if (!isSignedIn) return null;
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Could not load user data.</div>;
  if (user && user.setupComplete === false) return null;

  return <>{children}</>;
}
