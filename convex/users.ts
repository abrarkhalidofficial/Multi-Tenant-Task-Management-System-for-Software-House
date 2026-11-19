import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import {
  hasPermission,
  generateToken,
  isValidEmail,
  sanitizeContent,
} from "./utils";
import { User } from "./utils";

/**
 * Get user by ID
 */
export const getUser = query({
  args: {
    userId: v.id("users"),
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

    // Get target user
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Check permissions - users can read other users in their tenant
    if (targetUser.tenantId !== currentUser.tenantId) {
      throw new Error("Cannot access users from other tenants");
    }

    return {
      id: targetUser._id,
      email: targetUser.email,
      name: targetUser.name,
      avatar: targetUser.avatar,
      role: targetUser.role,
      workingHours: targetUser.workingHours,
      team: targetUser.team,
      isActive: targetUser.isActive,
      lastSeenAt: targetUser.lastSeenAt,
      createdAt: targetUser.createdAt,
    };
  },
});

/**
 * Get all users in the current tenant
 */
export const getUsers = query({
  args: {
    sessionToken: v.string(),
    search: v.optional(v.string()),
    team: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("admin"),
        v.literal("project_manager"),
        v.literal("team_lead"),
        v.literal("member"),
        v.literal("client")
      )
    ),
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

    const tenantId = currentUser.tenantId;
    const limit = args.limit || 50;
    const offset = args.offset || 0;

    // Get all users in the tenant
    let users = await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .collect();

    // Apply filters
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      users = users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      );
    }

    if (args.team) {
      users = users.filter((user) => user.team === args.team);
    }

    if (args.role) {
      users = users.filter((user) => user.role === args.role);
    }

    // Filter out inactive users for non-admin users
    if (currentUser.role !== "admin") {
      users = users.filter((user) => user.isActive);
    }

    const total = users.length;
    const paginatedUsers = users.slice(offset, offset + limit);

    return {
      users: paginatedUsers.map((user) => ({
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        workingHours: user.workingHours,
        team: user.team,
        isActive: user.isActive,
        lastSeenAt: user.lastSeenAt,
        createdAt: user.createdAt,
      })),
      total,
      hasMore: total > offset + limit,
    };
  },
});

/**
 * Create new user (admin only)
 */
export const createUser = mutation({
  args: {
    sessionToken: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("project_manager"),
      v.literal("team_lead"),
      v.literal("member"),
      v.literal("client")
    ),
    team: v.optional(v.string()),
    workingHours: v.optional(
      v.object({
        start: v.string(),
        end: v.string(),
        timezone: v.string(),
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

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("User not found");
    }

    // Check permissions - only admin can create users
    if (!hasPermission(currentUser.role, "user", "create")) {
      throw new Error("Insufficient permissions");
    }

    // Validate email
    if (!isValidEmail(args.email)) {
      throw new Error("Invalid email format");
    }

    // Check if email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Check tenant limits
    const tenant = await ctx.db.get(currentUser.tenantId);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    const userCount = await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", currentUser.tenantId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect()
      .then((users) => users.length);

    if (userCount >= tenant.settings.maxUsers) {
      throw new Error("User limit reached for this tenant");
    }

    // Create user
    const userId = await ctx.db.insert("users", {
      tenantId: currentUser.tenantId,
      email: args.email,
      name: sanitizeContent(args.name),
      avatar: undefined,
      role: args.role,
      workingHours: args.workingHours || {
        start: "09:00",
        end: "17:00",
        timezone: "UTC",
      },
      team: args.team,
      isActive: true,
      lastSeenAt: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      userId,
      success: true,
    };
  },
});

/**
 * Update user profile
 */
export const updateUser = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.id("users"),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("admin"),
        v.literal("project_manager"),
        v.literal("team_lead"),
        v.literal("member"),
        v.literal("client")
      )
    ),
    team: v.optional(v.string()),
    workingHours: v.optional(
      v.object({
        start: v.string(),
        end: v.string(),
        timezone: v.string(),
      })
    ),
    isActive: v.optional(v.boolean()),
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

    // Get target user
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Ensure both users are in the same tenant
    if (targetUser.tenantId !== currentUser.tenantId) {
      throw new Error("Cannot modify users from other tenants");
    }

    // Check permissions
    const isOwner = targetUser._id === currentUser._id;
    const canUpdate = hasPermission(
      currentUser.role,
      "user",
      "update",
      isOwner
    );

    if (!canUpdate) {
      throw new Error("Insufficient permissions");
    }

    // Only admin can change role or active status
    if (
      (args.role || args.isActive !== undefined) &&
      currentUser.role !== "admin"
    ) {
      throw new Error("Only admin can change user role or status");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.name) updateData.name = sanitizeContent(args.name);
    if (args.avatar !== undefined) updateData.avatar = args.avatar;
    if (args.role) updateData.role = args.role;
    if (args.team !== undefined) updateData.team = args.team;
    if (args.workingHours) updateData.workingHours = args.workingHours;
    if (args.isActive !== undefined) updateData.isActive = args.isActive;

    await ctx.db.patch(args.userId, updateData);

    return { success: true };
  },
});

