import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { auth } from "./auth"

export const createActivityLog = mutation({
  args: {
    entityType: v.union(v.literal("project"), v.literal("task"), v.literal("comment"), v.literal("user")),
    entityId: v.string(),
    action: v.string(),
    details: v.optional(
      v.object({
        field: v.optional(v.string()),
        oldValue: v.optional(v.string()),
        newValue: v.optional(v.string()),
      }),
    ),
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

    const activityId = await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      entityType: args.entityType,
      entityId: args.entityId,
      action: args.action,
      details: args.details,
      createdAt: Date.now(),
    })

    return activityId
  },
})

export const getActivityLogsByEntity = query({
  args: {
    entityType: v.union(v.literal("project"), v.literal("task"), v.literal("comment"), v.literal("user")),
    entityId: v.string(),
    limit: v.optional(v.number()),
  },
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

    const activities = await ctx.db
      .query("activityLogs")
      .withIndex("by_entity", (q) => q.eq("entityType", args.entityType).eq("entityId", args.entityId))
      .order("desc")
      .take(args.limit || 50)

    // Get user information for each activity
    const activitiesWithUsers = await Promise.all(
      activities.map(async (activity) => {
        const user = await ctx.db.get(activity.userId)
        return {
          ...activity,
          user: user ? { name: user.name, email: user.email } : null,
        }
      }),
    )

    return activitiesWithUsers.filter((activity) => activity.tenantId === currentUser.tenantId)
  },
})

export const getRecentActivity = query({
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

    const activities = await ctx.db
      .query("activityLogs")
      .withIndex("by_tenant_created", (q) => q.eq("tenantId", currentUser.tenantId))
      .order("desc")
      .take(args.limit || 20)

    // Get user information for each activity
    const activitiesWithUsers = await Promise.all(
      activities.map(async (activity) => {
        const user = await ctx.db.get(activity.userId)
        return {
          ...activity,
          user: user ? { name: user.name, email: user.email } : null,
        }
      }),
    )

    return activitiesWithUsers
  },
})
