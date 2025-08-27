import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "../api";
import { usePusher } from "./use-pusher";
import { useEffect } from "react";

export interface Notification {
  id: string;
  type: string;
  userId: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface PaginatedNotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const useNotifications = (page: number = 1, limit: number = 10) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { subscribeToNotifications, unsubscribeFromNotifications } =
    usePusher();

  const query = useQuery({
    queryKey: ["notifications", page, limit],
    queryFn: async (): Promise<PaginatedNotificationsResponse> => {
      const response = await api.get(
        `/notifications?page=${page}&limit=${limit}`
      );
      return response.data;
    },
  });

  // Subscribe to real-time notifications
  useEffect(() => {
    subscribeToNotifications(
      (notification) => {
        // Add new notification to the first page with deduplication
        queryClient.setQueryData(
          ["notifications", 1, limit],
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
  }, [
    subscribeToNotifications,
    unsubscribeFromNotifications,
    queryClient,
    limit,
  ]);

  return query;
};

export const useUnreadCount = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { subscribeToNotifications, unsubscribeFromNotifications } =
    usePusher();

  const query = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async (): Promise<UnreadCountResponse> => {
      const response = await api.get("/notifications/unread-count");
      return response.data;
    },
  });

  // Subscribe to real-time unread count updates
  useEffect(() => {
    subscribeToNotifications(
      () => {
        // Notification received, unread count will be updated by the notification handler
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

  return query;
};

export const useMarkAllAsRead = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post("/notifications/mark-all-read");
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch notifications and unread count
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });
};

export const useMarkAsRead = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.post(`/notifications/${notificationId}/read`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch notifications and unread count
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });
};
