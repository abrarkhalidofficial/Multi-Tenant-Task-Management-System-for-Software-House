import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { auth } from "./auth"

export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    tenantId: v.id("tenants"),
    role: v.union(
      v.literal("admin"),
      v.literal("project_manager"),
      v.literal("team_lead"),
      v.literal("member"),
      v.literal("client"),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx)
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      tenantId: args.tenantId,
      role: args.role,
      authId: identity.subject,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return userId
  },
})

export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await auth.getUserIdentity(ctx)
    if (!identity) {
      return null
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first()

    return user
  },
})

export const getUsersByTenant = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const identity = await auth.getUserIdentity(ctx)
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first()

    if (!currentUser || currentUser.tenantId !== args.tenantId) {
      throw new Error("Not authorized")
    }

    return await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect()
  },
})

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("project_manager"),
      v.literal("team_lead"),
      v.literal("member"),
      v.literal("client"),
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

    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "project_manager")) {
      throw new Error("Not authorized")
    }

    const targetUser = await ctx.db.get(args.userId)
    if (!targetUser || targetUser.tenantId !== currentUser.tenantId) {
      throw new Error("User not found or not in same tenant")
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    })

    return args.userId
  },
})
