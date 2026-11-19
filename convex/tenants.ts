import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { generateSlug, hasPermission } from "./utils";
import { User } from "./utils";

/**
 * Get tenant by ID
 */
export const getTenant = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.tenantId);
  },
});

/**
 * Get current user's tenant
 */
export const getCurrentTenant = query({
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

    const user = await ctx.db.get(session.userId);
    if (!user || !user.isActive) {
      throw new Error("User not found");
    }

    return await ctx.db.get(user.tenantId);
  },
});

/**
 * Update tenant settings (admin only)
 */
export const updateTenant = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.id("tenants"),
    name: v.optional(v.string()),
    logo: v.optional(v.string()),
    theme: v.optional(
      v.object({
        primaryColor: v.string(),
        secondaryColor: v.string(),
        fontFamily: v.string(),
      })
    ),
    settings: v.optional(
      v.object({
        maxUsers: v.number(),
        maxProjects: v.number(),
        maxStorage: v.number(),
      })
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

    const user = await ctx.db.get(session.userId);
    if (!user || !user.isActive) {
      throw new Error("User not found");
    }

    // Check permissions - only admin can update tenant
    if (user.role !== "admin") {
      throw new Error("Insufficient permissions");
    }

    // Ensure user belongs to this tenant
    if (user.tenantId !== args.tenantId) {
      throw new Error("Cannot update other tenants");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.name) {
      updateData.name = args.name;
      updateData.slug = generateSlug(args.name);
    }
    if (args.logo !== undefined) updateData.logo = args.logo;
    if (args.theme) updateData.theme = args.theme;
    if (args.settings) updateData.settings = args.settings;

    await ctx.db.patch(args.tenantId, updateData);

    return { success: true };
  },
});

/**
 * Get tenant statistics
 */
export const getTenantStats = query({
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

    const user = await ctx.db.get(session.userId);
    if (!user || !user.isActive) {
      throw new Error("User not found");
    }

    const tenantId = user.tenantId;

    // Get counts for various entities
    const [
      userCount,
      projectCount,
      taskCount,
      documentCount,
      activeProjectCount,
      completedTaskCount,
    ] = await Promise.all([
      ctx.db
        .query("users")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect()
        .then((users) => users.length),

      ctx.db
        .query("projects")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .filter((q) => q.eq(q.field("isArchived"), false))
        .collect()
        .then((projects) => projects.length),

      ctx.db
        .query("tasks")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .filter((q) => q.eq(q.field("isArchived"), false))
        .collect()
        .then((tasks) => tasks.length),

      ctx.db
        .query("documents")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .collect()
        .then((documents) => documents.length),

      ctx.db
        .query("projects")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect()
        .then((projects) => projects.length),

      ctx.db
        .query("tasks")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .filter((q) => q.eq(q.field("status"), "done"))
        .collect()
        .then((tasks) => tasks.length),
    ]);

    return {
      userCount,
      projectCount,
      taskCount,
      documentCount,
      activeProjectCount,
      completedTaskCount,
      storageUsed: 0, // TODO: Implement storage calculation
    };
  },
});

/**
 * Get tenant usage limits
 */
export const getTenantLimits = query({
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

    const user = await ctx.db.get(session.userId);
    if (!user || !user.isActive) {
      throw new Error("User not found");
    }

    const tenant = await ctx.db.get(user.tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Get current usage
    const [userCount, projectCount] = await Promise.all([
      ctx.db
        .query("users")
        .withIndex("by_tenant", (q) => q.eq("tenantId", user.tenantId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect()
        .then((users) => users.length),

      ctx.db
        .query("projects")
        .withIndex("by_tenant", (q) => q.eq("tenantId", user.tenantId))
        .filter((q) => q.eq(q.field("isArchived"), false))
        .collect()
        .then((projects) => projects.length),
    ]);

    return {
      limits: tenant.settings,
      usage: {
        users: userCount,
        projects: projectCount,
        storage: 0, // TODO: Implement storage calculation
      },
      canAddUsers: userCount < tenant.settings.maxUsers,
      canAddProjects: projectCount < tenant.settings.maxProjects,
    };
  },
});

/**
 * Check if tenant can accept new users
 */
export const canAddUser = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      return { canAdd: false, reason: "Tenant not found" };
    }

    const userCount = await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect()
      .then((users) => users.length);

    if (userCount >= tenant.settings.maxUsers) {
      return { canAdd: false, reason: "User limit reached" };
    }

    return { canAdd: true };
  },
});

/**
 * Check if tenant can create new projects
 */
export const canAddProject = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      return { canAdd: false, reason: "Tenant not found" };
    }

    const projectCount = await ctx.db
      .query("projects")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect()
      .then((projects) => projects.length);

    if (projectCount >= tenant.settings.maxProjects) {
      return { canAdd: false, reason: "Project limit reached" };
    }

    return { canAdd: true };
  },
});

/**
 * Get all tenants (admin only - for system administration)
 */
export const getAllTenants = query({
  args: {
    sessionToken: v.string(),
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

    const user = await ctx.db.get(session.userId);
    if (!user || !user.isActive) {
      throw new Error("User not found");
    }

    // Check if user is admin (this would be a system-level admin)
    if (user.role !== "admin") {
      throw new Error("Insufficient permissions");
    }

    const limit = args.limit || 50;
    const offset = args.offset || 0;

    // Get all tenants
    const tenants = await ctx.db.query("tenants").collect();

    return {
      tenants: tenants.slice(offset, offset + limit),
      total: tenants.length,
      hasMore: tenants.length > offset + limit,
    };
  },
});

/**
 * Deactivate tenant (admin only)
 */
export const deactivateTenant = mutation({
  args: {
    sessionToken: v.string(),
    tenantId: v.id("tenants"),
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

    const user = await ctx.db.get(session.userId);
    if (!user || !user.isActive) {
      throw new Error("User not found");
    }

    // Check if user is admin (this would be a system-level admin)
    if (user.role !== "admin") {
      throw new Error("Insufficient permissions");
    }

    // Deactivate tenant
    await ctx.db.patch(args.tenantId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    // Deactivate all users in the tenant
    const users = await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    for (const user of users) {
      if (user.isActive) {
        await ctx.db.patch(user._id, {
          isActive: false,
          updatedAt: Date.now(),
        });
      }
    }

    // Deactivate all sessions for users in the tenant
    for (const user of users) {
      const sessions = await ctx.db
        .query("sessions")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      for (const session of sessions) {
        if (session.isActive) {
          await ctx.db.patch(session._id, {
            isActive: false,
          });
        }
      }
    }

    return { success: true };
  },
});