/**
 * Get users by team
 */
export const getUsersByTeam = query({
  args: {
    sessionToken: v.string(),
    teamId: v.string(),
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

    // Get users by team
    const users = await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", currentUser.tenantId))
      .filter((q) => q.eq(q.field("team"), args.teamId))
      .collect();

    return users.map((user) => ({
      id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      workingHours: user.workingHours,
      isActive: user.isActive,
      lastSeenAt: user.lastSeenAt,
    }));
  },
});

/**
 * Get online users in tenant
 */
export const getOnlineUsers = query({
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

    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000; // 5 minutes ago

    // Get active sessions
    const activeSessions = await ctx.db
      .query("sessions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .filter((q) => q.gt(q.field("lastActivityAt"), fiveMinutesAgo))
      .collect();

    // Get users for these sessions
    const onlineUsers = [];
    for (const session of activeSessions) {
      const user = await ctx.db.get(session.userId);
      if (user && user.tenantId === currentUser.tenantId && user.isActive) {
        onlineUsers.push({
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          lastSeenAt: user.lastSeenAt,
        });
      }
    }

    return onlineUsers;
  },
});

/**
 * Update user last seen
 */
export const updateLastSeen = mutation({
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

    await ctx.db.patch(session.userId, {
      lastSeenAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get user permissions
 */
export const getUserPermissions = query({
  args: {
    sessionToken: v.string(),
    userId: v.id("users"),
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

    // Get target user
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Ensure both users are in the same tenant
    if (targetUser.tenantId !== currentUser.tenantId) {
      throw new Error("Cannot access users from other tenants");
    }

    // Return permissions based on role
    const role = targetUser.role;

    return {
      canCreateProjects: hasPermission(role, "project", "create"),
      canUpdateProjects: hasPermission(role, "project", "update"),
      canDeleteProjects: hasPermission(role, "project", "delete"),
      canCreateTasks: hasPermission(role, "task", "create"),
      canUpdateTasks: hasPermission(role, "task", "update"),
      canDeleteTasks: hasPermission(role, "task", "delete"),
      canCreateUsers: hasPermission(role, "user", "create"),
      canUpdateUsers: hasPermission(role, "user", "update"),
      canDeleteUsers: hasPermission(role, "user", "delete"),
      canCreateTeams: hasPermission(role, "team", "create"),
      canUpdateTeams: hasPermission(role, "team", "update"),
      canDeleteTeams: hasPermission(role, "team", "delete"),
      canUpdateDocuments: hasPermission(role, "document", "update"),
      canDeleteDocuments: hasPermission(role, "document", "delete"),
    };
  },
});
