import { mutation } from "../_generated/server"
import { v } from "convex/values"
import { requireUserAndRole } from "../lib/auth"

export const markNotificationRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, { notificationId }) => {
    const notification = await ctx.db.get(notificationId)
    if (!notification) {
      throw new Error("Notification not found")
    }

    // Verify user access
    const currentUser = await requireUserAndRole(ctx, notification.tenantId, [
      "Admin",
      "ProjectManager",
      "TeamLead",
      "Member",
      "Client",
    ])

    // Users can only mark their own notifications as read (unless Admin)
    if (currentUser.role !== "Admin" && currentUser._id !== notification.userId) {
      throw new Error("You can only mark your own notifications as read")
    }

    await ctx.db.patch(notificationId, {
      isRead: true,
    })

    return notificationId
  },
})

export const markAllNotificationsRead = mutation({
  args: {
    tenantId: v.id("tenants"),
    userId: v.id("users"),
  },
  handler: async (ctx, { tenantId, userId }) => {
    const currentUser = await requireUserAndRole(ctx, tenantId, [
      "Admin",
      "ProjectManager",
      "TeamLead",
      "Member",
      "Client",
    ])

    if (currentUser.role !== "Admin" && currentUser._id !== userId) {
      throw new Error("You can only mark your own notifications as read")
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("isRead", false))
      .collect()

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
      })
    }

    return unreadNotifications.length
  },
})
