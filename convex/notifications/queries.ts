import { query } from "../_generated/server"
import { v } from "convex/values"
import { requireUserAndRole } from "../lib/auth"

export const notificationsForUser = query({
  args: {
    tenantId: v.id("tenants"),
    userId: v.id("users"),
  },
  handler: async (ctx, { tenantId, userId }) => {
    // Verify user access
    const currentUser = await requireUserAndRole(ctx, tenantId, [
      "Admin",
      "ProjectManager",
      "TeamLead",
      "Member",
      "Client",
    ])

    // Users can only see their own notifications (unless Admin)
    if (currentUser.role !== "Admin" && currentUser._id !== userId) {
      throw new Error("You can only view your own notifications")
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50)

    return notifications
  },
})

export const unreadNotificationCount = query({
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
      throw new Error("You can only view your own notifications")
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("isRead", false))
      .collect()

    return unreadNotifications.length
  },
})
