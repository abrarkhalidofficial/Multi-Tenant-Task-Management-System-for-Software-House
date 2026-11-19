import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { formatRelativeTime } from "./utils";
import { Notification, User } from "./utils";

/**
 * Get user's notifications
 */
export const getNotifications = query({
  args: {
    sessionToken: v.string(),
    type: v.optional(
      v.union(
        v.literal("task_assigned"),
        v.literal("task_completed"),
        v.literal("comment_added"),
        v.literal("project_updated"),
        v.literal("mention"),
        v.literal("message")
      )
    ),
    isRead: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    const limit = args.limit || 20;
    const offset = args.offset || 0;

    // Get notifications
    let notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .collect();

    // Apply filters
    if (args.type) {
      notifications = notifications.filter(
        (notification) => notification.type === args.type
      );
    }

    if (args.isRead !== undefined) {
      notifications = notifications.filter(
        (notification) => notification.isRead === args.isRead
      );
    }

    // Sort by creation date (newest first)
    notifications.sort((a, b) => b.createdAt - a.createdAt);

    const total = notifications.length;
    const paginatedNotifications = notifications.slice(offset, offset + limit);

    // Get additional data for each notification
    const notificationsWithData = await Promise.all(
      paginatedNotifications.map(async (notification) => {
        let relatedData = null;

        // Get related data based on notification type
        if (notification.data) {
          if (notification.data.senderId) {
            const sender = await ctx.db.get(notification.data.senderId);
            if (sender) {
              relatedData = {
                sender: {
                  id: sender._id,
                  name: sender.name,
                  avatar: sender.avatar,
                },
              };
            }
          }

          if (notification.data.projectId) {
            const project = await ctx.db.get(notification.data.projectId);
            if (project) {
              relatedData = {
                ...relatedData,
                project: {
                  id: project._id,
                  name: project.name,
                },
              };
            }
          }

          if (notification.data.taskId) {
            const task = await ctx.db.get(notification.data.taskId);
            if (task) {
              relatedData = {
                ...relatedData,
                task: {
                  id: task._id,
                  name: task.name,
                },
              };
            }
          }

          if (notification.data.conversationId) {
            const conversation = await ctx.db.get(
              notification.data.conversationId
            );
            if (conversation) {
              relatedData = {
                ...relatedData,
                conversation: {
                  id: conversation._id,
                  name: conversation.name,
                  type: conversation.type,
                },
              };
            }
          }
        }

        return {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          relatedData,
          isRead: notification.isRead,
          readAt: notification.readAt,
          createdAt: notification.createdAt,
          relativeTime: formatRelativeTime(notification.createdAt),
        };
      })
    );

    return {
      notifications: notificationsWithData,
      total,
      hasMore: total > offset + limit,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    };
  },
});

/**
 * Mark notification as read
 */
export const markNotificationAsRead = mutation({
  args: {
    sessionToken: v.string(),
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Get notification
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    // Ensure notification belongs to current user
    if (notification.userId !== currentUser._id) {
      throw new Error("Cannot mark other users' notifications as read");
    }

    // Ensure notification belongs to user's tenant
    if (notification.tenantId !== currentUser.tenantId) {
      throw new Error("Cannot access notifications from other tenants");
    }

    // Mark as read
    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = mutation({
  args: {
    sessionToken: v.string(),
    type: v.optional(
      v.union(
        v.literal("task_assigned"),
        v.literal("task_completed"),
        v.literal("comment_added"),
        v.literal("project_updated"),
        v.literal("mention"),
        v.literal("message")
      )
    ),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Get unread notifications
    let notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", currentUser._id).eq("isRead", false)
      )
      .collect();

    // Filter by type if provided
    if (args.type) {
      notifications = notifications.filter(
        (notification) => notification.type === args.type
      );
    }

    // Mark all as read
    let markedCount = 0;
    for (const notification of notifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
        readAt: Date.now(),
      });
      markedCount++;
    }

    return {
      success: true,
      markedCount,
    };
  },
});

/**
 * Delete notification
 */
export const deleteNotification = mutation({
  args: {
    sessionToken: v.string(),
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Get notification
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    // Ensure notification belongs to current user
    if (notification.userId !== currentUser._id) {
      throw new Error("Cannot delete other users' notifications");
    }

    // Ensure notification belongs to user's tenant
    if (notification.tenantId !== currentUser.tenantId) {
      throw new Error("Cannot access notifications from other tenants");
    }

    // Delete notification
    await ctx.db.delete(args.notificationId);

    return { success: true };
  },
});

/**
 * Get notification preferences
 */
export const getNotificationPreferences = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Return default preferences (can be extended with user-specific preferences)
    return {
      taskAssigned: true,
      taskCompleted: true,
      commentAdded: true,
      projectUpdated: true,
      mention: true,
      message: true,
      emailNotifications: true,
      inAppNotifications: true,
    };
  },
});

/**
 * Create notification (internal use)
 */
export const createNotification = mutation({
  args: {
    tenantId: v.id("tenants"),
    userId: v.id("users"),
    type: v.union(
      v.literal("task_assigned"),
      v.literal("task_completed"),
      v.literal("comment_added"),
      v.literal("project_updated"),
      v.literal("mention"),
      v.literal("message")
    ),
    title: v.string(),
    message: v.string(),
    data: v.optional(
      v.object({
        projectId: v.optional(v.id("projects")),
        taskId: v.optional(v.id("tasks")),
        commentId: v.optional(v.id("comments")),
        conversationId: v.optional(v.id("conversations")),
        messageId: v.optional(v.id("messages")),
        senderId: v.optional(v.id("users")),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Create notification
    const notificationId = await ctx.db.insert("notifications", {
      tenantId: args.tenantId,
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      data: args.data,
      isRead: false,
      createdAt: Date.now(),
    });

    return { notificationId, success: true };
  },
});

/**
 * Get notification statistics
 */
export const getNotificationStats = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Get all notifications for the user
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .collect();

    // Calculate statistics
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.isRead).length;
    const read = total - unread;

    const byType: Record<string, number> = {
      task_assigned: notifications.filter((n) => n.type === "task_assigned")
        .length,
      task_completed: notifications.filter((n) => n.type === "task_completed")
        .length,
      comment_added: notifications.filter((n) => n.type === "comment_added")
        .length,
      project_updated: notifications.filter((n) => n.type === "project_updated")
        .length,
      mention: notifications.filter((n) => n.type === "mention").length,
      message: notifications.filter((n) => n.type === "message").length,
    };

    // Get last 7 days statistics
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentNotifications = notifications.filter(
      (n) => n.createdAt > sevenDaysAgo
    );

    return {
      total,
      unread,
      read,
      byType,
      recentCount: recentNotifications.length,
      recentUnreadCount: recentNotifications.filter((n) => !n.isRead).length,
    };
  },
});

/**
 * Clean up old notifications
 */
export const cleanupOldNotifications = mutation({
  args: {
    sessionToken: v.string(),
    daysToKeep: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get current user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Only admin can cleanup notifications
    if (currentUser.role !== "admin") {
      throw new Error("Insufficient permissions");
    }

    const daysToKeep = args.daysToKeep || 30;
    const cutoffDate = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

    // Get old notifications
    const oldNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_created", (q) => q.lt("createdAt", cutoffDate))
      .collect();

    // Delete old notifications
    let deletedCount = 0;
    for (const notification of oldNotifications) {
      if (notification.tenantId === currentUser.tenantId) {
        await ctx.db.delete(notification._id);
        deletedCount++;
      }
    }

    return {
      success: true,
      deletedCount,
    };
  },
});
