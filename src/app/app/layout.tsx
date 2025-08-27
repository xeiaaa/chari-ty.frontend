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
  Mail,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useUser as useClerkUser } from "@clerk/nextjs";
import { useUser } from "@/lib/hooks/use-user";
import { useSignOut } from "@/lib/hooks/use-sign-out";
import {
  useNotifications,
  useUnreadCount,
  useMarkAllAsRead,
  useMarkAsRead,
  Notification,
} from "@/lib/hooks/use-notifications";

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
  { name: "Donation Payouts", href: "/app/payouts", icon: CreditCard },
  { name: "Invitations", href: "/app/invitations", icon: Mail },
  { name: "Notifications", href: "/app/notifications", icon: Bell },
  { name: "Settings", href: "/app/settings", icon: Settings },
];

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user: clerkUser, isLoaded: isUserLoaded } = useClerkUser();
  const { user: appUser } = useUser();
  const { signOut } = useSignOut();
  const { data: notifications, isLoading: notificationsLoading } =
    useNotifications(1, 10);
  const { data: unreadCount, isLoading: unreadCountLoading } = useUnreadCount();
  const markAllAsRead = useMarkAllAsRead();
  const markAsRead = useMarkAsRead();

  console.log({ notifications, unreadCount });

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
          <div className="flex flex-row gap-4 justify-center items-center">
            <div className="h-16 items-center flex-shrink-0 hidden lg:flex">
              <Link
                href="/"
                className="text-xl font-bold hover:opacity-80 transition-opacity"
              >
                Chari-ty
              </Link>
            </div>
            <TeamSwitcher />
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            {!isUserLoaded ? (
              <Skeleton className="h-8 w-8 rounded-full" />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8"
                  >
                    <Bell className="h-5 w-5" />
                    {/* Notification badge */}
                    {!unreadCountLoading &&
                      unreadCount &&
                      unreadCount.count > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                          {unreadCount.count > 99 ? "99+" : unreadCount.count}
                        </span>
                      )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-80 h-96 flex flex-col"
                >
                  <div className="flex items-center justify-between">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      disabled={
                        markAllAsRead.isPending ||
                        !unreadCount ||
                        unreadCount.count === 0
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        markAllAsRead.mutate();
                      }}
                    >
                      {markAllAsRead.isPending
                        ? "Marking..."
                        : "Mark all as read"}
                    </Button>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {notificationsLoading ? (
                      // Loading state
                      Array.from({ length: 3 }).map((_, index) => (
                        <div
                          key={`loading-skeleton-${index}`}
                          className="p-3 rounded-lg border border-border"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-gray-300 mt-2 flex-shrink-0 animate-pulse" />
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="h-4 bg-gray-200 rounded animate-pulse" />
                              <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : notifications &&
                      notifications.notifications &&
                      notifications.notifications.length > 0 ? (
                      // Real notifications
                      notifications.notifications.map((notification) => {
                        const getNotificationContent = (
                          notification: Notification
                        ) => {
                          const data = notification.data;
                          switch (notification.type) {
                            case "donation_received":
                              return {
                                title: "New donation received",
                                message: `${data.donorName} donated ${data.currency}${data.amount} to "${data.fundraiserTitle}"`,
                                color: "bg-green-500",
                                time: new Date(
                                  notification.createdAt
                                ).toLocaleDateString(),
                              };
                            case "fundraiser_goal_reached":
                              return {
                                title: "Fundraiser goal reached!",
                                message: `Congratulations! "${data.fundraiserTitle}" has reached its goal of ${data.currency}${data.goalAmount}!`,
                                color: "bg-yellow-500",
                                time: new Date(
                                  notification.createdAt
                                ).toLocaleDateString(),
                              };
                            case "group_invitation":
                              return {
                                title: "Group invitation",
                                message: `${data.inviterName} invited you to join "${data.groupName}"`,
                                color: "bg-blue-500",
                                time: new Date(
                                  notification.createdAt
                                ).toLocaleDateString(),
                              };
                            case "invitation_accepted":
                              return {
                                title: "Invitation accepted",
                                message: `${data.acceptedBy} accepted the invitation to join "${data.groupName}" as ${data.role}`,
                                color: "bg-green-500",
                                time: new Date(
                                  notification.createdAt
                                ).toLocaleDateString(),
                              };
                            case "verification_request_submitted":
                              return {
                                title: "Verification request submitted",
                                message: `${data.submittedBy} submitted a verification request for "${data.groupName}"`,
                                color: "bg-purple-500",
                                time: new Date(
                                  notification.createdAt
                                ).toLocaleDateString(),
                              };
                            case "verification_approved":
                              return {
                                title: "Verification approved",
                                message: `Your verification request for "${data.groupName}" has been approved!`,
                                color: "bg-green-500",
                                time: new Date(
                                  notification.createdAt
                                ).toLocaleDateString(),
                              };
                            case "verification_rejected":
                              return {
                                title: "Verification rejected",
                                message: `Your verification request for "${data.groupName}" has been rejected.`,
                                color: "bg-red-500",
                                time: new Date(
                                  notification.createdAt
                                ).toLocaleDateString(),
                              };
                            case "user_removed_from_group":
                              return {
                                title: "Removed from group",
                                message: `${data.removedBy} removed you from "${data.groupName}"`,
                                color: "bg-red-500",
                                time: new Date(
                                  notification.createdAt
                                ).toLocaleDateString(),
                              };
                            case "user_role_changed":
                              return {
                                title: "Role changed",
                                message: `${data.changedBy} changed your role in "${data.groupName}" from ${data.oldRole} to ${data.newRole}`,
                                color: "bg-blue-500",
                                time: new Date(
                                  notification.createdAt
                                ).toLocaleDateString(),
                              };
                            default:
                              return {
                                title: "Notification",
                                message: "You have a new notification",
                                color: "bg-gray-500",
                                time: new Date(
                                  notification.createdAt
                                ).toLocaleDateString(),
                              };
                          }
                        };

                        const content = getNotificationContent(notification);

                        return (
                          <div
                            key={notification.id}
                            className={`p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer ${
                              !notification.read ? "bg-blue-50/50" : ""
                            }`}
                            onClick={() => {
                              if (!notification.read) {
                                markAsRead.mutate(notification.id);
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-2 h-2 rounded-full ${content.color} mt-2 flex-shrink-0`}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">
                                  {content.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {content.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {content.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      // Empty state
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No notifications yet
                      </div>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    asChild
                    className="justify-center text-sm text-muted-foreground flex-shrink-0"
                  >
                    <Link href="/app/notifications">
                      View all notifications
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* User Avatar */}
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
                        src={clerkUser?.imageUrl}
                        alt={clerkUser?.fullName || "User"}
                      />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    {clerkUser?.fullName || "User"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
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
              "fixed top-16 bottom-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col",
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="flex h-16 items-center px-6 flex-shrink-0 lg:hidden">
              <Link
                href="/"
                className="text-xl font-bold hover:opacity-80 transition-opacity"
              >
                Chari-ty
              </Link>
            </div>
            <nav className="flex flex-col gap-1 p-4 flex-1">
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

              {/* Admin Label */}
              {appUser?.isAdmin && (
                <div className="mt-auto pt-4 border-t border-border">
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span>Admin Dashboard</span>
                  </Link>
                </div>
              )}
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
