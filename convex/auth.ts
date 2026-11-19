import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { generateToken, isValidEmail, sanitizeContent } from "./utils";
import { User } from "./utils";

// Authentication types
export interface AuthUser {
  id: Id<"users">;
  email: string;
  name: string;
  role: string;
  tenantId: Id<"tenants">;
}

/**
 * Sign up a new user with tenant creation
 */
export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    tenantName: v.string(),
  },
  handler: async (ctx, args) => {
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

    // Create tenant
    const tenantId = await ctx.db.insert("tenants", {
      name: args.tenantName,
      slug: args.tenantName.toLowerCase().replace(/\s+/g, "-"),
      logo: undefined,
      theme: {
        primaryColor: "#3b82f6",
        secondaryColor: "#64748b",
        fontFamily: "Inter",
      },
      settings: {
        maxUsers: 10,
        maxProjects: 5,
        maxStorage: 1024 * 1024 * 1024, // 1GB
      },
      subscription: {
        plan: "free",
        status: "active",
      },
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create user
    const userId = await ctx.db.insert("users", {
      tenantId,
      email: args.email,
      name: args.name,
      avatar: undefined,
      role: "admin", // First user is always admin
      workingHours: {
        start: "09:00",
        end: "17:00",
        timezone: "UTC",
      },
      team: undefined,
      isActive: true,
      lastSeenAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create session
    const sessionToken = generateToken();
    const sessionId = await ctx.db.insert("sessions", {
      tenantId,
      userId,
      token: sessionToken,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      isActive: true,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    });

    return {
      userId,
      tenantId,
      sessionToken,
      user: {
        id: userId,
        email: args.email,
        name: args.name,
        role: "admin",
        tenantId,
      },
    };
  },
});

/**
 * Sign in a user
 */
export const signIn = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate email
    if (!isValidEmail(args.email)) {
      throw new Error("Invalid email format");
    }

    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    // Check tenant status
    const tenant = await ctx.db.get(user.tenantId);
    if (!tenant || !tenant.isActive) {
      throw new Error("Tenant is deactivated");
    }

    // Update last seen
    await ctx.db.patch(user._id, {
      lastSeenAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create session
    const sessionToken = generateToken();
    const sessionId = await ctx.db.insert("sessions", {
      tenantId: user.tenantId,
      userId: user._id,
      token: sessionToken,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      isActive: true,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    });

    return {
      userId: user._id,
      tenantId: user.tenantId,
      sessionToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  },
});

/**
 * Sign out a user (deactivate session)
 */
export const signOut = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        isActive: false,
      });
    }

    return { success: true };
  },
});

/**
 * Get current user from session token
 */
export const getCurrentUser = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive || session.expiresAt < Date.now()) {
      return null;
    }

    // Note: We can't update session here since this is a query
    // Session updates should be done in mutations

    const user = await ctx.db.get(session.userId);
    if (!user || !user.isActive) {
      return null;
    }

    // Check tenant status
    const tenant = await ctx.db.get(user.tenantId);
    if (!tenant || !tenant.isActive) {
      return null;
    }

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      avatar: user.avatar,
      workingHours: user.workingHours,
    };
  },
});

/**
 * Refresh session token
 */
export const refreshSession = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive || session.expiresAt < Date.now()) {
      throw new Error("Invalid or expired session");
    }

    // Generate new token
    const newToken = generateToken();

    await ctx.db.patch(session._id, {
      token: newToken,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      lastActivityAt: Date.now(),
    });

    return { sessionToken: newToken };
  },
});

/**
 * Get user by ID (internal use)
 */
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user;
  },
});

/**
 * Update user profile
 */
export const updateProfile = mutation({
  args: {
    sessionToken: v.string(),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    workingHours: v.optional(
      v.object({
        start: v.string(),
        end: v.string(),
        timezone: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Get current user from session token
    const currentUser = await getCurrentUser(ctx, {
      sessionToken: args.sessionToken,
    });

    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.name) updateData.name = sanitizeContent(args.name);
    if (args.avatar) updateData.avatar = args.avatar;
    if (args.workingHours) updateData.workingHours = args.workingHours;

    await ctx.db.patch(currentUser._id, updateData);

    return { success: true };
  },
});

/**
 * Change user role (admin only)
 */
export const changeUserRole = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.id("users"),
    newRole: v.union(
      v.literal("admin"),
      v.literal("project_manager"),
      v.literal("team_lead"),
      v.literal("member"),
      v.literal("client")
    ),
  },
  handler: async (ctx, args) => {
    // Get current user to check permissions
    // Get current user from session token
    const currentUser = await getCurrentUser(ctx, {
      sessionToken: args.sessionToken,
    });

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Insufficient permissions");
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

    await ctx.db.patch(args.userId, {
      role: args.newRole,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Deactivate user (admin only)
 */
export const deactivateUser = mutation({
  args: {
    sessionToken: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get current user to check permissions
    // Get current user from session token
    const currentUser = await getCurrentUser(ctx, {
      sessionToken: args.sessionToken,
    });

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Insufficient permissions");
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

    // Deactivate user
    await ctx.db.patch(args.userId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    // Deactivate all user sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of sessions) {
      if (session.isActive) {
        await ctx.db.patch(session._id, {
          isActive: false,
        });
      }
    }

    return { success: true };
  },
});

/**
 * Get all sessions for a user (admin or self)
 */
export const getUserSessions = query({
  args: {
    sessionToken: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Get session and user
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || !currentUser.isActive) {
      throw new Error("Not authenticated");
    }

    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const targetUserId = args.userId || currentUser._id;

    // Check permissions
    if (targetUserId !== currentUser._id && currentUser.role !== "admin") {
      throw new Error("Insufficient permissions");
    }

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .collect();

    return sessions.map((session) => ({
      id: session._id,
      isActive: session.isActive,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
    }));
  },
});

/**
 * Clean up expired sessions
 */
export const cleanupExpiredSessions = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const expiredSessions = await ctx.db
      .query("sessions")
      .withIndex("by_expires", (q) => q.lt("expiresAt", now))
      .collect();

    let cleanedCount = 0;
    for (const session of expiredSessions) {
      if (session.isActive) {
        await ctx.db.patch(session._id, {
          isActive: false,
        });
        cleanedCount++;
      }
    }

    return { cleanedCount };
  },
});
