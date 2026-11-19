import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { requirePermission, requireTenantAccess } from "./middleware";

// Get tenant information
export const getTenant = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    const { user } = await requirePermission(ctx, "tenant.view");

    if (user.tenantId !== args.tenantId) {
      throw new ConvexError(
        "Unauthorized: You don't have access to this tenant"
      );
    }

    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      throw new ConvexError("Tenant not found");
    }

    return tenant;
  },
});

// Update tenant settings
export const updateTenantSettings = mutation({
  args: {
    tenantId: v.id("tenants"),
    settings: v.object({
      branding: v.optional(
        v.object({
          primaryColor: v.optional(v.string()),
          secondaryColor: v.optional(v.string()),
          logoUrl: v.optional(v.string()),
          favicon: v.optional(v.string()),
        })
      ),
      features: v.optional(
        v.object({
          enableClientAccess: v.optional(v.boolean()),
          enableTimeTracking: v.optional(v.boolean()),
          enableFileAttachments: v.optional(v.boolean()),
          maxFileSize: v.optional(v.number()),
          maxStorageSize: v.optional(v.number()),
        })
      ),
    }),
  },
  handler: async (ctx, args) => {
    const { user } = await requirePermission(ctx, "tenant.edit");

    if (user.tenantId !== args.tenantId) {
      throw new ConvexError(
        "Unauthorized: You don't have access to this tenant"
      );
    }

    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      throw new ConvexError("Tenant not found");
    }

    await ctx.db.patch(args.tenantId, {
      settings: args.settings,
      updatedAt: Date.now(),
    });

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: args.tenantId,
      userId: user._id,
      entityType: "tenant",
      entityId: args.tenantId,
      action: "updated",
      details: {
        description: `${user.name} updated tenant settings`,
        field: "settings",
      },
      createdAt: Date.now(),
    });

    return { success: true, message: "Tenant settings updated successfully" };
  },
});

// Get tenant members
export const getTenantMembers = query({
  handler: async (ctx) => {
    const { user } = await requirePermission(ctx, "users.view");

    const members = await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", user.tenantId))
      .collect();

    return members.map((member) => ({
      id: member._id,
      email: member.email,
      name: member.name,
      role: member.role,
      isActive: member.isActive,
      lastLoginAt: member.lastLoginAt,
      createdAt: member.createdAt,
    }));
  },
});

// Update user role
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("project_manager"),
      v.literal("team_lead"),
      v.literal("member"),
      v.literal("client")
    ),
  },
  handler: async (ctx, args) => {
    const { user: currentUser } = await requirePermission(ctx, "users.edit");

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new ConvexError("User not found");
    }

    if (targetUser.tenantId !== currentUser.tenantId) {
      throw new ConvexError("Unauthorized: You don't have access to this user");
    }

    // Prevent users from changing their own role or admin roles
    if (targetUser._id === currentUser._id) {
      throw new ConvexError("You cannot change your own role");
    }

    if (targetUser.role === "admin") {
      throw new ConvexError("Admin roles can only be changed by other admins");
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      entityType: "user",
      entityId: args.userId,
      action: "updated",
      details: {
        description: `${currentUser.name} changed ${targetUser.name}'s role to ${args.role}`,
        field: "role",
        oldValue: targetUser.role,
        newValue: args.role,
      },
      createdAt: Date.now(),
    });

    return { success: true, message: `User role updated to ${args.role}` };
  },
});

// Deactivate user
export const deactivateUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { user: currentUser } = await requirePermission(ctx, "users.edit");

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new ConvexError("User not found");
    }

    if (targetUser.tenantId !== currentUser.tenantId) {
      throw new ConvexError("Unauthorized: You don't have access to this user");
    }

    // Prevent users from deactivating themselves or other admins
    if (targetUser._id === currentUser._id) {
      throw new ConvexError("You cannot deactivate your own account");
    }

    if (targetUser.role === "admin") {
      throw new ConvexError("Admin accounts cannot be deactivated");
    }

    await ctx.db.patch(args.userId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      entityType: "user",
      entityId: args.userId,
      action: "deactivated",
      details: {
        description: `${currentUser.name} deactivated ${targetUser.name}'s account`,
      },
      createdAt: Date.now(),
    });

    return { success: true, message: "User account deactivated successfully" };
  },
});

// Reactivate user
export const reactivateUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { user: currentUser } = await requirePermission(ctx, "users.edit");

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new ConvexError("User not found");
    }

    if (targetUser.tenantId !== currentUser.tenantId) {
      throw new ConvexError("Unauthorized: You don't have access to this user");
    }

    await ctx.db.patch(args.userId, {
      isActive: true,
      updatedAt: Date.now(),
    });

    // Create activity log
    await ctx.db.insert("activityLogs", {
      tenantId: currentUser.tenantId,
      userId: currentUser._id,
      entityType: "user",
      entityId: args.userId,
      action: "reactivated",
      details: {
        description: `${currentUser.name} reactivated ${targetUser.name}'s account`,
      },
      createdAt: Date.now(),
    });

    return { success: true, message: "User account reactivated successfully" };
  },
});
