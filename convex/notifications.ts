import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { auth } from "./auth"

export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("task_assigned"),
      v.literal("task_updated"),
      v.literal("task_commented"),
      v.literal("project_updated"),
      v.literal("mention"),
    ),
    title: v.string(),
    message: v.string(),
    entityType: v.optional(v.union(v.literal("project"), v.literal("task"), v.literal("comment"))),
    entityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx)
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first()

    if (!currentUser) {
      throw new Error("User not found")
    }

    const targetUser = await ctx.db.get(args.userId)
    if (!targetUser || targetUser.tenantId !== currentUser.tenantId) {
      throw new Error("Target user not found or not in same tenant")
    }

    const notificationId = await ctx.db.insert("notifications", {
      tenantId: currentUser.tenantId,
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      entityType: args.entityType,
      entityId: args.entityId,
      isRead: false,
      createdAt: Date.now(),
    })

    return notificationId
  },
})

export const getUserNotifications = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx)
    if (!identity) {
      return []
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first()

    if (!currentUser) {
      return []
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) => q.eq("userId", currentUser._id))
      .order("desc")
      .take(args.limit || 50)

    return notifications
  },
})

export const getUnreadNotificationCount = query({
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx)
    if (!identity) {
      return 0
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first()

    if (!currentUser) {
      return 0
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", currentUser._id).eq("isRead", false))
      .collect()

    return unreadNotifications.length
  },
})

export const markNotificationAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx)
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first()

    if (!currentUser) {
      throw new Error("User not found")
    }

    const notification = await ctx.db.get(args.notificationId)
    if (!notification || notification.userId !== currentUser._id) {
      throw new Error("Notification not found or access denied")
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
    })

    return args.notificationId
  },
})

export const markAllNotificationsAsRead = mutation({
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx)
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first()

    if (!currentUser) {
      throw new Error("User not found")
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", currentUser._id).eq("isRead", false))
      .collect()

    await Promise.all(
      unreadNotifications.map((notification) =>
        ctx.db.patch(notification._id, {
          isRead: true,
        }),
      ),
    )

    return unreadNotifications.length
  },
})

export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx)
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first()

    if (!currentUser) {
      throw new Error("User not found")
    }

    const notification = await ctx.db.get(args.notificationId)
    if (!notification || notification.userId !== currentUser._id) {
      throw new Error("Notification not found or access denied")
    }

    await ctx.db.delete(args.notificationId)
    return args.notificationId
  },
})
