"use client";

import { AuthGate } from "@/components/ui/auth-gate";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  GalleryHorizontalEnd,
  Settings,
  Menu,
  X,
  User,
  LogOut,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamSwitcher } from "@/components/ui/team-switcher";

const navigation = [
  { name: "Dashboard", href: "/app/dashboard", icon: Home },
  {
    name: "Fundraisers",
    href: "/app/fundraisers",
    icon: GalleryHorizontalEnd,
  },
  { name: "Payouts", href: "/app/payouts", icon: CreditCard },
  { name: "Settings", href: "/app/settings", icon: Settings },
];

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, isLoaded: isUserLoaded } = useUser();
  const { signOut } = useClerk();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <AuthGate>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-30 h-16 border-b border-border px-4 lg:px-8 flex items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden mr-2"
          >
            {isSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          <TeamSwitcher />
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            {!isUserLoaded ? (
              <Skeleton className="h-8 w-8 rounded-full" />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar>
                      <AvatarImage
                        src={user?.imageUrl}
                        alt={user?.fullName || "User"}
                      />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    {user?.fullName || "User"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        <div className="flex flex-1">
          {/* Sidebar */}
          <div
            className={cn(
              "fixed inset-y-16 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="flex h-16 items-center px-6">
              <Link
                href="/"
                className="text-xl font-bold hover:opacity-80 transition-opacity"
              >
                Chari-ty
              </Link>
            </div>
            <nav className="flex flex-col gap-1 p-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1 lg:pl-64">
            <main className="p-4 pt-28">
              {/* Overlay for mobile sidebar */}
              {isSidebarOpen && (
                <div
                  className="fixed inset-0 bg-black/20 z-30 lg:hidden"
                  onClick={() => setIsSidebarOpen(false)}
                />
              )}
              {children}
            </main>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
