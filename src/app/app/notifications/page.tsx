"use client";

import { useState } from "react";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  Notification,
} from "@/lib/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    refetch,
  } = useNotifications(page, limit);
  const { data: unreadCount, refetch: refetchUnreadCount } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead.mutateAsync(notificationId);
    refetch();
    refetchUnreadCount();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync();
    refetch();
    refetchUnreadCount();
  };

  const getNotificationContent = (notification: Notification) => {
    const data = notification.data;
    switch (notification.type) {
      case "donation_received":
        return {
          title: "New donation received",
          message: `${data.donorName} donated ${data.currency}${data.amount} to "${data.fundraiserTitle}"`,
          color: "bg-green-500",
          icon: "💰",
          time: new Date(notification.createdAt).toLocaleDateString(),
        };
      case "fundraiser_goal_reached":
        return {
          title: "Fundraiser goal reached!",
          message: `Congratulations! "${data.fundraiserTitle}" has reached its goal of ${data.currency}${data.goalAmount}!`,
          color: "bg-yellow-500",
          icon: "🎉",
          time: new Date(notification.createdAt).toLocaleDateString(),
        };
      case "group_invitation":
        return {
          title: "Group invitation",
          message: `${data.inviterName} invited you to join "${data.groupName}"`,
          color: "bg-blue-500",
          icon: "📧",
          time: new Date(notification.createdAt).toLocaleDateString(),
        };
      case "invitation_accepted":
        return {
          title: "Invitation accepted",
          message: `${data.acceptedBy} accepted the invitation to join "${data.groupName}" as ${data.role}`,
          color: "bg-green-500",
          icon: "✅",
          time: new Date(notification.createdAt).toLocaleDateString(),
        };
      case "verification_request_submitted":
        return {
          title: "Verification request submitted",
          message: `${data.submittedBy} submitted a verification request for "${data.groupName}"`,
          color: "bg-purple-500",
          icon: "📋",
          time: new Date(notification.createdAt).toLocaleDateString(),
        };
      case "verification_approved":
        return {
          title: "Verification approved",
          message: `Your verification request for "${data.groupName}" has been approved!`,
          color: "bg-green-500",
          icon: "✅",
          time: new Date(notification.createdAt).toLocaleDateString(),
        };
      case "verification_rejected":
        return {
          title: "Verification rejected",
          message: `Your verification request for "${data.groupName}" has been rejected.`,
          color: "bg-red-500",
          icon: "❌",
          time: new Date(notification.createdAt).toLocaleDateString(),
        };
      case "user_removed_from_group":
        return {
          title: "Removed from group",
          message: `${data.removedBy} removed you from "${data.groupName}"`,
          color: "bg-red-500",
          icon: "🚫",
          time: new Date(notification.createdAt).toLocaleDateString(),
        };
      case "user_role_changed":
        return {
          title: "Role changed",
          message: `${data.changedBy} changed your role in "${data.groupName}" from ${data.oldRole} to ${data.newRole}`,
          color: "bg-blue-500",
          icon: "🔄",
          time: new Date(notification.createdAt).toLocaleDateString(),
        };
      default:
        return {
          title: "Notification",
          message: "You have a new notification",
          color: "bg-gray-500",
          icon: "📢",
          time: new Date(notification.createdAt).toLocaleDateString(),
        };
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  if (notificationsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const notifications = notificationsData?.notifications || [];
  const pagination = notificationsData?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount?.count || 0} unread{" "}
            {unreadCount?.count === 1 ? "notification" : "notifications"}
          </p>
        </div>
        <Button
          onClick={handleMarkAllAsRead}
          disabled={
            markAllAsRead.isPending || !unreadCount || unreadCount.count === 0
          }
          variant="outline"
          className="flex items-center gap-2"
        >
          <CheckCheck className="h-4 w-4" />
          {markAllAsRead.isPending ? "Marking..." : "Mark all as read"}
        </Button>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
            <p className="text-muted-foreground">
              You'll see your notifications here when they arrive.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const content = getNotificationContent(notification);

            return (
              <Card
                key={notification.id}
                className={cn(
                  "transition-all duration-200 hover:shadow-md",
                  !notification.read && "border-blue-200 bg-blue-50/30"
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-white text-lg",
                          content.color
                        )}
                      >
                        {content.icon}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm mb-1">
                            {content.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {content.message}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {content.time}
                            </span>
                            {!notification.read && (
                              <Badge variant="secondary" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Mark as read button */}
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={markAsRead.isPending}
                            className="flex-shrink-0"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} notifications
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1
              ).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === pagination.page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
