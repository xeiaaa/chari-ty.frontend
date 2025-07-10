"use client";

import { usePathname } from "next/navigation";
import { PublicHeader } from "./public-header";

const AUTHENTICATED_ROUTES = ["/app"];

export function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthenticatedRoute = AUTHENTICATED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  return (
    <>
      {!isAuthenticatedRoute && <PublicHeader />}
      {children}
    </>
  );
}
