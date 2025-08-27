"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomUserButton } from "./custom-user-button";

export function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-16 border-b border-border px-4 lg:px-8 flex items-center bg-white">
      <div className="flex flex-row gap-4 justify-center items-center">
        <div className="h-16 items-center flex-shrink-0 hidden lg:flex">
          <Link
            href="/"
            className="text-xl font-bold hover:opacity-80 transition-opacity"
          >
            Chari-ty
          </Link>
        </div>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <SignedIn>
          {pathname !== "/onboarding" && (
            <>
              {/* Dashboard Link */}
              <Link
                href="/app/dashboard"
                className="px-4 py-2 text-sm font-semibold rounded-md bg-white hover:bg-gray-50 transition-all duration-300 shadow-sm border border-gray-200 hover:shadow-md hover:scale-105"
              >
                Dashboard
              </Link>

              {/* Notification Bell */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8"
                  >
                    <Bell className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <span>No notifications</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <CustomUserButton />
            </>
          )}
        </SignedIn>
        <SignedOut>
          <div className="flex items-center gap-3">
            <Link href="/signin">
              <button className="px-4 py-2 text-sm font-semibold rounded-md bg-white hover:bg-gray-50 transition-all duration-300 shadow-sm border border-gray-200 hover:shadow-md hover:scale-105">
                Sign In
              </button>
            </Link>

            <Link href="/signup">
              <button className="px-4 py-2 text-sm font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105">
                Sign Up
              </button>
            </Link>
          </div>
        </SignedOut>
        <SignedIn>
          {pathname === "/onboarding" && <CustomUserButton />}
        </SignedIn>
      </div>
    </header>
  );
}
