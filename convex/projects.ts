import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { auth } from "./auth"

export const createProject = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    clientId: v.optional(v.id("users")),
    managerId: v.id("users"),
    status: v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("on_hold"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
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
      throw new Error("Not authorized to create projects")
    }

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
      tenantId: currentUser.tenantId,
      clientId: args.clientId,
      managerId: args.managerId,
      status: args.status,
      startDate: args.startDate,
      endDate: args.endDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return projectId
  },
})

export const getProjectsByTenant = query({
  handler: async (ctx) => {
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

    return await ctx.db
      .query("projects")
      .withIndex("by_tenant", (q) => q.eq("tenantId", currentUser.tenantId))
      .collect()
  },
})

export const getProject = query({
  args: { projectId: v.id("projects") },
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

    const project = await ctx.db.get(args.projectId)
    if (!project || project.tenantId !== currentUser.tenantId) {
      throw new Error("Project not found or access denied")
    }

    return project
  },
})

export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("planning"),
        v.literal("active"),
        v.literal("on_hold"),
        v.literal("completed"),
        v.literal("cancelled"),
      ),
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
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

    const project = await ctx.db.get(args.projectId)
    if (!project || project.tenantId !== currentUser.tenantId) {
      throw new Error("Project not found or access denied")
    }

    if (
      currentUser.role !== "admin" &&
      currentUser.role !== "project_manager" &&
      project.managerId !== currentUser._id
    ) {
      throw new Error("Not authorized to update this project")
    }

    const { projectId, ...updates } = args
    await ctx.db.patch(projectId, {
      ...updates,
      updatedAt: Date.now(),
    })

    return projectId
  },
})
