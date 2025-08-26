"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { CustomUserButton } from "./custom-user-button";

export function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-border bg-white/95 backdrop-blur-sm">
      <Link
        href="/"
        className="flex items-center gap-2 text-2xl font-bold tracking-wider hover:opacity-80 transition-opacity"
      >
        <Heart className="w-6 h-6 text-red-500" />
        <p className="bg-gradient-to-b from-blue-300 to-blue-800 bg-clip-text text-transparent">
          Chari
          <span className="bg-gradient-to-b from-purple-400 to-pink-600 bg-clip-text text-transparent">
            ty
          </span>
        </p>
      </Link>
      <nav className="flex items-center gap-4">
        <SignedIn>
          {pathname !== "/onboarding" && (
            <div className="flex items-center gap-3 bg-gray-50/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200/50">
              <Link
                href="/app/dashboard"
                className="px-4 py-2 text-sm font-semibold rounded-md bg-white hover:bg-gray-50 transition-all duration-300 shadow-sm border border-gray-200 hover:shadow-md hover:scale-105"
              >
                Dashboard
              </Link>
              <CustomUserButton />
            </div>
          )}
        </SignedIn>
        <SignedOut>
          <div className="flex items-center gap-3">
            <Link href="/signin">
              <button className="px-4 py-2 rounded-md border border-border hover:bg-muted transition-all duration-300 hover:scale-105">
                Sign In
              </button>
            </Link>

            <Link href="/signup">
              <button className="px-4 py-2 rounded-md bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md">
                Sign Up
              </button>
            </Link>
          </div>
        </SignedOut>
        <SignedIn>
          {pathname === "/onboarding" && <CustomUserButton />}
        </SignedIn>
      </nav>
    </header>
  );
}
