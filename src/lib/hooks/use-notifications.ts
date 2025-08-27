import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "../api";

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
  return useQuery({
    queryKey: ["notifications", page, limit],
    queryFn: async (): Promise<PaginatedNotificationsResponse> => {
      const response = await api.get(
        `/notifications?page=${page}&limit=${limit}`
      );
      return response.data;
    },
  });
};

export const useUnreadCount = () => {
  const api = useApi();

  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async (): Promise<UnreadCountResponse> => {
      const response = await api.get("/notifications/unread-count");
      return response.data;
    },
  });
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
