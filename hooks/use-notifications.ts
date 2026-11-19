"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "./use-convex-auth";

export function useNotifications(filters?: {
  type?:
    | "task_assigned"
    | "task_completed"
    | "comment_added"
    | "project_updated"
    | "mention"
    | "message";
  isRead?: boolean;
}) {
  const { sessionToken } = useCurrentUser();

  const notifications = useQuery(
    api.notifications.getNotifications,
    sessionToken
      ? {
          sessionToken,
          ...filters,
        }
      : "skip"
  );

  return {
    notifications: notifications?.notifications,
    total: notifications?.total,
    unreadCount: notifications?.unreadCount,
    isLoading: !notifications,
  };
}

export function useNotification(notificationId: string) {
  const { sessionToken } = useCurrentUser();

  // Since we don't have a single notification query, we'll get it from the list
  const notifications = useQuery(
    api.notifications.getNotifications,
    sessionToken ? { sessionToken } : "skip"
  );

  const notification = notifications?.notifications?.find(
    (n) => n.id === notificationId
  );

  return { notification, isLoading: !notifications };
}

export function useMarkNotificationAsRead() {
  const { sessionToken } = useCurrentUser();
  const markAsRead = useMutation(api.notifications.markNotificationAsRead);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await markAsRead({
      sessionToken,
      notificationId: notificationId as any,
    });
  };

  return { markAsRead: handleMarkAsRead };
}

export function useMarkAllNotificationsAsRead() {
  const { sessionToken } = useCurrentUser();
  const markAllAsRead = useMutation(
    api.notifications.markAllNotificationsAsRead
  );

  const handleMarkAllAsRead = async (
    type?:
      | "task_assigned"
      | "task_completed"
      | "comment_added"
      | "project_updated"
      | "mention"
      | "message"
  ) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await markAllAsRead({
      sessionToken,
      type,
    });
  };

  return { markAllAsRead: handleMarkAllAsRead };
}

export function useDeleteNotification() {
  const { sessionToken } = useCurrentUser();
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  const handleDeleteNotification = async (notificationId: string) => {
    if (!sessionToken) throw new Error("Not authenticated");

    return await deleteNotification({
      sessionToken,
      notificationId: notificationId as any,
    });
  };

  return { deleteNotification: handleDeleteNotification };
}

export function useNotificationPreferences() {
  const { sessionToken } = useCurrentUser();

  const preferences = useQuery(
    api.notifications.getNotificationPreferences,
    sessionToken ? { sessionToken } : "skip"
  );

  return { preferences, isLoading: !preferences };
}

export function useNotificationStats() {
  const { sessionToken } = useCurrentUser();

  const stats = useQuery(
    api.notifications.getNotificationStats,
    sessionToken ? { sessionToken } : "skip"
  );

  return { stats, isLoading: !stats };
}

export function useUnreadNotificationCount() {
  const { sessionToken } = useCurrentUser();

  const notifications = useQuery(
    api.notifications.getNotifications,
    sessionToken
      ? {
          sessionToken,
          isRead: false,
        }
      : "skip"
  );

  return {
    unreadCount: notifications?.notifications?.length || 0,
    isLoading: !notifications,
  };
}
