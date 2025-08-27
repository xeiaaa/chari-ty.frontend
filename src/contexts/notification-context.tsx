"use client";

import React, { createContext, useContext, useEffect } from "react";
import { usePusher } from "@/lib/hooks/use-pusher";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PaginatedNotificationsResponse } from "@/lib/hooks/use-notifications";

interface Notification {
  id: string;
  type: string;
  userId: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  showToast: (notification: Notification) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const { subscribeToNotifications, unsubscribeFromNotifications } =
    usePusher();

  const getNotificationMessage = (notification: Notification) => {
    const data = notification.data;
    switch (notification.type) {
      case "donation_received":
        return `${data.donorName} donated ${data.currency}${data.amount} to "${data.fundraiserTitle}"`;
      case "fundraiser_goal_reached":
        return `Congratulations! "${data.fundraiserTitle}" has reached its goal!`;
      case "group_invitation":
        return `${data.inviterName} invited you to join "${data.groupName}"`;
      case "invitation_accepted":
        return `${data.acceptedBy} accepted the invitation to join "${data.groupName}"`;
      case "verification_request_submitted":
        return `${data.submittedBy} submitted a verification request for "${data.groupName}"`;
      case "verification_approved":
        return `Your verification request for "${data.groupName}" has been approved!`;
      case "verification_rejected":
        return `Your verification request for "${data.groupName}" has been rejected.`;
      case "user_removed_from_group":
        return `${data.removedBy} removed you from "${data.groupName}"`;
      case "user_role_changed":
        return `${data.changedBy} changed your role in "${data.groupName}"`;
      default:
        return "You have a new notification";
    }
  };

  const showToast = (notification: Notification) => {
    const message = getNotificationMessage(notification);

    toast(message, {
      description: "Click to view details",
      action: {
        label: "View",
        onClick: () => {
          // Navigate to notifications page or open dropdown
          window.location.href = "/app/notifications";
        },
      },
    });
  };

  useEffect(() => {
    subscribeToNotifications(
      (notification) => {
        // Show toast notification
        showToast(notification);

        // Update notifications list with deduplication
        queryClient.setQueryData(
          ["notifications", 1, 10],
          (oldData: PaginatedNotificationsResponse | undefined) => {
            if (!oldData) return oldData;

            // Check if notification already exists to prevent duplicates
            const notificationExists = oldData.notifications.some(
              (existingNotification) =>
                existingNotification.id === notification.id
            );

            if (notificationExists) {
              console.log(
                "Notification already exists, skipping duplicate:",
                notification.id
              );
              return oldData;
            }

            return {
              ...oldData,
              notifications: [
                notification,
                ...oldData.notifications.slice(0, -1),
              ],
              pagination: {
                ...oldData.pagination,
                total: oldData.pagination.total + 1,
              },
            };
          }
        );
      },
      (unreadCount) => {
        // Update unread count
        queryClient.setQueryData(
          ["notifications", "unread-count"],
          unreadCount
        );
      }
    );

    return () => {
      unsubscribeFromNotifications();
    };
  }, [subscribeToNotifications, unsubscribeFromNotifications, queryClient]);

  return (
    <NotificationContext.Provider value={{ showToast }}>
      {children}
    </NotificationContext.Provider>
  );
};
