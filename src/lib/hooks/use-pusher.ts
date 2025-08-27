import { useEffect, useRef, useState } from "react";
import Pusher, { Channel } from "pusher-js";
import { useUser } from "./use-user";

interface PusherNotification {
  id: string;
  type: string;
  userId: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

interface PusherUnreadCount {
  count: number;
}

export const usePusher = () => {
  const { user } = useUser();
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<Channel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    // Check for required environment variables
    if (
      !process.env.NEXT_PUBLIC_PUSHER_API_KEY ||
      !process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    ) {
      console.error("Missing Pusher environment variables");
      return;
    }

    // Initialize Pusher
    pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_API_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      authEndpoint: "/api/pusher/auth",
    });

    // Subscribe to user's private channel
    const channelName = `private-user-${user.id}`;
    channelRef.current = pusherRef.current.subscribe(channelName);

    // Handle connection events
    pusherRef.current.connection.bind("connected", () => {
      setIsConnected(true);
      console.log("Connected to Pusher");
    });

    pusherRef.current.connection.bind("disconnected", () => {
      setIsConnected(false);
      console.log("Disconnected from Pusher");
    });

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        pusherRef.current?.unsubscribe(channelName);
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
      }
    };
  }, [user?.id]);

  const subscribeToNotifications = (
    onNotification: (notification: PusherNotification) => void,
    onUnreadCountUpdate: (count: PusherUnreadCount) => void
  ) => {
    if (!channelRef.current) return;

    // Listen for new notifications
    channelRef.current.bind(
      "notification",
      (data: { notification: PusherNotification }) => {
        console.log("Received notification:", data.notification);
        onNotification(data.notification);
      }
    );

    // Listen for unread count updates
    channelRef.current.bind(
      "unread-count-update",
      (data: PusherUnreadCount) => {
        console.log("Received unread count update:", data);
        onUnreadCountUpdate(data);
      }
    );
  };

  const unsubscribeFromNotifications = () => {
    if (!channelRef.current) return;

    channelRef.current.unbind("notification");
    channelRef.current.unbind("unread-count-update");
  };

  return {
    isConnected,
    subscribeToNotifications,
    unsubscribeFromNotifications,
  };
};
